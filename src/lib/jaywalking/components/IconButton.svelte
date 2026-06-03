<script lang="ts">
	export let src = '';
	export let label = '';
	export let showDot = false;
	export let size: 'sm' | 'md' = 'md';
	export let onClick: (() => void) | undefined;

	const handleClick = () => onClick?.();
</script>

<button class={`icon-button ${size}`} type="button" onclick={handleClick}>
	<span class="icon-wrap">
		<img {src} alt={label} loading="lazy" />
		{#if showDot}
			<span class="dot" aria-hidden="true"></span>
		{/if}
	</span>
	<span class="label">{label}</span>
</button>

<style>
	.icon-button {
		border: none;
		background: transparent;
		display: grid;
		gap: 8px;
		justify-items: center;
		cursor: pointer;
	}

	.icon-wrap {
		position: relative;
		width: 56px;
		height: 56px;
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.9);
		display: grid;
		place-items: center;
	}

	.icon-button.sm .icon-wrap {
		width: 48px;
		height: 48px;
		border-radius: 16px;
	}

	img {
		width: 34px;
		height: 34px;
		object-fit: contain;
	}

	.icon-button.sm img {
		width: 28px;
		height: 28px;
	}

	.label {
		font-size: 13px;
		color: #1f2b3a;
		letter-spacing: 0.2px;
	}

	.icon-button.sm .label {
		font-size: 12px;
	}

	.dot {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: #ff3b30;
		box-shadow: 0 0 0 2px #fff;
	}
</style>
