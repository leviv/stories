<script lang="ts">
	import { fade } from 'svelte/transition';
	import { isDevelopmentMode } from '$lib/cold/config';
	import {
		buildPanorama,
		getMockColderImage,
		getColderImage,
		getHistoricalPanoIds
	} from '$lib/cold/panorama';
	import type { HistoricalPano } from '$lib/cold/panorama';

	let {
		// eslint-disable-next-line prefer-const
		lat,
		// eslint-disable-next-line prefer-const
		lng,
		// eslint-disable-next-line prefer-const
		storyStep,
		isNextReady = $bindable(false),
		currentYear = $bindable(''),
		// eslint-disable-next-line prefer-const
		maxSteps = 4,
		// eslint-disable-next-line prefer-const
		visible = true
	}: {
		lat: number;
		lng: number;
		storyStep: number;
		isNextReady?: boolean;
		currentYear?: string;
		maxSteps?: number;
		visible?: boolean;
	} = $props();

	let currentImageSrc = $state('');
	let prevImageSrc = $state('');

	// Cache outside of reactive state to avoid unnecessary rerenders
	let panoIdsPromise: Promise<HistoricalPano[]> | null = null;
	const baseImagesPromises: Record<number, Promise<string>> = {};
	const generatedImagesPromises: Record<number, Promise<string>> = {};

	$effect(() => {
		// Read dependencies synchronously so Svelte tracks them before the first await
		const currentStoryStep = storyStep;
		const currentLat = lat;
		const currentLng = lng;
		const currentMaxSteps = maxSteps;

		let isCancelled = false;

		const run = async () => {
			try {
				const isDefaultAddress = Math.abs(currentLat - 40.7295133) < 0.0001 && Math.abs(currentLng - -73.9964609) < 0.0001;
				const totalImageSteps = Math.ceil((currentMaxSteps - 1) / 2);

				if (!panoIdsPromise) {
					if (isDefaultAddress) {
						panoIdsPromise = fetch('/nyu/panoIds.json').then(res => res.json());
					} else {
						panoIdsPromise = getHistoricalPanoIds(
							currentLat,
							currentLng,
							Math.max(1, totalImageSteps)
						);
					}
				}
				const panoIds = await panoIdsPromise;

				if (isCancelled) {
					return;
				}

				const getPanoIndex = (step: number) => Math.max(0, step - 1);
				const currentImageStep = currentStoryStep > 0 ? Math.ceil(currentStoryStep / 2) : 0;

				const ensureImageLoaded = async (imgStep: number) => {
					const panoIndex = getPanoIndex(imgStep);

					if (!baseImagesPromises[imgStep]) {
						if (isDefaultAddress) {
							// We bypass base image for default address
							baseImagesPromises[imgStep] = Promise.resolve('');
						} else {
							baseImagesPromises[imgStep] = buildPanorama(
								currentLat,
								currentLng,
								panoIds[panoIndex].pano
							);
						}
					}
					const baseImage = await baseImagesPromises[imgStep];

					if (!generatedImagesPromises[imgStep]) {
						if (isDefaultAddress) {
							generatedImagesPromises[imgStep] = Promise.resolve(`/nyu/streetview_${imgStep}.jpg`);
						} else {
							if (imgStep === totalImageSteps) {
								generatedImagesPromises[imgStep] = Promise.resolve(baseImage);
							} else {
								const reversedStep = totalImageSteps - imgStep;
								generatedImagesPromises[imgStep] = isDevelopmentMode
									? getMockColderImage(baseImage, reversedStep)
									: getColderImage(baseImage, reversedStep);
							}
						}
					}
					return await generatedImagesPromises[imgStep];
				};

				if (currentStoryStep > 0) {
					const panoIndex = getPanoIndex(currentImageStep);
					currentYear = panoIds[panoIndex].year;

					const imgStr = await ensureImageLoaded(currentImageStep);

					if (isCancelled) {
						return;
					}

					if (currentImageSrc !== imgStr) {
						prevImageSrc = currentImageSrc;
						currentImageSrc = imgStr;
					}
				}

				if (currentStoryStep < currentMaxSteps - 1) {
					isNextReady = false;
					const nextStoryStep = currentStoryStep + 1;
					const requiredNextImageStep = Math.ceil(nextStoryStep / 2);
					const preloadImageStep = currentImageStep + 1;

					if (requiredNextImageStep === currentImageStep) {
						// The image for the next step is already loaded/shown.
						if (!isCancelled) {
							isNextReady = true;
						}

						// Fire and forget preload for the upcoming distinct image
						if (preloadImageStep <= totalImageSteps) {
							ensureImageLoaded(preloadImageStep).catch(console.error);
						}
					} else {
						// The image for the next step is a new distinct image, we must wait for it.
						await ensureImageLoaded(requiredNextImageStep);
						if (!isCancelled) {
							isNextReady = true;
						}
					}
				} else {
					if (!isCancelled) {
						isNextReady = true;
					}
				}
			} catch (e) {
				console.error('STREET VIEW EFFECT ERROR:', e);
			}
		};

		run();

		return () => {
			isCancelled = true;
		};
	});
</script>

{#if visible}
	{#if prevImageSrc}
		<div class="street-view pan-bg" style="background-image: url({prevImageSrc})"></div>
	{/if}

	{#key currentImageSrc}
		{#if currentImageSrc}
			<div
				class="street-view pan-bg fade-layer"
				style="background-image: url({currentImageSrc})"
				in:fade={{ duration: 1500 }}
			></div>
		{/if}
	{/key}
{/if}

<style>
	.street-view {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0; /* Deepest layer */
	}

	.pan-bg {
		/* Scales the 640px height to screen height, width scales proportionally */
		background-size: auto 100vh;
		background-repeat: repeat-x;
		animation: panBackground 60s linear infinite;
	}

	.fade-layer {
		z-index: 1; /* Sits above the previous layer during crossfade */
	}

	@keyframes panBackground {
		from {
			background-position: 0 0;
		}
		to {
			/* The aspect ratio of the stitched image is exactly 4:1. 
			   Since height is 100vh, the width is 400vh. 
			   Panning by 400vh completes exactly one seamless loop. */
			background-position: -400vh 0;
		}
	}
</style>
