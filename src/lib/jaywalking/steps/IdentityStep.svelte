<script lang="ts">
	import Screen from '$lib/jaywalking/components/Screen.svelte';
	import Button from '$lib/jaywalking/components/Button.svelte';

	type Locale = string;
	type StringKey = string;

	let {
		// eslint-disable-next-line prefer-const
		locale,
		// eslint-disable-next-line prefer-const
		t,
		firstName = $bindable(),
		lastName = $bindable(),
		videoEl = $bindable(),
		// eslint-disable-next-line prefer-const
		state,
		// eslint-disable-next-line prefer-const
		actions
	}: {
		locale: Locale;
		t: (activeLocale: Locale, key: StringKey | string) => string;
		firstName: string;
		lastName: string;
		videoEl: HTMLVideoElement | null;
		state: {
			photoStep: 'left' | 'right' | 'done';
			leftPhoto: string | null;
			rightPhoto: string | null;
			cameraError: string;
			isCapturing: boolean;
			captureStage: 'left' | 'right' | 'done' | null;
		};
		actions: {
			onBack: () => void;
			onContinue: () => void;
			onCapture: () => void;
			onReset: () => void;
			onRetry: () => void;
		};
	} = $props();

	// Whether to show a captured photo overlay instead of the live feed
	const showDonePhoto = $derived(
		!state.isCapturing && state.photoStep === 'done' && state.rightPhoto !== null
	);
	const showLeftPhoto = $derived(
		!state.isCapturing && state.photoStep === 'right' && state.leftPhoto !== null
	);
	const showPhoto = $derived(showDonePhoto || showLeftPhoto);

	// Determine which capture stage label to show
	function getCaptureLabel(): string {
		if (state.captureStage === 'right') {
			return t(locale, 'identity.capture.right');
		}
		if (state.captureStage === 'done') {
			return t(locale, 'identity.capture.done');
		}
		return t(locale, 'identity.capture.left');
	}

	// Determine which prompt label to show
	function getPromptLabel(): string {
		if (state.isCapturing) {
			return getCaptureLabel();
		}
		if (state.photoStep === 'left') {
			return t(locale, 'identity.prompt.left');
		}
		if (state.photoStep === 'right') {
			return t(locale, 'identity.prompt.right');
		}
		return t(locale, 'identity.prompt.done');
	}

	// Whether the continue button should be disabled
	const continueDisabled = $derived(
		!firstName || !lastName || state.photoStep !== 'done' || state.isCapturing
	);
</script>

{#snippet actionsSnippet()}
	<div class:capturing={state.isCapturing} class="identity-actions">
		<Button variant="ghost" onclick={actions.onBack} disabled={state.isCapturing}>
			{t(locale, 'identity.back')}
		</Button>
		<Button variant="primary" onclick={actions.onContinue} disabled={continueDisabled}>
			{t(locale, 'identity.continue')}
		</Button>
	</div>
{/snippet}

<Screen
	class="identity"
	title={t(locale, 'identity.title')}
	subtitle={t(locale, 'identity.subtitle')}
	actions={actionsSnippet as any}
>
	<div class="field-row">
		<label>
			<span>{t(locale, 'identity.firstName')}</span>
			<input
				type="text"
				bind:value={firstName}
				placeholder={t(locale, 'identity.firstPlaceholder')}
			/>
		</label>
		<label>
			<span>{t(locale, 'identity.lastName')}</span>
			<input
				type="text"
				bind:value={lastName}
				placeholder={t(locale, 'identity.lastPlaceholder')}
			/>
		</label>
	</div>

	<div class="camera-card">
		<div class="camera-preview" class:capturing={state.isCapturing}>
			<video bind:this={videoEl} autoplay playsinline muted class:hidden={showPhoto}> </video>
			{#if showDonePhoto}
				<img src={state.rightPhoto} alt={t(locale, 'identity.alt.right')} />
			{:else if showLeftPhoto}
				<img src={state.leftPhoto} alt={t(locale, 'identity.alt.left')} />
			{/if}
			{#if state.isCapturing}
				<div class="capture-hud">
					{getCaptureLabel()}
				</div>
			{/if}
		</div>
		<div class="camera-actions">
			<p class="prompt">
				{getPromptLabel()}
			</p>
			{#if state.cameraError}
				<p class="error">{t(locale, state.cameraError)}</p>
				<Button variant="secondary" onclick={actions.onRetry}>
					{t(locale, 'identity.retry')}
				</Button>
			{:else}
				<Button
					variant="primary"
					class="btn-capture"
					onclick={actions.onCapture}
					disabled={state.photoStep === 'done'}
				>
					{#if state.isCapturing}
						<span class="spinner"></span>
					{/if}
					<span>{t(locale, 'identity.takePhoto')}</span>
				</Button>
			{/if}
			<Button variant="ghost" onclick={actions.onReset} disabled={state.isCapturing}>
				{t(locale, 'identity.reset')}
			</Button>
		</div>
	</div>
</Screen>

<style>
	.btn-capture {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	video.hidden {
		position: absolute;
		width: 0;
		height: 0;
		visibility: hidden;
	}

	.spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.field-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	label {
		display: grid;
		gap: 6px;
		font-size: 12px;
		color: #3b4b62;
	}

	input {
		border: 1px solid #dbe4f2;
		border-radius: 12px;
		padding: 10px 12px;
		font-size: 14px;
		outline: none;
	}

	.camera-card {
		display: grid;
		grid-template-columns: 140px 1fr;
		gap: 18px;
		align-items: center;
		background: #f7f9fc;
		border-radius: 20px;
		padding: 16px;
	}

	.camera-preview {
		width: 140px;
		height: 140px;
		border-radius: 999px;
		overflow: hidden;
		background: #e8eef7;
		display: grid;
		place-items: center;
		position: relative;
		transform: scaleX(-1);
	}

	.camera-preview video,
	.camera-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.camera-preview.capturing {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		border-radius: 0;
		background: #000;
		display: grid;
		place-items: center;
		z-index: 60;
	}

	.camera-preview.capturing::after {
		content: '';
		position: absolute;
		inset: 8vh 12vw;
		border-radius: 999px;
		border: 3px solid rgba(255, 255, 255, 0.7);
		box-shadow: 0 0 30px rgba(0, 0, 0, 0.4);
		pointer-events: none;
	}

	.camera-preview.capturing video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.camera-preview .capture-hud {
		position: absolute;
		left: 50%;
		bottom: 12vh;
		transform: translateX(-50%);
		padding: 10px 18px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.88);
		font-weight: 700;
		color: #0b1b33;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
		z-index: 61;
	}

	.camera-actions.capturing,
	.screen-actions.capturing {
		opacity: 0.5;
		pointer-events: none;
	}

	.camera-actions {
		display: grid;
		gap: 10px;
	}

	.prompt {
		font-weight: 600;
		color: #18263c;
	}

	.error {
		color: #d72638;
		font-weight: 600;
	}

	.identity-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.identity-actions.capturing {
		opacity: 0.5;
		pointer-events: none;
	}

	@media (max-width: 540px) {
		.field-row {
			grid-template-columns: 1fr;
		}

		.camera-card {
			grid-template-columns: 1fr;
			justify-items: center;
		}

		.camera-actions {
			text-align: center;
		}
	}
</style>
