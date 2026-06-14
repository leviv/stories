<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let animationFrameId: number;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return;
		}

		let width = canvas.clientWidth;
		let height = canvas.clientHeight;
		canvas.width = width;
		canvas.height = height;

		let scrollX = 0;
		const scrollSpeed = 20; // pixels per second
		let lastTime = performance.now();

		// Data structures
		let mountains: any[] = [];
		let nextMountainX = -500;

		function generateMountains(upToX: number) {
			while (nextMountainX < upToX) {
				const w = 200 + Math.random() * 300;
				const h = 80 + Math.random() * 150;
				// Add a slight random tint variation to each mountain so overlapping ones remain distinct
				const tint = Math.random() * 10;
				const colorBottom = `hsl(210, 20%, ${92 + tint}%)`; // Very subtle blue-grey

				mountains.push({
					x: nextMountainX,
					w,
					h,
					colorBottom
				});

				// Overlap mountains so it forms a continuous ridge
				nextMountainX += w * (0.3 + Math.random() * 0.3);
			}
		}

		function render(time: number) {
			const dt = (time - lastTime) / 1000;
			lastTime = time;

			if (canvas.clientWidth !== width || canvas.clientHeight !== height) {
				width = canvas.clientWidth;
				height = canvas.clientHeight;
				canvas.width = width;
				canvas.height = height;
			}

			if (dt < 1.0) {
				scrollX += scrollSpeed * dt;
			}

			generateMountains(scrollX + width + 500);

			// Cleanup old content
			mountains = mountains.filter((m) => m.x + m.w > scrollX - 500);

			if (!ctx) {
				return;
			}

			const horizonY = height * 0.8;

			// Sky with subtle gradient
			const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
			skyGrad.addColorStop(0, '#eef1f4'); // subtle cool gray at top
			skyGrad.addColorStop(1, '#ffffff'); // pure white at horizon
			ctx.fillStyle = skyGrad;
			ctx.fillRect(0, 0, width, horizonY);

			// Foreground with subtle gradient
			const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
			groundGrad.addColorStop(0, '#ffffff'); // pure white at horizon
			groundGrad.addColorStop(1, '#eef1f4'); // subtle cool gray at bottom
			ctx.fillStyle = groundGrad;
			ctx.fillRect(0, horizonY, width, height - horizonY);

			// Draw mountains
			for (const m of mountains) {
				const screenX = m.x - scrollX;
				ctx.save();
				ctx.translate(screenX, horizonY);

				// Very subtle gradient for each triangle
				const mntGrad = ctx.createLinearGradient(0, -m.h, 0, 0);
				mntGrad.addColorStop(0, '#ffffff'); // pure white at peak
				mntGrad.addColorStop(1, m.colorBottom); // subtle tinted base

				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(m.w * 0.5, -m.h); // peak
				ctx.lineTo(m.w, 0);
				ctx.closePath();

				ctx.fillStyle = mntGrad;
				ctx.fill();

				// Very faint stroke to separate overlapping triangles
				ctx.strokeStyle = 'rgba(0, 0, 0, 0.02)';
				ctx.lineWidth = 1;
				ctx.stroke();

				ctx.restore();
			}

			animationFrameId = requestAnimationFrame(render);
		}

		animationFrameId = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	});
</script>

<canvas bind:this={canvas} class="svalbard-landscape"></canvas>

<style>
	.svalbard-landscape {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
	}
</style>
