<script lang="ts">
	import RoughBlock from './RoughBlock.svelte';
	import LetterHop from './LetterHop.svelte';

	interface Props {
		text: string;
		color?: string;
		seed?: number;
		params: {
			roughness: number;
			fillStyle: string;
			bowing: number;
			fillWeight: number;
			hachureGap: number;
		};
	}

	let { text, color = '#FCC5A2', seed = 42, params }: Props = $props();

	let roughBlock: ReturnType<typeof RoughBlock>;

	export function redraw() {
		roughBlock?.redraw();
	}
</script>

<header class="page-header">
	<RoughBlock bind:this={roughBlock} {color} {seed} {params}>
		<h1>
			<LetterHop segments={[{ text }]} />
		</h1>
	</RoughBlock>
</header>

<style>
	.page-header {
		text-align: left;
	}

	.page-header h1 {
		font-family: 'Monofett', monospace;
		margin: 0;
		cursor: default;
		color: #0e334a;
	}
</style>
