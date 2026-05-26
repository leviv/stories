<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import rough from 'roughjs';

	interface Props {
		color?: string;
		seed?: number;
		params: {
			roughness: number;
			fillStyle: string;
			bowing: number;
			fillWeight: number;
			hachureGap: number;
		};
		children: Snippet;
	}

	let { color = '#FCC5A2', seed = 42, params, children }: Props = $props();

	let wrapEl: HTMLElement;
	let canvasEl: HTMLCanvasElement;

	export function redraw() {
		if (!wrapEl || !canvasEl) return;

		canvasEl.style.display = 'none';
		const rect = wrapEl.getBoundingClientRect();
		canvasEl.style.display = '';

		const pad = 20;
		canvasEl.width = rect.width + pad * 2;
		canvasEl.height = rect.height + pad * 2;

		const ctx = canvasEl.getContext('2d')!;
		ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

		ctx.translate(rect.width + pad, pad);
		ctx.rotate(Math.PI / 2);

		const rc = rough.canvas(canvasEl);
		rc.rectangle(0, 0, rect.height, rect.width, {
			fill: color,
			stroke: color,
			strokeWidth: 1,
			roughness: params.roughness,
			fillStyle: params.fillStyle,
			bowing: params.bowing,
			fillWeight: params.fillWeight,
			hachureGap: params.hachureGap,
			seed
		});
	}

	onMount(() => {
		redraw();
	});
</script>

<div class="rough-block" bind:this={wrapEl}>
	<canvas bind:this={canvasEl} class="rough-canvas"></canvas>
	<div class="rough-block-content">
		{@render children()}
	</div>
</div>

<style>
	.rough-block {
		position: relative;
	}

	.rough-canvas {
		position: absolute;
		top: -20px;
		left: -20px;
		width: calc(100% + 40px);
		height: calc(100% + 40px);
		pointer-events: none;
	}

	.rough-block-content {
		position: relative;
		z-index: 1;
	}
</style>
