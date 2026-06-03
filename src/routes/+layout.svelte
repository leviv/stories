<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link
		rel="icon"
		href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>📖</text></svg>"
	/>
</svelte:head>

{@render children()}

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		height: 100%;
	}
</style>
