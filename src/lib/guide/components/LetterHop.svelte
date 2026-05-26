<script lang="ts">
	import { resolve } from '$app/paths';

	export interface TextSegment {
		text: string;
		href?: string;
	}

	interface Props {
		segments: TextSegment[];
	}

	let { segments }: Props = $props();

	interface CharInfo {
		char: string;
		href?: string;
		index: number;
	}

	let chars: CharInfo[] = $derived.by(() => {
		let index = 0;
		return segments.flatMap((seg) =>
			seg.text.split('').map((char) => ({ char, href: seg.href, index: index++ }))
		);
	});

	let animating = $state(false);

	function triggerHop() {
		if (animating) return;
		animating = true;
		setTimeout(() => {
			animating = false;
		}, 800);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span class="letter-hop-wrap" onmouseenter={triggerHop}>
	{#each chars as { char, href, index } (index)}
		{#if href}
			<a
				href={resolve(href)}
				target="_blank"
				rel="noopener noreferrer"
				class="letter"
				class:hop={animating}
				style="--i: {index}">{char === ' ' ? '\u00A0' : char}</a
			>
		{:else}
			<span class="letter" class:hop={animating} style="--i: {index}"
				>{char === ' ' ? '\u00A0' : char}</span
			>
		{/if}
	{/each}
</span>

<style>
	.letter-hop-wrap {
		cursor: default;
	}

	.letter {
		display: inline-block;
	}

	.letter.hop {
		animation: letter-hop 0.35s calc(var(--i) * 15ms) cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	a.letter {
		color: inherit;
		text-decoration: underline;
	}

	@keyframes letter-hop {
		0% {
			transform: translateY(0);
		}
		35% {
			transform: translateY(-0.35em);
		}
		65% {
			transform: translateY(0.1em);
		}
		85% {
			transform: translateY(-0.04em);
		}
		100% {
			transform: translateY(0);
		}
	}
</style>
