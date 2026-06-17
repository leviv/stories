<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import { base } from '$app/paths';

	export let text: string = '';
	export let isSender: boolean = false;
	export let isTyping: boolean = false;
	export let hideTail: boolean = false;

	// Reaction logic
	let showReactionMenu = false;
	let reactionType: string | null = null;
	let pressTimer: any;
	const reactionIcons = ['heart', 'like', 'dislike', 'laugh', 'emphasize', 'question'];

	function handlePointerDown() {
		if (isTyping) return;
		pressTimer = setTimeout(() => {
			showReactionMenu = true;
		}, 400);
	}

	function handlePointerUp() {
		clearTimeout(pressTimer);
	}

	function selectReaction(type: string) {
		reactionType = type;
		showReactionMenu = false;
		const audio = new Audio(`${base}/messages/sound-effects/reaction.m4a`);
		audio.play().catch((e) => console.error(e));
	}

	// We are forcing light mode bubbles for this implementation
	const rightBubbleSvg = hideTail
		? `${base}/messages/message-bubbles/right-no-tail-light.svg`
		: `${base}/messages/message-bubbles/right-bubble-light.svg`;
	const leftBubbleSvg = hideTail
		? `${base}/messages/message-bubbles/left-no-tail-light.svg`
		: `${base}/messages/message-bubbles/left-bubble-light.svg`;
	const typingIndicatorSvg = `${base}/messages/typing-bubbles/chat-typing-light.svg`;

	const borderImageSource = isSender
		? rightBubbleSvg
		: isTyping
			? typingIndicatorSvg
			: leftBubbleSvg;

	const borderImageSlice = hideTail ? '31 31 31 31' : isSender ? '31 43 31 31' : '31 31 31 43';
</script>

<div
	class="message-wrapper {isSender ? 'is-sender' : 'is-receiver'} {isTyping ? 'is-typing' : ''}"
	in:scale={{ duration: 200, start: 0.9 }}
>
	{#if showReactionMenu}
		<div
			class="reaction-overlay"
			on:pointerdown|stopPropagation={() => (showReactionMenu = false)}
		></div>
	{/if}

	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="bubble {hideTail ? 'no-tail' : ''}"
		style="
      border-image-source: url('{borderImageSource}');
      border-image-slice: {borderImageSlice};
    "
		on:pointerdown={handlePointerDown}
		on:pointerup={handlePointerUp}
		on:pointercancel={handlePointerUp}
		on:pointerleave={handlePointerUp}
		on:contextmenu|preventDefault={() => {}}
	>
		{#if showReactionMenu}
			<div
				class="reaction-menu {isSender ? 'sender' : 'receiver'}"
				in:scale={{ duration: 150, start: 0.8 }}
			>
				{#each reactionIcons as type}
					<button class="reaction-btn" on:pointerdown|stopPropagation={() => selectReaction(type)}>
						<img src="{base}/messages/reactions/{type}-gray.svg" alt={type} />
					</button>
				{/each}
			</div>
		{/if}

		{#if reactionType}
			<div class="reaction-badge {isSender ? 'sender' : 'receiver'}" in:scale={{ duration: 200 }}>
				<img
					src="{base}/messages/reactions/{isSender ? 'left' : 'right'}-light-{reactionType}.svg"
					alt="reaction"
				/>
			</div>
		{/if}
		{#if !hideTail}
			<div class="border-artifact-cover {isSender ? 'sender' : 'receiver'}"></div>
		{/if}
		<div class="content">
			{#if isTyping}
				<div class="typing-indicator">
					<div class="dot"></div>
					<div class="dot"></div>
					<div class="dot"></div>
				</div>
			{:else}
				{text}
			{/if}
		</div>
	</div>
</div>

<style>
	.message-wrapper {
		display: flex;
		width: 100%;
		margin-bottom: 4px;
		position: relative;
	}

	.message-wrapper.is-sender {
		justify-content: flex-end;
	}

	.message-wrapper.is-receiver {
		justify-content: flex-start;
	}

	.bubble {
		max-width: 75%;
		border-style: solid;
		border-width: 17px;
		/* Default widths, overridden based on sender/tail */
		word-break: break-word;
		position: relative;
		color: #111827; /* dark text for received */
		background-color: #f3f4f6; /* gray-100 */
		cursor: default;
		user-select: none;
		-webkit-user-select: none;
	}

	.reaction-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 40;
	}

	.reaction-menu {
		position: absolute;
		top: -45px;
		background: #e5e5ea;
		border-radius: 30px;
		padding: 6px 10px;
		display: flex;
		gap: 8px;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
		z-index: 50;
		cursor: default;
	}
	.reaction-menu.sender {
		right: 0;
	}
	.reaction-menu.receiver {
		left: 0;
	}

	.reaction-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		width: 28px;
		height: 28px;
		transition: transform 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}
	.reaction-btn:hover {
		transform: scale(1.2);
		background: rgba(0, 0, 0, 0.05);
	}
	.reaction-btn img {
		width: 85%;
		height: 85%;
	}

	.reaction-badge {
		position: absolute;
		top: -24px;
		width: 36px;
		height: 36px;
		z-index: 30;
	}
	.reaction-badge.sender {
		left: -18px;
	}
	.reaction-badge.receiver {
		right: -18px;
	}
	.reaction-badge img {
		width: 100%;
		height: 100%;
	}

	.border-artifact-cover {
		position: absolute;
		border-right: 1px solid #f3f4f6;
		pointer-events: none;
	}
	.border-artifact-cover.sender {
		top: -17px;
		right: -22px;
		bottom: -17px;
		left: -17px;
	}
	.border-artifact-cover.receiver {
		top: -17px;
		right: -17px;
		bottom: -17px;
		left: -22px;
	}

	/* Sender styling */
	.message-wrapper.is-sender .bubble {
		color: white;
		background-color: #007aff; /* iOS Blue */
		border-right-width: 22px;
	}
	.message-wrapper.is-sender .bubble.no-tail {
		border-right-width: 17px;
		margin-right: 5px;
	}

	/* Receiver styling */
	.message-wrapper.is-receiver .bubble {
		border-left-width: 22px;
	}
	.message-wrapper.is-receiver .bubble.no-tail {
		border-left-width: 17px;
		margin-left: 5px;
	}

	.content {
		margin-top: -10px;
		margin-bottom: -10px;
		margin-left: -4px;
		margin-right: -4px;
		font-size: 15px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		line-height: 1.3;
		display: flex;
		align-items: center;
	}

	.typing-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		height: 20px;
		padding: 0 4px;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: #9ca3af;
		animation: blink 1.4s infinite linear;
	}

	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes blink {
		0% {
			opacity: 0.3;
		}
		20% {
			opacity: 1;
		}
		100% {
			opacity: 0.3;
		}
	}
</style>
