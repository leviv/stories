<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		title,
		subtitle,
		class: className = "",
		children,
		actions
	}: {
		title?: string;
		subtitle?: string;
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
			<p>{subtitle}</p>
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
		content: "";
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.9), transparent 55%),
			linear-gradient(180deg, #e5f0ff 0%, #eef2f8 45%, #f6f8fb 100%);
		z-index: -1;
	}

	.screen-card {
		width: min(720px, 92vw);
		background: #fff;
		border-radius: 28px;
		box-shadow: 0 20px 50px rgba(12, 30, 70, 0.18);
		padding: 28px;
		display: grid;
		gap: 16px;
	}

	h1 {
		margin: 0;
		font-size: 28px;
		color: #0b1b33;
	}

	p {
		margin: 0;
		color: #445266;
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
