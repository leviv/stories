<script lang="ts">
	import { fade } from 'svelte/transition';
	import { buildSatelliteView } from '$lib/cold/panorama';

	let {
		// eslint-disable-next-line prefer-const
		lat,
		// eslint-disable-next-line prefer-const
		lng,
		// eslint-disable-next-line prefer-const
		storyStep,
		isNextReady = $bindable(false)
	}: {
		lat: number;
		lng: number;
		storyStep: number;
		isNextReady?: boolean;
	} = $props();

	let currentImageSrc = $state('');
	let prevImageSrc = $state('');

	// Cache outside of reactive state
	let baseSatelliteUrl = '';

	$effect(() => {
		// Read dependencies synchronously so Svelte tracks them before the first await
		const currentLat = lat;
		const currentLng = lng;

		let isCancelled = false;

		const run = async () => {
			const isDefaultAddress = Math.abs(currentLat - 40.7295133) < 0.0001 && Math.abs(currentLng - -73.9964609) < 0.0001;
			if (!baseSatelliteUrl) {
				if (isDefaultAddress) {
					baseSatelliteUrl = '/nyu/satellite.jpg';
				} else {
					baseSatelliteUrl = await buildSatelliteView(currentLat, currentLng);
				}
			}

			if (isCancelled) {
				return;
			}

			if (currentImageSrc !== baseSatelliteUrl) {
				prevImageSrc = currentImageSrc;
				currentImageSrc = baseSatelliteUrl;
			}

			isNextReady = true;
		};

		run();

		return () => {
			isCancelled = true;
		};
	});
</script>

<div class="satellite-container" class:is-minimap={storyStep > 0}>
	{#if prevImageSrc}
		<img src={prevImageSrc} alt="Satellite view" class="satellite-image" />
	{/if}

	{#key currentImageSrc}
		{#if currentImageSrc}
			<img
				src={currentImageSrc}
				alt="Satellite view"
				class="satellite-image fade-layer"
				in:fade={{ duration: 1500 }}
			/>
		{/if}
	{/key}
</div>

<style>
	.satellite-container {
		/* Shared defaults for the image container */
		position: fixed;
		overflow: hidden;
		z-index: 1; /* Below text for background */
	}

	.satellite-container:not(.is-minimap) {
		/* Full screen zooming mode */
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
	}

	.satellite-container:not(.is-minimap) .satellite-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		animation: zoomIn 30s ease-out forwards;
	}

	.satellite-container.is-minimap {
		/* Minimap mode */
		top: 20px;
		right: 20px;
		width: 200px;
		height: 200px;
		z-index: 20;
	}

	.satellite-container.is-minimap .satellite-image {
		/* The image itself must be larger than container so it doesn't show corners when rotated */
		/* width 300px, height 300px is enough for 200px diagonal = 282px */
		width: 300px;
		height: 300px;
		top: -50px;
		left: -50px;
		object-fit: cover;
		animation: rotateMap 60s linear infinite;
	}

	.satellite-image {
		position: absolute;
		top: 0;
		left: 0;
	}

	.fade-layer {
		z-index: 1;
	}

	@keyframes zoomIn {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(2);
		}
	}

	@keyframes rotateMap {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
