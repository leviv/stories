<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { doc, setDoc, onSnapshot } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import stringsData from '$lib/jaywalking/strings.json';
	import { iconItems } from '$lib/jaywalking/iconData';
	import IntroStep from '$lib/jaywalking/steps/IntroStep.svelte';
	import HomeStep from '$lib/jaywalking/steps/HomeStep.svelte';
	import IdentityStep from '$lib/jaywalking/steps/IdentityStep.svelte';
	import TermsStep from '$lib/jaywalking/steps/TermsStep.svelte';
	import FinishStep from '$lib/jaywalking/steps/FinishStep.svelte';
	import ModalGate from '$lib/jaywalking/components/ModalGate.svelte';
	import TranslateButton from '$lib/jaywalking/components/TranslateButton.svelte';
	import RightSidebar from '$lib/jaywalking/components/RightSidebar.svelte';
	import bannerImg from '$lib/jaywalking/image.png';
	import camera from '$lib/jaywalking/camera.png';
	import card from '$lib/jaywalking/card.png';
	import rocket from '$lib/jaywalking/rocket.png';
	import video from '$lib/jaywalking/video.png';

	const strings = stringsData.strings;

	let locale = $state(stringsData.localeDefault ?? 'zh');

	const t = (activeLocale: string, key: string) => {
		const localeDict = (strings as Record<string, Record<string, string>>)[activeLocale];
		return localeDict?.[key] ?? key;
	};

	const quickActions = [
		{ id: 'scan', src: camera, labelKey: 'quick.scan' },
		{ id: 'pay', src: card, labelKey: 'quick.pay', dot: true },
		{ id: 'transport', src: rocket, labelKey: 'quick.transport' },
		{ id: 'pocket', src: video, labelKey: 'quick.pocket' }
	];

	const tabs = ['tab.regular', 'tab.transport', 'tab.food', 'tab.tour', 'tab.shopping'];

	let step = $state(1);
	let showModal = $state(false);

	let firstName = $state('');
	let lastName = $state('');
	let photoStep = $state<'left' | 'right' | 'done'>('left');
	let leftPhoto = $state<string | null>(null);
	let rightPhoto = $state<string | null>(null);
	let cameraError = $state('');
	let showShame = $state(false);
	let termsSecondsLeft = $state(300);
	let isCapturing = $state(false);
	let captureStage = $state<'left' | 'right' | 'done' | null>(null);
	let captureSession = $state(0);

	let firestoreFirstName = $state('');
	let firestoreLastName = $state('');
	let firestorePhoto = $state<string | null>(null);

	let cameraStream = $state<MediaStream | null>(null);
	let videoEl = $state<HTMLVideoElement | null>(null);

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
		cameraError = '';
	};

	const toggleLocale = () => {
		locale = locale === 'zh' ? 'en' : 'zh';
	};

	const attachStream = async () => {
		if (!videoEl || !cameraStream) {
			return;
		}
		if (videoEl.srcObject !== cameraStream) {
			videoEl.srcObject = cameraStream;
		}
		try {
			await videoEl.play();
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
			console.error('Failed to play camera stream:', error);
		}
	};

	const startCamera = async () => {
		cameraError = '';
		if (!navigator.mediaDevices?.getUserMedia) {
			cameraError = 'identity.cameraError';
			return;
		}
		try {
			if (!cameraStream) {
				cameraStream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: 'user' },
					audio: false
				});
			}
			await attachStream();
		} catch (error) {
			console.error('Camera error:', error);
			cameraError = 'identity.cameraError';
		}
	};

	const stopCamera = () => {
		cameraStream?.getTracks().forEach((track) => track.stop());
		cameraStream = null;
		if (videoEl) {
			videoEl.srcObject = null;
		}
	};

	const capturePhoto = (target: 'left' | 'right') => {
		if (!videoEl) {
			return;
		}
		const canvas = document.createElement('canvas');
		const width = videoEl.videoWidth || 480;
		const height = videoEl.videoHeight || 480;
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return;
		}
		ctx.drawImage(videoEl, 0, 0, width, height);
		const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
		if (target === 'left') {
			leftPhoto = dataUrl;
			return;
		}
		if (target === 'right') {
			rightPhoto = dataUrl;
		}
	};

	const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	const startCaptureSequence = async () => {
		if (isCapturing || photoStep === 'done') {
			return;
		}
		const sessionId = captureSession + 1;
		captureSession = sessionId;
		isCapturing = true;
		captureStage = 'left';
		photoStep = 'left';
		await startCamera();

		for (const stage of ['left', 'right'] as const) {
			if (captureSession !== sessionId) {
				return;
			}
			captureStage = stage;
			await delay(2000);
			if (captureSession !== sessionId) {
				return;
			}
			capturePhoto(stage);
			photoStep = stage === 'left' ? 'right' : 'done';
		}

		if (captureSession !== sessionId) {
			return;
		}
		captureStage = 'done';
		isCapturing = false;
		stopCamera();
	};

	const resetPhotoFlow = () => {
		captureSession += 1;
		isCapturing = false;
		captureStage = null;
		leftPhoto = null;
		rightPhoto = null;
		photoStep = 'left';
		cameraError = '';
		startCamera();
	};

	const restartFlow = () => {
		step = 1;
		showShame = false;
		resetPhotoFlow();
		firstName = '';
		lastName = '';
	};

	const timeFormatter = new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: '2-digit'
	});
	let localTime = $state(timeFormatter.format(new Date()));

	const termsLabel = () => {
		const minutes = Math.floor(termsSecondsLeft / 60);
		const seconds = String(termsSecondsLeft % 60).padStart(2, '0');
		return `${minutes}:${seconds}`;
	};

	onMount(() => {
		const unsub = onSnapshot(
			doc(db, 'identities', 'latest'),
			(docSnap) => {
				if (docSnap.exists()) {
					const data = docSnap.data();
					firestoreFirstName = data.firstName || '';
					firestoreLastName = data.lastName || '';
					firestorePhoto = data.photo || null;
				}
			},
			(err) => {
				console.error('Firestore onSnapshot error:', err);
			}
		);

		const tick = () => {
			localTime = timeFormatter.format(new Date());
		};

		const timer = setInterval(tick, 1000 * 30);
		return () => {
			clearInterval(timer);
			unsub();
		};
	});

	$effect(() => {
		if (step === 3) {
			untrack(() => startCamera());
			return () => {
				stopCamera();
			};
		}
		untrack(() => stopCamera());
	});

	$effect(() => {
		if (step === 3 && videoEl && cameraStream) {
			untrack(() => attachStream());
		}
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
		showShame={step >= 2 || showShame}
		name={`${firestoreFirstName} ${firestoreLastName}`.trim()}
		photoSrc={firestorePhoto}
		message={t(locale, 'sidebar.message')}
		anonymousLabel={t(locale, 'sidebar.anonymous')}
		photoFallbackLabel={t(locale, 'sidebar.noPhoto')}
	/>

	{#if step === 1}
		<IntroStep onStart={() => (step = 2)} />
	{:else if step === 2}
		<HomeStep {localTime} {locale} {t} {openGate} {quickActions} {tabs} {iconItems} {bannerImg} />
	{:else if step === 3}
		<IdentityStep
			{locale}
			{t}
			bind:firstName
			bind:lastName
			bind:videoEl
			state={{
				photoStep,
				leftPhoto,
				rightPhoto,
				cameraError,
				isCapturing,
				captureStage
			}}
			actions={{
				onBack: () => (step = 2),
				onContinue: () => (step = 4),
				onCapture: startCaptureSequence,
				onReset: resetPhotoFlow,
				onRetry: startCamera
			}}
		/>
	{:else if step === 4}
		<TermsStep
			{locale}
			{t}
			{termsLabel}
			onBack={() => (step = 3)}
			onAgree={async () => {
				if (termsSecondsLeft > 0) {
					showShame = true;
				}
				step = 5;

				if (!firstName || !lastName || (!leftPhoto && !rightPhoto)) {
					return;
				}

				try {
					await setDoc(doc(db, 'identities', 'latest'), {
						firstName,
						lastName,
						photo: rightPhoto || leftPhoto,
						timestamp: new Date().toISOString()
					});
				} catch (e) {
					console.error('Error saving identity to Firestore', e);
				}
			}}
		/>
	{:else}
		<FinishStep {locale} {t} onRestart={restartFlow} />
	{/if}

	<TranslateButton label={t(locale, 'translate')} onTranslate={toggleLocale} />

	<ModalGate
		open={showModal}
		title={t(locale, 'modal.title')}
		body={t(locale, 'modal.body')}
		actionLabel={t(locale, 'modal.action')}
		onClose={closeGate}
		onAction={handleModalAction}
	/>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&family=ZCOOL+XiaoWei&display=swap');

	:global(body) {
		margin: 0;
		font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
		background: #eef2f8;
		color: #0e1a2b;
	}
</style>
