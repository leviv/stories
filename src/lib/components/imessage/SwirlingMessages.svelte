<script lang="ts">
	import { base } from '$app/paths';
	export let messages: string[] = [];

	// Create randomized paths and animation delays for each message
	let displayItems: {
		id: number;
		text: string;
		startY: number;
		endY: number;
		startX: number;
		endX: number;
		delay: number;
		duration: number;
		scale: number;
		opacity: number;
	}[] = [];

	$: {
		displayItems = messages.map((text, i) => {
			const direction = Math.random() > 0.5 ? 1 : -1; // 1 = left to right, -1 = right to left
			return {
				id: i,
				text,
				// Start off screen and end off screen
				startX: direction === 1 ? -30 - Math.random() * 20 : 130 + Math.random() * 20,
				endX: direction === 1 ? 130 + Math.random() * 20 : -30 - Math.random() * 20,
				startY: Math.random() * 100,
				endY: Math.random() * 100, // Drift slightly up or down
				delay: Math.random() * 15, // Stagger start times
				duration: 30 + Math.random() * 40, // Slow float (30-70s)
				scale: 0.5 + Math.random() * 0.5, // Varying sizes
				opacity: 0.3 + Math.random() * 0.5 // Varying opacities (ephemeral)
			};
		});
	}
</script>

<div class="swirl-container" style="--bubble-img: url('{base}/messages/message-bubbles/right-bubble-light.svg')">
	{#each displayItems as item (item.id)}
		<div
			class="swirling-animator"
			style="
        --start-x: {item.startX}vw;
        --end-x: {item.endX}vw;
        --start-y: {item.startY}vh;
        --end-y: {item.endY}vh;
        animation-delay: {item.delay}s;
        animation-duration: {item.duration}s;
      "
		>
			<div
				class="swirling-scaler"
				style="
          transform: scale({item.scale});
          opacity: {item.opacity};
        "
			>
				<div class="swirling-bubble">
					<div class="content">{item.text}</div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.swirl-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		z-index: 0; /* Background */
		pointer-events: none; /* Don't block interactions */
		background: linear-gradient(135deg, #1f2937, #111827); /* Dark background to make bubbles pop */
	}

	.swirling-animator {
		position: absolute;
		top: 0;
		left: 0;
		animation: floatAcross linear infinite;
		will-change: transform;
	}

	.swirling-scaler {
		/* Holds the scale and opacity */
	}

	.swirling-bubble {
		border-style: solid;
		border-width: 17px;
		border-right-width: 22px;
		border-image-source: var(--bubble-img);
		border-image-slice: 31 43 31 31;
		background-color: #007aff; /* iOS Blue */
		color: white;
		max-width: 280px;
		font-size: 15px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		word-break: break-word;
		position: relative;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	}

	.content {
		margin-top: -10px;
		margin-bottom: -10px;
		margin-left: -4px;
		margin-right: -4px;
		line-height: 1.3;
	}

	/* Keyframes for a sweeping, floaty path across the screen */
	@keyframes floatAcross {
		0% {
			transform: translate(var(--start-x), var(--start-y)) rotate(-5deg);
		}
		33% {
			transform: translate(
					calc(var(--start-x) * 0.66 + var(--end-x) * 0.33),
					calc(var(--start-y) * 0.66 + var(--end-y) * 0.33 + 15vh)
				)
				rotate(5deg);
		}
		66% {
			transform: translate(
					calc(var(--start-x) * 0.33 + var(--end-x) * 0.66),
					calc(var(--start-y) * 0.33 + var(--end-y) * 0.66 - 15vh)
				)
				rotate(-2deg);
		}
		100% {
			transform: translate(var(--end-x), var(--end-y)) rotate(5deg);
		}
	}
</style>
