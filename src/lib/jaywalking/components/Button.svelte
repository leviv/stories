<script lang="ts">
	import type { Snippet } from 'svelte';
	const {
		variant = 'primary',
		disabled = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'ghost';
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
	} = $props();
</script>

<button {type} class="btn {variant} {className}" {disabled} {onclick}>
	{#if children}
		{@render children()}
	{/if}
</button>

<style>
	.btn {
		border: none;
		border-radius: 999px;
		padding: 10px 18px;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.btn:disabled {
		cursor: not-allowed;
		opacity: 0.55;
		box-shadow: none;
	}

	.primary {
		background: #4c8c35;
		color: #fff;
		box-shadow: 0 10px 24px rgba(76, 140, 53, 0.3);
	}

	.secondary {
		background: #fff;
		color: #4c8c35;
		border: 1px solid #4c8c35;
	}

	.secondary:disabled {
		background: #ede5d8;
		color: #8a95a6;
		border-color: #d1c5b4;
	}

	.ghost {
		background: transparent;
		color: #55647a;
	}

	.ghost:disabled {
		color: #9aa6b2;
	}
</style>
