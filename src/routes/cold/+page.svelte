<script lang="ts">
	import { fade } from 'svelte/transition';
	import SnowBackground from '$lib/cold/SnowBackground.svelte';
	import StreetViewBackground from '$lib/cold/StreetViewBackground.svelte';
	import SatelliteView from '$lib/cold/SatelliteView.svelte';
	import Thermometer from '$lib/cold/Thermometer.svelte';
	import SvalbardLandscape from '$lib/cold/SvalbardLandscape.svelte';
	import { storyLines, introText } from '$lib/cold/config';
	import { placeAutocomplete } from '$lib/cold/autocomplete';
	import windAudio from '$lib/cold/wind.mp3';

	const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

	// State management
	let currentState: 'input' | 'loading' | 'intro' | 'story' = $state('input');
	let coordinates: { lat: number; lng: number } | null = $state(null);

	// Story state
	let storyStep = $state(0);
	let isStreetViewReady = $state(false);
	let isSatelliteReady = $state(false);
	const isNextReady = $derived(isStreetViewReady && isSatelliteReady);
	let currentYear = $state('');

	let showErrorPopup = $state(false);

	let audioElem: HTMLAudioElement | undefined = $state();

	$effect(() => {
		if (audioElem) {
			if (currentState === 'story') {
				const maxSteps = storyLines.length;
				if (storyStep === maxSteps - 1) {
					audioElem.volume = 0;
				} else {
					const vol = 1 - storyStep / (maxSteps - 1);
					audioElem.volume = Math.max(0, vol);
				}
			} else if (currentState === 'intro') {
				audioElem.volume = 1;
			}
		}
	});

	function playAudio() {
		if (audioElem && audioElem.paused) {
			audioElem.play().catch((e) => console.error('Audio play failed:', e));
		}
	}

	const promptText = $derived.by(() => {
		if (storyStep >= storyLines.length - 1) {
			return 'Click to restart';
		}
		if (isNextReady) {
			return 'Click anywhere to proceed';
		}
		return null;
	});

	async function handleLocationSelect(lat: number, lng: number) {
		playAudio();
		// Delay to allow gmp-place-autocomplete to finish its internal event handling
		await new Promise((resolve) => setTimeout(resolve, 500));
		currentState = 'loading'; // Unmount the autocomplete component

		if (window.google && window.google.maps) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const { StreetViewService } = (await window.google.maps.importLibrary('streetView')) as any;
				const svService = new StreetViewService();

				const response = await svService.getPanorama({ location: { lat, lng }, radius: 1000 });
				
				// Verify static imagery is actually available to avoid "sorry, no imagery here" placeholder
				const panoId = response.data?.location?.pano;
				const locationParam = panoId ? `pano=${panoId}` : `location=${lat},${lng}`;
				const staticCheckUrl = `https://maps.googleapis.com/maps/api/streetview?size=10x10&${locationParam}&key=${googleMapsApiKey}&return_error_code=true`;
				
				const staticRes = await fetch(staticCheckUrl);
				if (!staticRes.ok) {
					throw new Error('Static imagery not available');
				}

				coordinates = { lat, lng };
				currentState = 'intro';
			} catch {
				showErrorPopup = true;
				currentState = 'input'; // Re-mount the input screen
			}
		} else {
			// Fallback check if google maps JS API isn't loaded
			try {
				const staticCheckUrl = `https://maps.googleapis.com/maps/api/streetview?size=10x10&location=${lat},${lng}&key=${googleMapsApiKey}&return_error_code=true`;
				const staticRes = await fetch(staticCheckUrl);
				if (!staticRes.ok) {
					throw new Error('Static imagery not available');
				}
				coordinates = { lat, lng };
				currentState = 'intro';
			} catch {
				showErrorPopup = true;
				currentState = 'input'; // Re-mount the input screen
			}
		}
	}

	function advanceIntro() {
		playAudio();
		currentState = 'story';
	}

	function advanceStory() {
		playAudio();
		if (storyStep < storyLines.length - 1) {
			storyStep++;
		}
	}

	function restartStory() {
		storyStep = 0;
		isStreetViewReady = false;
		isSatelliteReady = false;
		currentState = 'input';
		coordinates = null;
		currentYear = '';
		if (audioElem) {
			audioElem.pause();
			audioElem.currentTime = 0;
		}
	}
</script>

<svelte:head>
	<script
		async
		src="https://maps.googleapis.com/maps/api/js?key={googleMapsApiKey}&loading=async&libraries=places&v=weekly"
	></script>
</svelte:head>

<div class="app-container" class:is-streetview={currentState === 'story'}>
	<audio bind:this={audioElem} src={windAudio} loop preload="auto"></audio>

	{#if currentState === 'input' || currentState === 'loading' || currentState === 'intro'}
		<div transition:fade={{ duration: 1500 }}>
			<SvalbardLandscape />
		</div>
	{/if}

	{#if currentState === 'input' || currentState === 'loading' || currentState === 'intro' || (currentState === 'story' && storyStep > 0)}
		<SnowBackground
			storyStep={currentState === 'story' ? storyStep : 1}
			maxSteps={storyLines.length}
		/>
	{/if}

	{#snippet storyOverlay(
		text: string,
		promptText: string | null,
		onClick: () => void,
		isIntro: boolean = false
	)}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="screen {isIntro ? 'intro-screen' : 'story-screen'}"
			transition:fade={{ duration: 1500 }}
			onclick={onClick}
		>
			{#if promptText}
				<p class="prompt">{promptText}</p>
			{/if}
			<p class={isIntro ? 'intro-text' : 'story-text'}>
				<span class="text-highlight">{text}</span>
			</p>
		</div>
	{/snippet}

	{#if showErrorPopup}
		<div class="popup-overlay" transition:fade={{ duration: 300 }}>
			<div class="popup-content">
				<p>
					Google Street View not found for this address. Try entering another address or use the
					default.
				</p>
				<div class="popup-buttons">
					<button
						onclick={() => {
							showErrorPopup = false;
						}}>Try Another</button
					>
					<button
						onclick={() => {
							showErrorPopup = false;
							coordinates = { lat: 52.53856, lng: 13.41324 };
							currentState = 'intro';
						}}>Use Default</button
					>
				</div>
			</div>
		</div>
	{/if}

	{#if currentState === 'input'}
		<div class="screen input-screen" transition:fade={{ duration: 1000 }}>
			<div class="input-wrapper">
				<h1 class="sr-only">Cold</h1>
				<pre class="ascii-title" aria-hidden="true">
 ______     ______     __         _____   
/\  ___\   /\  __ \   /\ \       /\  __-. 
\ \ \____  \ \ \/\ \  \ \ \____  \ \ \/\ \
 \ \_____\  \ \_____\  \ \_____\  \ \____-
  \/_____/   \/_____/   \/_____/   \/____/
				</pre>
				<label for="address-input">Enter the address of your childhood home</label>
				<div
					use:placeAutocomplete={{
						onSelect: handleLocationSelect,
						onError: () => {
							showErrorPopup = true;
						}
					}}
					class="autocomplete-container"
				></div>
			</div>
		</div>
	{:else if currentState === 'intro'}
		{@render storyOverlay(introText, 'Click anywhere to proceed', advanceIntro, true)}
	{:else if currentState === 'story' && coordinates}
		<div class="story-views" transition:fade={{ duration: 1500 }}>
			<SatelliteView
				lat={coordinates.lat}
				lng={coordinates.lng}
				{storyStep}
				bind:isNextReady={isSatelliteReady}
			/>

			<StreetViewBackground
				lat={coordinates.lat}
				lng={coordinates.lng}
				{storyStep}
				bind:isNextReady={isStreetViewReady}
				bind:currentYear
				maxSteps={storyLines.length}
				visible={storyStep > 0}
			/>

			<Thermometer {storyStep} maxSteps={storyLines.length} />

			{@render storyOverlay(
				storyLines[storyStep],
				promptText,
				() => {
					if (storyStep < storyLines.length - 1) {
						if (isNextReady) {
							advanceStory();
						}
					} else {
						restartStory();
					}
				},
				false
			)}

			{#if storyStep > 0 && currentYear}
				<div class="year-overlay" transition:fade={{ duration: 1000 }}>
					{currentYear}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.story-views {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.app-container {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		width: 100vw;
		height: 100vh;
		position: relative;
		background-color: #ffffff; /* White background for the first two phases */
		transition: background-color 1.5s ease;
		overflow: hidden;
	}

	.app-container.is-streetview {
		background-color: transparent; /* Reveal street view */
	}

	.screen {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: end;
	}

	.input-screen {
		z-index: 10;
		justify-content: start;
	}

	.input-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		background: transparent;
		padding: 3rem;
		/* Removed borders, shadows, blur per user request */
	}

	.input-wrapper label {
		font-size: 1.25rem;
		color: #333;
		font-weight: 500;
	}

	.ascii-title {
		font-family: 'Courier New', Courier, monospace;
		font-size: 1.2rem;
		line-height: 1.2;
		color: #333;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.autocomplete-container {
		width: 400px;
		max-width: 90vw;
	}

	.popup-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		backdrop-filter: blur(4px);
	}

	.popup-content {
		background: #fff;
		border: 1px solid #333;
		padding: 2rem;
		max-width: 400px;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.popup-content p {
		font-size: 1.1rem;
		color: #333;
		margin: 0;
		line-height: 1.4;
	}

	.popup-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.popup-buttons button {
		background: transparent;
		border: 1px solid #333;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		color: #333;
		cursor: pointer;
		transition: all 0.2s;
	}

	.popup-buttons button:hover {
		background: #333;
		color: #fff;
	}

	:global(gmp-place-picker),
	:global(gmp-place-autocomplete) {
		width: 100%;
		--pac-border-radius: 0;
		--pac-box-shadow: none;
		--pac-border: 1px solid #333;
	}

	.intro-screen,
	.story-screen {
		cursor: pointer;
		z-index: 10;
		text-align: center;
	}

	.intro-screen {
		justify-content: flex-start;
		padding-top: 20vh;
	}

	.story-screen {
		background: transparent;
	}

	.intro-text,
	.story-text {
		font-size: 2.2rem;
		line-height: 1.6;
		max-width: 800px;
		font-weight: 400;
		color: #ffffff;
		background: transparent;
		padding: 1.5rem 2.5rem;
	}

	.text-highlight {
		background-color: #87ceeb; /* Sky blue */
		-webkit-box-decoration-break: clone;
		box-decoration-break: clone;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	.prompt {
		position: absolute;
		top: 2rem;
		font-size: 1rem;
		color: #ffffff;
		background-color: #000000;
		border-radius: 9999px;
		padding: 0.75rem 1.5rem;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.8;
		}
		100% {
			opacity: 0.4;
		}
	}

	.year-overlay {
		position: fixed;
		bottom: 30px;
		left: 30px;
		font-size: 1.5rem;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 300;
		z-index: 20;
		font-variant-numeric: tabular-nums;
		letter-spacing: 2px;
	}
</style>
