<script lang="ts">
	import { onMount } from "svelte";
	import stringsData from "$lib/jaywalking/strings.json";
	import { iconItems } from "$lib/jaywalking/iconData";
	import IntroStep from "$lib/jaywalking/steps/IntroStep.svelte";
	import HomeStep from "$lib/jaywalking/steps/HomeStep.svelte";
	import IdentityStep from "$lib/jaywalking/steps/IdentityStep.svelte";
	import TermsStep from "$lib/jaywalking/steps/TermsStep.svelte";
	import FinishStep from "$lib/jaywalking/steps/FinishStep.svelte";
	import ModalGate from "$lib/jaywalking/components/ModalGate.svelte";
	import TranslateButton from "$lib/jaywalking/components/TranslateButton.svelte";
	import RightSidebar from "$lib/jaywalking/components/RightSidebar.svelte";
	import bannerImg from "$lib/jaywalking/image.png";
	import camera from "$lib/jaywalking/camera.png";
	import card from "$lib/jaywalking/card.png";
	import rocket from "$lib/jaywalking/rocket.png";
	import video from "$lib/jaywalking/video.png";

	const strings = stringsData.strings;

	type Locale = keyof typeof strings;
	type StringKey = keyof (typeof strings)[Locale];

	let locale: Locale = $state((stringsData.localeDefault ?? "zh") as Locale);

	const t = (activeLocale: Locale, key: StringKey | string) => {
		const localeDict = strings[activeLocale];

		if (localeDict && Object.prototype.hasOwnProperty.call(localeDict, key)) {
			return localeDict[key as StringKey];
		}

		return key;
	};

	const quickActions: Array<{ id: string; src: string; labelKey: StringKey; dot?: boolean }> = [
		{ id: "scan", src: camera, labelKey: "quick.scan" },
		{ id: "pay", src: card, labelKey: "quick.pay", dot: true },
		{ id: "transport", src: rocket, labelKey: "quick.transport" },
		{ id: "pocket", src: video, labelKey: "quick.pocket" }
	];

	const tabs: StringKey[] = [
		"tab.regular",
		"tab.transport",
		"tab.food",
		"tab.tour",
		"tab.shopping"
	];

	let step = $state<1 | 2 | 3 | 4 | 5>(1);
	let showModal = $state(false);

	let firstName = $state("");
	let lastName = $state("");
	let photoStep = $state<"left" | "right" | "done">("left");
	let leftPhoto = $state<string | null>(null);
	let rightPhoto = $state<string | null>(null);
	let cameraError = $state("");
	let showShame = $state(false);
	let termsSecondsLeft = $state(300);

	// TODO: Store captured identity data in Firebase instead of local state.
	const fullName = () => `${firstName} ${lastName}`.trim();

	let cameraStream: MediaStream | null = null;
	let videoEl: HTMLVideoElement | null = null;

	const openGate = () => {
		showModal = true;
	};

	const closeGate = () => {
		showModal = false;
	};

	const handleModalAction = () => {
		showModal = false;
		step = 3;
		resetPhotoFlow();
		cameraError = "";
	};

	const toggleLocale = () => {
		console.log("toggle locale");
		locale = locale === "zh" ? "en" : "zh";
	};

	const attachStream = () => {
		if (!videoEl || !cameraStream) {
			return;
		}
		videoEl.srcObject = cameraStream;
		void videoEl.play();
	};

	const startCamera = async () => {
		cameraError = "";
		if (!navigator.mediaDevices?.getUserMedia) {
			cameraError = "Sorry, you have to take a picture and try again.";
			return;
		}
		try {
			cameraStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "user" },
				audio: false
			});
			attachStream();
		} catch (error) {
			console.error(error);
			cameraError = "Sorry, you have to take a picture and try again.";
		}
	};

	const stopCamera = () => {
		cameraStream?.getTracks().forEach((track) => track.stop());
		cameraStream = null;
	};

	const capturePhoto = () => {
		if (!videoEl) {
			return;
		}
		const canvas = document.createElement("canvas");
		const width = videoEl.videoWidth || 480;
		const height = videoEl.videoHeight || 480;
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}
		ctx.drawImage(videoEl, 0, 0, width, height);
		const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
		if (photoStep === "left") {
			leftPhoto = dataUrl;
			photoStep = "right";
			return;
		}
		if (photoStep === "right") {
			rightPhoto = dataUrl;
			photoStep = "done";
			stopCamera();
		}
	};

	const resetPhotoFlow = () => {
		leftPhoto = null;
		rightPhoto = null;
		photoStep = "left";
		cameraError = "";
		startCamera();
	};

	const restartFlow = () => {
		step = 1;
		showShame = false;
		resetPhotoFlow();
		firstName = "";
		lastName = "";
	};

	const timeFormatter = new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit"
	});
	let localTime = $state(timeFormatter.format(new Date()));

	const termsLabel = () => {
		const minutes = Math.floor(termsSecondsLeft / 60);
		const seconds = String(termsSecondsLeft % 60).padStart(2, "0");
		return `${minutes}:${seconds}`;
	};

	onMount(() => {
		const tick = () => {
			localTime = timeFormatter.format(new Date());
		};

		const timer = setInterval(tick, 1000 * 30);
		return () => clearInterval(timer);
	});

	$effect(() => {
		if (step === 3) {
			startCamera();
			attachStream();
			return () => stopCamera();
		}
		stopCamera();
	});

	$effect(() => {
		if (step !== 4) {
			return;
		}
		termsSecondsLeft = 300;
		const interval = setInterval(() => {
			termsSecondsLeft = Math.max(0, termsSecondsLeft - 1);
		}, 1000);
		return () => clearInterval(interval);
	});
</script>

<div class="jaywalking">
	<RightSidebar
		showShame={showShame}
		name={fullName()}
		photoSrc={rightPhoto ?? leftPhoto}
		message="Skipped the full terms. Please try reading next time."
	/>

	{#if step === 1}
		<IntroStep onStart={() => (step = 2)} />
	{:else if step === 2}
		<HomeStep
			localTime={localTime}
			locale={locale}
			t={t}
			openGate={openGate}
			quickActions={quickActions}
			tabs={tabs}
			iconItems={iconItems}
			bannerImg={bannerImg}
		/>
	{:else if step === 3}
		<IdentityStep
			bind:firstName
			bind:lastName
			photoStep={photoStep}
			leftPhoto={leftPhoto}
			rightPhoto={rightPhoto}
			cameraError={cameraError}
			bind:videoEl
			onBack={() => (step = 2)}
			onContinue={() => (step = 4)}
			onCapture={capturePhoto}
			onReset={resetPhotoFlow}
			onRetry={startCamera}
		/>
	{:else if step === 4}
		<TermsStep
			termsLabel={termsLabel}
			onBack={() => (step = 3)}
			onAgree={() => {
				if (termsSecondsLeft > 0) {
					showShame = true;
				}
				step = 5;
			}}
		/>
	{:else}
		<FinishStep onRestart={restartFlow} />
	{/if}

	<TranslateButton label={t(locale, "translate")} onTranslate={toggleLocale} />

	<ModalGate
		open={showModal}
		title={t(locale, "modal.title")}
		body={t(locale, "modal.body")}
		actionLabel={t(locale, "modal.action")}
		onClose={closeGate}
		onAction={handleModalAction}
	/>
</div>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&family=ZCOOL+XiaoWei&display=swap");

	:global(body) {
		margin: 0;
		font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
		background: #eef2f8;
		color: #0e1a2b;
	}

	:global(.jaywalking .screen) {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 40px 140px 80px 24px;
		box-sizing: border-box;
		position: relative;
	}

	:global(.jaywalking .screen::before) {
		content: "";
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.9), transparent 55%),
			linear-gradient(180deg, #e5f0ff 0%, #eef2f8 45%, #f6f8fb 100%);
		z-index: -1;
	}

	:global(.jaywalking .screen-card) {
		width: min(720px, 92vw);
		background: #fff;
		border-radius: 28px;
		box-shadow: 0 20px 50px rgba(12, 30, 70, 0.18);
		padding: 28px;
		display: grid;
		gap: 16px;
	}

	:global(.jaywalking .screen h1) {
		margin: 0;
		font-size: 28px;
		color: #0b1b33;
	}

	:global(.jaywalking .screen p) {
		margin: 0;
		color: #445266;
		line-height: 1.5;
	}

	:global(.jaywalking .field-row) {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	:global(.jaywalking label) {
		display: grid;
		gap: 6px;
		font-size: 12px;
		color: #3b4b62;
	}

	:global(.jaywalking input) {
		border: 1px solid #dbe4f2;
		border-radius: 12px;
		padding: 10px 12px;
		font-size: 14px;
		outline: none;
	}

	:global(.jaywalking .camera-card) {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 18px;
		align-items: center;
		background: #f7f9fc;
		border-radius: 20px;
		padding: 16px;
	}

	:global(.jaywalking .camera-preview) {
		width: 140px;
		height: 140px;
		border-radius: 999px;
		overflow: hidden;
		background: #e8eef7;
		display: grid;
		place-items: center;
	}

	:global(.jaywalking .camera-preview video),
	:global(.jaywalking .camera-preview img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	:global(.jaywalking .camera-actions) {
		display: grid;
		gap: 10px;
	}

	:global(.jaywalking .prompt) {
		font-weight: 600;
		color: #18263c;
	}

	:global(.jaywalking .error) {
		color: #d72638;
		font-weight: 600;
	}

	:global(.jaywalking .screen-actions) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	:global(.jaywalking .primary),
	:global(.jaywalking .secondary),
	:global(.jaywalking .ghost) {
		border: none;
		border-radius: 999px;
		padding: 10px 18px;
		font-weight: 600;
		cursor: pointer;
	}

	:global(.jaywalking .primary) {
		background: linear-gradient(135deg, #1d6dff, #3bb3ff);
		color: #fff;
		box-shadow: 0 10px 24px rgba(45, 108, 255, 0.3);
	}

	:global(.jaywalking .secondary) {
		background: #fff;
		color: #1d6dff;
		border: 1px solid #cfd8ea;
	}

	:global(.jaywalking .ghost) {
		background: transparent;
		color: #55647a;
	}

	:global(.jaywalking .timer) {
		font-weight: 600;
		color: #1c2d44;
	}

	:global(.jaywalking .terms-body) {
		max-height: 320px;
		overflow-y: auto;
		padding-right: 8px;
		display: grid;
		gap: 12px;
	}

	:global(.jaywalking .page) {
		position: relative;
		min-height: 100vh;
		padding: 24px 140px 120px 24px;
		overflow-x: hidden;
	}

	:global(.jaywalking .page::before) {
		content: "";
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.8), transparent 55%),
			linear-gradient(180deg, #e5f0ff 0%, #eef2f8 40%, #f6f8fb 100%);
		z-index: -1;
	}

	:global(.jaywalking .hero) {
		padding: 18px 18px 22px;
		border-radius: 26px;
		background: linear-gradient(180deg, #1f6bff 0%, #2f94ff 55%, rgba(255, 255, 255, 0.8) 100%);
		box-shadow: 0 18px 40px rgba(16, 64, 160, 0.2);
		color: #fff;
	}

	:global(.jaywalking .status-row) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
		font-weight: 600;
	}

	:global(.jaywalking .time) {
		font-size: 20px;
		letter-spacing: 0.5px;
	}

	:global(.jaywalking .city) {
		border: none;
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
		padding: 6px 12px;
		border-radius: 999px;
		font-size: 14px;
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
	}

	:global(.jaywalking .chev) {
		font-size: 12px;
		line-height: 1;
	}

	:global(.jaywalking .search-row) {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 10px;
		align-items: center;
	}

	:global(.jaywalking .search-box) {
		background: #fff;
		border-radius: 999px;
		padding: 6px 10px;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 8px;
		color: #3b4b62;
		box-shadow: 0 8px 20px rgba(9, 40, 110, 0.2);
	}

	:global(.jaywalking .search-icon) {
		width: 16px;
		height: 16px;
		border: 2px solid #9aa6b2;
		border-radius: 50%;
		position: relative;
		display: inline-block;
		font-size: 0;
	}

	:global(.jaywalking .search-icon::after) {
		content: "";
		position: absolute;
		width: 8px;
		height: 2px;
		background: #9aa6b2;
		right: -6px;
		bottom: -3px;
		transform: rotate(45deg);
		border-radius: 999px;
	}

	:global(.jaywalking .search-box input) {
		border: none;
		outline: none;
		font-size: 13px;
		background: transparent;
		color: #344055;
	}

	:global(.jaywalking .search-btn) {
		border: none;
		background: linear-gradient(135deg, #1d6dff, #3bb3ff);
		color: #fff;
		padding: 6px 12px;
		border-radius: 999px;
		font-weight: 600;
		cursor: pointer;
	}

	:global(.jaywalking .ai-btn) {
		border: none;
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
		padding: 10px 14px;
		border-radius: 18px;
		font-weight: 600;
		cursor: pointer;
	}

	:global(.jaywalking .quick-actions) {
		margin-top: 18px;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	:global(.jaywalking .banner) {
		margin-top: 18px;
		height: 140px;
		border-radius: 22px;
		background-size: cover;
		background-position: center;
		position: relative;
		overflow: hidden;
	}

	:global(.jaywalking .banner::after) {
		content: "";
		position: absolute;
		inset: 0;
		background: linear-gradient(120deg, rgba(15, 35, 80, 0.1), rgba(10, 20, 40, 0.5));
	}

	:global(.jaywalking .banner-content) {
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 6px;
		padding: 16px;
		font-family: "ZCOOL XiaoWei", serif;
	}

	:global(.jaywalking .banner-tag) {
		font-size: 22px;
		font-weight: 700;
	}

	:global(.jaywalking .banner-sub) {
		font-size: 14px;
		letter-spacing: 1px;
	}

	:global(.jaywalking .card) {
		margin-top: 18px;
		background: #fff;
		border-radius: 24px;
		box-shadow: 0 14px 30px rgba(20, 40, 80, 0.12);
		padding: 12px 16px;
	}

	:global(.jaywalking .tabs) {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 6px;
		align-items: center;
	}

	:global(.jaywalking .tab) {
		border: none;
		background: transparent;
		padding: 8px 0;
		font-weight: 600;
		color: #536178;
		cursor: pointer;
	}

	:global(.jaywalking .tab:first-child) {
		color: #0b1b33;
		position: relative;
	}

	:global(.jaywalking .tab:first-child::after) {
		content: "";
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: 0;
		width: 18px;
		height: 3px;
		border-radius: 999px;
		background: #1f6bff;
	}

	:global(.jaywalking .grid-card) {
		padding: 10px 16px 18px;
	}

	:global(.jaywalking .notice) {
		display: flex;
		align-items: center;
		gap: 12px;
		border: none;
		width: 100%;
		cursor: pointer;
		font-size: 14px;
		color: #425065;
		background: #fff;
	}

	:global(.jaywalking .notice-dot) {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: #ff3b30;
	}

	:global(.jaywalking .welcome) {
		padding: 18px;
	}

	:global(.jaywalking .welcome-head) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 14px;
	}

	:global(.jaywalking .welcome h2) {
		margin: 0;
		font-size: 20px;
	}

	:global(.jaywalking .pill) {
		border: none;
		background: #f0f4ff;
		color: #2f5cff;
		padding: 6px 12px;
		border-radius: 999px;
		font-weight: 600;
		cursor: pointer;
	}

	:global(.jaywalking .promo-grid) {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	:global(.jaywalking .promo) {
		border: none;
		text-align: left;
		padding: 16px;
		border-radius: 18px;
		color: #1d2b3c;
		cursor: pointer;
		display: grid;
		gap: 8px;
		min-height: 120px;
	}

	:global(.jaywalking .promo strong) {
		font-size: 20px;
	}

	:global(.jaywalking .promo-one) {
		background: linear-gradient(135deg, #f7c9ff, #c2c3ff);
	}

	:global(.jaywalking .promo-two) {
		background: linear-gradient(135deg, #9fe8ff, #b5f7ff);
	}

	:global(.jaywalking .bottom-nav) {
		position: fixed;
		left: 24px;
		right: 140px;
		bottom: 16px;
		background: #ffffff;
		border-radius: 22px;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		padding: 10px 14px;
		box-shadow: 0 18px 40px rgba(20, 40, 80, 0.2);
	}

	:global(.jaywalking .bottom-nav button) {
		border: none;
		background: transparent;
		color: #4b5a70;
		font-weight: 600;
		cursor: pointer;
	}

	@media (max-width: 720px) {
		:global(.jaywalking .page) {
			padding: 96px 16px 120px;
		}

		:global(.jaywalking .screen) {
			padding: 96px 16px 120px;
		}

		:global(.jaywalking .bottom-nav) {
			left: 16px;
			right: 16px;
		}
	}

	@media (max-width: 540px) {
		:global(.jaywalking .tabs) {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			row-gap: 8px;
		}

		:global(.jaywalking .promo-grid) {
			grid-template-columns: 1fr;
		}

		:global(.jaywalking .field-row) {
			grid-template-columns: 1fr;
		}

		:global(.jaywalking .camera-card) {
			grid-template-columns: 1fr;
			justify-items: center;
		}

		:global(.jaywalking .camera-actions) {
			text-align: center;
		}
	}
</style>
