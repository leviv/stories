<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import IconButton from "$lib/jaywalking/components/IconButton.svelte";
  import type { IconItem } from "$lib/jaywalking/iconData";

  type Locale = "zh" | "en";

  export let items: IconItem[] = [];
  export let locale: Locale;
  export let getLabel: (locale: Locale, key: string) => string;

  const dispatch = createEventDispatcher<{ select: IconItem }>();
</script>

<div class="grid">
  {#each items as item}
    <IconButton
      src={item.src}
      label={getLabel(locale, item.labelKey)}
      showDot={item.hasDot}
      on:click={() => dispatch("select", item)}
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
