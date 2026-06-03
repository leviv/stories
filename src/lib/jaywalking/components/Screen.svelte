<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		title,
		subtitle,
		class: className = '',
		children,
		actions
	}: {
		title?: string;
		subtitle?: string | Snippet;
		class?: string;
		children?: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<div class="screen {className}">
	<div class="screen-card">
		{#if title}
			<h1>{title}</h1>
		{/if}
		{#if subtitle}
			{#if typeof subtitle === 'string'}
				<p>{subtitle}</p>
			{:else}
				{@render subtitle()}
			{/if}
		{/if}

		{#if children}
			{@render children()}
		{/if}

		{#if actions}
			<div class="screen-actions">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>

<style>
	.screen {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 40px 140px 80px 24px;
		box-sizing: border-box;
		position: relative;
	}

	.screen::before {
		content: '';
		position: absolute;
		inset: 0;
		background: #ede5d8;
		z-index: -1;
	}

	.screen-card {
		width: min(720px, 92vw);
		background: #fff;
		border-radius: 20px;
		box-shadow: 0 20px 50px rgba(12, 30, 70, 0.18);
		padding: 28px;
		display: grid;
		gap: 16px;
	}

	h1 {
		margin: 0;
		font-size: 28px;
		color: #4c8c35;
	}

	p {
		margin: 0;
		color: #4c8c35;
		line-height: 1.5;
	}

	.screen-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	@media (max-width: 720px) {
		.screen {
			padding: 96px 16px 120px;
		}
	}
</style>
