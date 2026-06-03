<script lang="ts">
	import IconButton from '$lib/jaywalking/components/IconButton.svelte';
	import type { IconItem } from '$lib/jaywalking/iconData';

	export let items: IconItem[] = [];
	export let locale: string;
	export let getLabel: (locale: string, key: string) => string;
	export let onSelect: ((item: IconItem) => void) | undefined;
</script>

<div class="grid">
	{#each items as item (item.id)}
		<IconButton
			src={item.src}
			label={getLabel(locale, item.labelKey)}
			showDot={item.hasDot}
			onClick={() => onSelect?.(item)}
		/>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 18px 10px;
		padding: 8px 8px 4px;
	}

	@media (max-width: 540px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 16px 6px;
		}
	}
</style>
