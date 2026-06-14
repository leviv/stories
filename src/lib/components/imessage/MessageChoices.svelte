<script lang="ts">
	import { fly } from 'svelte/transition';

	export let choices: string[] = [];
	export let onSelect: (choice: string) => void;
</script>

{#if choices.length > 0}
	<div class="choices-container" in:fly={{ y: 50, duration: 300 }}>
		{#each choices as choice (choice)}
			<button class="choice-button" on:click={() => onSelect(choice)}>
				{choice}
			</button>
		{/each}
	</div>
{/if}

<style>
	.choices-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 16px;
		padding: 0;
		width: 100%;
		align-items: flex-end; /* user messages usually align right */
		box-sizing: border-box;
	}

	.choice-button {
		background-color: transparent;
		color: #007aff;
		border: 1px solid #007aff;
		border-radius: 20px;
		padding: 8px 16px;
		font-size: 15px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		cursor: pointer;
		transition: all 0.2s ease;
		max-width: 85%;
		text-align: left;
		line-height: 1.3;
		margin-right: 5px;
	}

	.choice-button:hover {
		background-color: #007aff;
		color: white;
	}
</style>
