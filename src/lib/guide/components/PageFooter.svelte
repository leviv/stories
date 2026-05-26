<script lang="ts">
	import RoughBlock from './RoughBlock.svelte';
	import LetterHop from './LetterHop.svelte';

	interface Props {
		params: {
			roughness: number;
			fillStyle: string;
			bowing: number;
			fillWeight: number;
			hachureGap: number;
		};
	}

	let { params }: Props = $props();

	let roughBlock: ReturnType<typeof RoughBlock>;

	export function redraw() {
		roughBlock?.redraw();
	}
</script>

<footer class="page-footer">
	<RoughBlock bind:this={roughBlock} color="#60D4C6" seed={99} {params}>
		<h1>
			<LetterHop
				segments={[{ text: 'Made with <3 by ' }, { text: 'Levi', href: 'https://leviv.cool' }]}
			/>
		</h1>
	</RoughBlock>
</footer>

<style>
	.page-footer {
		margin-left: -60px;
		margin-top: auto;
	}

	.page-footer h1 {
		font-family: 'Monofett', monospace;
		margin: 0;
		padding-left: 10px;
		color: #0e334a;
	}
</style>
