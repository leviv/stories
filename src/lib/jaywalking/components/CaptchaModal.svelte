<script lang="ts">
	import { Slide } from 'go-captcha-svelte';
	import { fade } from 'svelte/transition';

	interface SlidePoint {
		x: number;
		y: number;
	}

	interface Props {
		open?: boolean;
		onSuccess?: () => void;
		onClose?: () => void;
	}

	const { open = false, onSuccess = () => {}, onClose = () => {} }: Props = $props();

	// Mock data for slide captcha
	const slideData = {
		thumbX: 0,
		thumbY: 75,
		thumbWidth: 50,
		thumbHeight: 50,
		image:
			'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjE1MCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ3NDhiIj5TZWN1cml0eSBWZXJpZmljYXRpb248L3RleHQ+PHJlY3QgeD0iMTUwIiB5PSI3NSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjOTRhM2I4Ii8+PC9zdmc+',
		thumb:
			'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMzM0MTU1Ii8+PC9zdmc+'
	};

	let domRef = $state<Slide | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	const handleConfirm = (point: SlidePoint, clear: (fn: Function) => void) => {
		// Mock validation: target is at x=150. Made the threshold extremely loose (100px instead of 10px).
		if (Math.abs(point.x - 150) < 100) {
			setTimeout(() => {
				onSuccess();
			}, 500);
		} else {
			clear(() => {});
		}
	};

	const handleClose = () => {
		onClose();
	};

	$effect(() => {
		if (open && domRef) {
			try {
				domRef.reset();
			} catch {
				// ignore
			}
		}
	});
</script>

{#if open}
	<div class="modal-backdrop" transition:fade={{ duration: 200 }}>
		<div class="modal-content">
			<div class="modal-header">
				<h3>Please Verify</h3>
				<button class="close-btn" onclick={handleClose}>×</button>
			</div>
			<div class="captcha-container">
				<Slide
					config={{ width: 300, height: 200 }}
					data={slideData}
					events={{
						confirm: handleConfirm,
						close: handleClose
					}}
					bind:this={domRef}
				/>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: grid;
		place-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: #fff;
		border-radius: 16px;
		padding: 24px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		width: 348px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 18px;
		color: #1a1a1a;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #666;
		padding: 0;
		line-height: 1;
	}

	.captcha-container {
		display: flex;
		justify-content: center;
	}
</style>
