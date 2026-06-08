<script lang="ts">
	import type { Snippet } from 'svelte';
	let { count, children }: { count: number; children: Snippet } = $props();
</script>

<div class="ant-badge">
	{@render children()}
	{#if count > 0}
		<sup class="ant-badge-count">{count}</sup>
	{/if}
</div>

<style>
	.ant-badge {
		position: relative;
		display: inline-block;
		line-height: 1;
	}
	.ant-badge-count {
		position: absolute;
		top: -6px;
		right: -10px;
		z-index: 10;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		color: #fff;
		font-weight: normal;
		font-size: 12px;
		line-height: 20px;
		white-space: nowrap;
		text-align: center;
		background: #ff4d4f;
		border-radius: 10px;
		box-shadow: 0 0 0 1px #fff;
		box-sizing: border-box;
	}
</style>
