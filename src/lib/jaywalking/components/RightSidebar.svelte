<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import walkImg from '$lib/jaywalking/walk.jpg';
	import dontWalkImg from '$lib/jaywalking/dont_walk.jpg';

	const {
		name = '',
		photoSrc = null,
		anonymousLabel = 'Anonymous user',
		photoFallbackLabel = 'No photo'
	}: {
		name?: string;
		photoSrc?: string | null;
		anonymousLabel?: string;
		photoFallbackLabel?: string;
	} = $props();

	let countdown = $state(20);
	let isWalk = $state(false);

	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		interval = setInterval(() => {
			countdown -= 1;
			if (countdown < 0) {
				countdown = 20;
				isWalk = !isWalk;
			}
		}, 1000);
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
</script>

{#snippet poleContent()}
	<div class="item signal-image">
		<img src={isWalk ? walkImg : dontWalkImg} alt={isWalk ? 'Walk' : "Don't Walk"} />
	</div>

	<div class="item countdown">
		{countdown.toString().padStart(2, '0')}
	</div>

	<div class="item shame-section">
		<div class="shame-photo">
			{#if photoSrc}
				<img src={photoSrc} alt={name ? `${name} photo` : 'User photo'} />
			{:else}
				<span class="photo-fallback">{photoFallbackLabel}</span>
			{/if}
		</div>
		<div class="shame-name">{name || anonymousLabel}</div>
	</div>

	<div class="item chinese-chars">
		<span>通行</span>
		<span>交通</span>
		<span>信号</span>
	</div>
{/snippet}

<aside class="sidebar" aria-live="polite">
	<div class="pole" class:walk={isWalk} class:dont-walk={!isWalk}>
		<div class="marquee-content">
			{@render poleContent()}
		</div>
		<div class="marquee-content marquee-duplicate" aria-hidden="true">
			{@render poleContent()}
		</div>
	</div>
</aside>

<style>
	.sidebar {
		position: sticky;
		top: 0;
		width: 116px; /* 100px for pole + 15px for box shadow/spacing */
		height: 100vh;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: flex-start; /* pole aligns left, leaving space on right */
		pointer-events: none;
		flex-shrink: 0;
	}

	.pole {
		pointer-events: auto;
		width: 100px; /* fixed width for the pole itself */
		height: 100%;
		background: #111;
		/* Flat oblique perspective on right side sloping down */
		box-shadow:
			1px 1px 0 #222,
			2px 2px 0 #222,
			3px 3px 0 #222,
			4px 4px 0 #222,
			5px 5px 0 #222,
			6px 6px 0 #222,
			7px 7px 0 #222,
			8px 8px 0 #222,
			9px 9px 0 #222,
			10px 10px 0 #222,
			11px 11px 0 #222,
			12px 12px 0 #222,
			13px 13px 0 #222,
			14px 14px 0 #222,
			15px 15px 0 #222;
		border: 1px solid #333;
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		overflow: hidden;
		transition: --signal-color 0.3s;
	}

	.walk {
		--signal-color: #34c759;
	}

	.dont-walk {
		--signal-color: #ff3b30;
	}

	.marquee-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 30px;
		padding: 40px 0;
		width: 100%;
		flex-shrink: 0;
	}

	.marquee-duplicate {
		display: none;
	}

	.item {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}

	.signal-image {
		width: 70px;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		overflow: hidden;
	}

	.signal-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.countdown {
		color: var(--signal-color);
		font-size: 42px;
		font-weight: 900;
		font-family: monospace;
		text-align: center;
		line-height: 1;
	}

	.shame-section {
		gap: 12px;
	}

	.shame-photo {
		width: 64px;
		height: 64px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #000;
	}

	.shame-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.photo-fallback {
		font-size: 10px;
		color: #888;
		font-weight: bold;
		text-align: center;
	}

	.shame-name {
		color: #fff;
		font-size: 13px;
		font-weight: 700;
		max-width: 80px;
		word-break: break-word;
		text-align: center;
	}

	.chinese-chars {
		color: var(--signal-color);
		font-size: 24px;
		font-weight: 900;
		text-align: center;
		line-height: 1.3;
	}

	@media (max-width: 720px) {
		.sidebar {
			position: sticky;
			top: 0;
			right: 0;
			width: 100%;
			height: 74px; /* 64px for pole + 10px for shadow */
			z-index: 50;
			justify-content: flex-start;
			align-items: flex-start; /* pole aligns top, leaving space on bottom */
		}

		.pole {
			flex-direction: row;
			width: 100%;
			height: 64px;
			background: #111;
			/* Flat oblique perspective sloping down and right on mobile too */
			box-shadow:
				1px 1px 0 #222,
				2px 2px 0 #222,
				3px 3px 0 #222,
				4px 4px 0 #222,
				5px 5px 0 #222,
				6px 6px 0 #222,
				7px 7px 0 #222,
				8px 8px 0 #222;
		}

		.marquee-content {
			flex-direction: row;
			gap: 40px;
			padding: 0 40px;
			width: max-content;
			animation: scroll 15s linear infinite;
		}

		.marquee-duplicate {
			display: flex;
		}

		.item {
			flex-direction: row;
			width: auto;
			gap: 12px;
		}

		.signal-image {
			width: 44px;
			height: 44px;
		}

		.countdown {
			font-size: 32px;
		}

		.shame-section {
			flex-direction: row;
			align-items: center;
			gap: 12px;
		}

		.shame-photo {
			width: 40px;
			height: 40px;
		}

		.shame-name {
			max-width: 120px;
			font-size: 14px;
			white-space: nowrap;
		}

		.chinese-chars {
			flex-direction: row;
			font-size: 20px;
			gap: 8px;
		}

		.chinese-chars span {
			display: inline-block;
		}
	}

	@keyframes scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-100%);
		}
	}
</style>
