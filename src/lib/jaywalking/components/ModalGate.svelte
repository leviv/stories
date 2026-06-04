<script lang="ts">
	import Button from '$lib/jaywalking/components/Button.svelte';
	export let open = false;
	export let title = '';
	export let body = '';
	export let actionLabel = '';
	export let onClose: (() => void) | undefined;
	export let onAction: (() => void) | undefined;

	const close = () => onClose?.();

	const handleAction = () => {
		if (onAction) {
			onAction();
			return;
		}

		close();
	};

	const handleBackdropClick = (event: MouseEvent) => {
		if (event.target === event.currentTarget) {
			close();
		}
	};
</script>

{#if open}
	<div class="backdrop" role="presentation" onclick={handleBackdropClick}>
		<div class="modal" role="dialog" aria-modal="true" aria-label={title}>
			<h3>{title}</h3>
			<p>{body}</p>
			<Button onclick={handleAction}>{actionLabel}</Button>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(7, 13, 25, 0.55);
		display: grid;
		place-items: center;
		z-index: 40;
	}

	.modal {
		width: min(320px, 84vw);
		background: #fff;
		border-radius: 18px;
		padding: 22px 20px;
		text-align: center;
		box-shadow: 0 18px 60px rgba(10, 20, 40, 0.28);
	}

	h3 {
		margin: 0 0 10px;
		font-size: 18px;
		color: #0b1b33;
	}

	p {
		margin: 0 0 18px;
		color: #425065;
		font-size: 14px;
		line-height: 1.5;
	}
</style>
