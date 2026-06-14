<script lang="ts">
	import { onMount } from 'svelte';
	import Particles, { initParticlesEngine } from '@tsparticles/svelte';
	import { loadSnowPreset } from '@tsparticles/preset-snow';

	const { storyStep = 0, maxSteps = 4 }: { storyStep?: number; maxSteps?: number } = $props();

	let isReady = $state(false);

	onMount(async () => {
		await initParticlesEngine(async (engine) => {
			await loadSnowPreset(engine);
		});
		isReady = true;
	});

	function getSnowConfig(step: number, totalMaxSteps: number) {
		const totalImageSteps = Math.ceil((totalMaxSteps - 1) / 2);
		const currentImageStep = step > 0 ? Math.ceil(step / 2) : 0;

		let speed = 1.5;
		let number = 50; 
		let sizeMax = 3;

		if (currentImageStep <= 1) {
			// Most snow at the very beginning
			speed = 5.0;
			number = 500;
			sizeMax = 6;
		} else if (currentImageStep >= totalImageSteps) {
			// Zero snow at the very end
			speed = 0;
			number = 0;
			sizeMax = 1;
		} else {
			// Interpolate for steps in between
			const ratio = (currentImageStep - 1) / Math.max(1, totalImageSteps - 1);
			const invRatio = 1 - ratio;

			speed = 1.5 + (5.0 - 1.5) * invRatio;
			number = Math.floor(500 * invRatio);
			sizeMax = Math.max(1, Math.floor(6 * invRatio));
		}

		return { speed, number, sizeMax };
	}

	const config = $derived(getSnowConfig(storyStep, maxSteps));

	const options = $derived({
		preset: 'snow',
		background: {
			color: 'transparent' // We'll manage background color in CSS
		},
		particles: {
			color: {
				value: ['#d0d8e8', '#b3c6ff', '#e6f0ff'] // Icey colors to show up on white and dark
			},
			move: {
				speed: config.speed
			},
			number: {
				value: config.number // Blizzard effect
			},
			size: {
				value: { min: 1, max: config.sizeMax }
			}
		}
	});
</script>

{#if isReady}
	<div class="snow-wrapper">
		<Particles id="tsparticles" {options} />
	</div>
{/if}

<style>
	.snow-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 5; /* Stay behind the text, but ahead of the streetview background */
		pointer-events: none; /* Let clicks pass through */
	}

	:global(#tsparticles) {
		width: 100%;
		height: 100%;
	}
</style>
