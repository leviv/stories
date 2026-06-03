<script lang="ts">
	import { onMount } from 'svelte';

	export let label = '';
	export let loading = false;

	export let onTranslate: () => void = () => {};

	let buttonEl: HTMLButtonElement | null = null;
	let isDragging = false;
	let didMove = false;
	let offsetX = 0;
	let offsetY = 0;
	let startX = 0;
	let startY = 0;
	let posX = 24;
	let posY = 420;
	let maxX = 0;
	let maxY = 0;

	const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

	const updateBounds = () => {
		const width = buttonEl?.offsetWidth ?? 0;
		const height = buttonEl?.offsetHeight ?? 0;
		maxX = Math.max(0, window.innerWidth - width - 16);
		maxY = Math.max(0, window.innerHeight - height - 16);
		posX = clamp(posX, 16, maxX);
		posY = clamp(posY, 16, maxY);
	};

	const handlePointerDown = (event: PointerEvent) => {
		if (!buttonEl) {
			return;
		}
		isDragging = true;
		didMove = false;
		buttonEl.setPointerCapture(event.pointerId);
		offsetX = event.clientX - posX;
		offsetY = event.clientY - posY;
		startX = event.clientX;
		startY = event.clientY;
	};

	const handlePointerMove = (event: PointerEvent) => {
		if (!isDragging) {
			return;
		}
		const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
		didMove = distance > 6;
		posX = clamp(event.clientX - offsetX, 16, maxX);
		posY = clamp(event.clientY - offsetY, 16, maxY);
	};

	const handlePointerUp = (event: PointerEvent) => {
		if (!isDragging || !buttonEl) {
			return;
		}
		isDragging = false;
		buttonEl.releasePointerCapture(event.pointerId);
	};

	const handleClick = () => {
		if (isDragging || didMove || loading) {
			return;
		}

		onTranslate();
	};

	onMount(() => updateBounds());
</script>

<svelte:window on:resize={updateBounds} />

<button
	bind:this={buttonEl}
	class="translate"
	type="button"
	style={`transform: translate3d(${posX}px, ${posY}px, 0);`}
	onclick={handleClick}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
>
	{#if loading}
		<div class="spinner"></div>
	{:else}
		<span class="icon">中A</span>
		<span class="text">{label}</span>
	{/if}
</button>

<style>
	.translate {
		position: fixed;
		left: 0;
		top: 0;
		z-index: 30;
		display: grid;
		place-items: center;
		gap: 2px;
		width: 74px;
		height: 74px;
		border-radius: 24px;
		background: #fff;
		border: none;
		box-shadow: 0 12px 32px rgba(20, 30, 60, 0.28);
		cursor: grab;
		touch-action: none;
	}

	.translate:active {
		cursor: grabbing;
	}

	.icon {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 14px;
		background: #4c8c35;
		color: #fff;
		font-weight: 700;
		font-size: 16px;
	}

	.text {
		font-size: 12px;
		color: #2f3a4a;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid rgba(0, 0, 0, 0.1);
		border-top-color: #4b7bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
