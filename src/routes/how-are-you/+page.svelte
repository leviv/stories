<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import MessageBubble from '$lib/how-are-you/MessageBubble.svelte';
	import MessageChoices from '$lib/how-are-you/MessageChoices.svelte';
	import FakeNotification from '$lib/how-are-you/FakeNotification.svelte';
	import SwirlingMessages from '$lib/how-are-you/SwirlingMessages.svelte';
	import { saveResponse, getResponses } from '$lib/api/responses';
	import scriptData from '$lib/how-are-you/script.json';

	type ScriptStep = {
		sender: 'me' | 'them';
		text?: string;
		choices?: string[];
		delay?: number;
		notification?: { title: string; message: string; appName: string; icon: string };
	};

	const script: ScriptStep[] = scriptData as ScriptStep[];

	let history: { id: number; sender: 'me' | 'them'; text: string }[] = [];
	let stepIndex = 0;
	let isTyping = false;
	let currentChoices: string[] = [];
	let notificationQueue: { title: string; message: string; appName: string; icon: string }[] = [];
	let activeNotification: { title: string; message: string; appName: string; icon: string } | null =
		null;
	let userFinalInput = '';
	let showFinalInput = false;
	let hasSubmitted = false;

	let swirlingMessagesList: string[] = [];
	let chatContainer: HTMLElement;

	let sentAudio: HTMLAudioElement;
	let receivedAudio: HTMLAudioElement;
	let unreadAudio: HTMLAudioElement;

	function playSound(audio: HTMLAudioElement) {
		if (audio) {
			audio.currentTime = 0;
			audio.play().catch((e) => console.error('Audio play failed:', e));
		}
	}

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	async function processNextStep() {
		if (stepIndex >= script.length) {
			setTimeout(() => {
				showFinalInput = true;
				scrollToBottom();
			}, 1000);
			return;
		}

		const step = script[stepIndex];

		if (step.notification) {
			notificationQueue = [...notificationQueue, step.notification];
			showNextNotification();
		}

		if (step.sender === 'them') {
			isTyping = true;
			await scrollToBottom();

			setTimeout(async () => {
				isTyping = false;
				history = [...history, { id: Date.now(), sender: 'them', text: step.text || '' }];
				playSound(receivedAudio);
				stepIndex++;
				await scrollToBottom();

				// Slightly delay before processing next to make it feel natural
				setTimeout(processNextStep, 500);
			}, step.delay || 1500);
		} else if (step.sender === 'me') {
			currentChoices = step.choices || [];
			await scrollToBottom();
		}
	}

	async function handleChoice(choice: string) {
		currentChoices = [];
		history = [...history, { id: Date.now(), sender: 'me', text: choice }];
		playSound(sentAudio);
		stepIndex++;
		await scrollToBottom();

		// Add a natural delay before they start typing the next message
		setTimeout(processNextStep, 800);
	}

	function startOver() {
		history = [];
		stepIndex = 0;
		isTyping = false;
		currentChoices = [];
		activeNotification = null;
		userFinalInput = '';
		showFinalInput = false;
		hasSubmitted = false;

		setTimeout(() => {
			processNextStep();
		}, 500);
	}

	function showNextNotification() {
		if (activeNotification || notificationQueue.length === 0) {
			return;
		}
		activeNotification = notificationQueue.shift() || null;
		if (activeNotification) {
			playSound(unreadAudio);
		}
	}

	function dismissNotification() {
		activeNotification = null;
		setTimeout(showNextNotification, 500); // Wait for exit animation
	}

	async function submitFinalInput(e: Event) {
		e.preventDefault();
		if (!userFinalInput.trim() || hasSubmitted) {
			return;
		}

		hasSubmitted = true;
		const submittedText = userFinalInput.trim();

		// Add our message to the chat
		history = [...history, { id: Date.now(), sender: 'me', text: submittedText }];
		playSound(sentAudio);
		showFinalInput = false;
		await scrollToBottom();

		// Save our response
		await saveResponse(submittedText);

		// Include our own response in the swirl so we see it too
		swirlingMessagesList = [submittedText, ...swirlingMessagesList];
	}

	onMount(async () => {
		sentAudio = new Audio(`${base}/messages/sound-effects/sent.m4a`);
		receivedAudio = new Audio(`${base}/messages/sound-effects/received.m4a`);
		unreadAudio = new Audio(`${base}/messages/sound-effects/unread.m4a`);

		console.log('bruh');

		// Fetch initial responses to show immediately
		try {
			console.log('Fetching responses from Firebase...');
			const fetched = await getResponses(50);
			console.log('Fetched responses:', fetched);

			// If database is empty, show some fallback messages so the effect is visible
			if (fetched.length === 0) {
				swirlingMessagesList = [
					"I'm doing okay, just tired.",
					'Hanging in there!',
					'Could be better, could be worse.',
					'Actually having a pretty good day.',
					'Exhausted.',
					'Thinking about the weekend...',
					'Just taking it one day at a time.',
					'A bit overwhelmed, but surviving.'
				];
			} else {
				swirlingMessagesList = fetched;
			}
		} catch (e) {
			console.error('Failed to fetch responses:', e);
		}

		// Start the story after a brief initial pause
		setTimeout(() => {
			processNextStep();
		}, 1000);
	});
</script>

<div class="page-container">
	{#if swirlingMessagesList.length > 0}
		<SwirlingMessages messages={swirlingMessagesList} />
	{/if}

	{#if hasSubmitted}
		<div class="start-over-overlay" in:fade={{ duration: 500, delay: 2000 }}>
			<button class="start-over-btn" on:click={startOver}> Start Over </button>
		</div>
	{/if}

	<div class="phone-frame">
		{#if activeNotification}
			<FakeNotification
				title={activeNotification.title}
				message={activeNotification.message}
				appName={activeNotification.appName}
				icon={activeNotification.icon}
				onDismiss={dismissNotification}
			/>
		{/if}

		<!-- Header Fade Effect -->
		<div class="header-fade"></div>

		<!-- iOS Top Bar -->
		<div class="ios-header">
			<div class="header-left">
				<button class="liquid-glass liquid-glass-pill back-btn" aria-label="Back">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M15 18l-6-6 6-6" />
					</svg>
					<span class="unread-count-pill">1050</span>
				</button>
			</div>

			<div class="header-center">
				<div class="profile-pic-container">
					<img src="{base}/messages/levi.png" alt="Levi" class="profile-pic" />
				</div>
				<div class="liquid-glass liquid-glass-pill name-pill">
					Levi
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M9 18l6-6-6-6" />
					</svg>
				</div>
			</div>

			<div class="header-right">
				<button class="liquid-glass liquid-glass-circle facetime-btn" aria-label="FaceTime">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				</button>
			</div>
		</div>

		<div class="chat-area" bind:this={chatContainer}>
			<div class="messages-list">
				{#each history as msg, i (msg.id)}
					<MessageBubble
						text={msg.text}
						isSender={msg.sender === 'me'}
						hideTail={i < history.length - 1 && history[i + 1].sender === msg.sender}
					/>
				{/each}

				{#if isTyping}
					<MessageBubble isTyping={true} isSender={false} />
				{/if}
			</div>

			{#if currentChoices.length > 0}
				<MessageChoices choices={currentChoices} onSelect={handleChoice} />
			{/if}
		</div>

		<div class="input-area">
			{#if showFinalInput}
				<form class="final-form" on:submit={submitFinalInput} in:fade>
					<input type="text" bind:value={userFinalInput} placeholder="iMessage" class="ios-input" />
					<button
						type="submit"
						class="send-btn"
						aria-label="Send message"
						disabled={!userFinalInput.trim()}
					>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle cx="12" cy="12" r="12" fill={userFinalInput.trim() ? '#007AFF' : '#E5E5EA'} />
							<path
								d="M12 6L12 17M12 6L8 10M12 6L16 10"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</form>
			{:else}
				<div class="fake-input-bar">
					<div class="fake-input">iMessage</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Base page layout */
	.page-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		overflow: hidden;
		background-color: #f3f4f6;
	}

	.phone-frame {
		width: 100%;
		height: 100%;
		max-width: 400px;
		max-height: 850px;
		background-color: white;
		position: relative;
		display: flex;
		flex-direction: column;
		z-index: 10; /* Above swirling messages */
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	@media (min-width: 600px) {
		.phone-frame {
			height: 90vh;
			border-radius: 40px;
			border: 8px solid #111827; /* Fake phone bezel */
		}
	}

	@media (max-width: 600px) {
		.phone-frame {
			width: 100vw;
			height: 100vh;
			border: none;
			border-radius: 40px;
			overflow: hidden;
		}
	}

	/* Header */
	.header-fade {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 140px;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95) 20%, rgba(255, 255, 255, 0));
		pointer-events: none;
		z-index: 5;
	}

	.ios-header {
		height: 100px;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 20px 16px 0;
		background: transparent;
		border: none;
		position: relative;
		z-index: 10;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.liquid-glass {
		background: rgba(255, 255, 255, 0.65);
		backdrop-filter: blur(25px) saturate(200%);
		-webkit-backdrop-filter: blur(25px) saturate(200%);
		border: 1px solid rgba(255, 255, 255, 0.4);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
	}

	.unread-count-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4px 10px;
		border-radius: 20px;
		font-weight: 600;
		font-size: 14px;
		color: #fff;
		background-color: #000;
	}

	.liquid-glass-pill {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 6px 14px;
		border-radius: 20px;
		gap: 4px;
		font-weight: 500;
		color: #1c1c1e;
		cursor: pointer;
		transition: transform 0.2s;
	}
	.liquid-glass-pill:active {
		transform: scale(0.95);
	}

	.liquid-glass-circle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		border-radius: 50%;
		color: #1c1c1e;
		cursor: pointer;
		transition: transform 0.2s;
	}
	.liquid-glass-circle:active {
		transform: scale(0.95);
	}

	.header-left,
	.header-right {
		flex: 1;
		display: flex;
	}
	.header-right {
		justify-content: flex-end;
	}

	.header-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		margin-top: -10px;
	}

	.profile-pic-container {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.6);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	.profile-pic {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.name-pill {
		font-size: 13px;
		padding: 4px 12px;
	}

	/* Chat Area */
	.chat-area {
		flex: 1;
		overflow-y: auto;
		padding: 16px 12px;
		display: flex;
		flex-direction: column;
		scroll-behavior: smooth;
	}

	.messages-list {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	/* Input Area */
	.input-area {
		padding: 10px 16px;
		padding-bottom: calc(10px + env(safe-area-inset-bottom, 10px));
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-top: 0.5px solid rgba(0, 0, 0, 0.1);
		z-index: 20;
		box-sizing: border-box;
		width: 100%;
	}

	.fake-input-bar {
		width: 100%;
		height: 36px;
		border-radius: 18px;
		border: 1px solid #e5e5ea;
		display: flex;
		align-items: center;
		padding: 0 16px;
		box-sizing: border-box;
	}

	.fake-input {
		color: #c7c7cc;
		font-size: 15px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.final-form {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		box-sizing: border-box;
	}

	.ios-input {
		flex: 1;
		height: 36px;
		border-radius: 18px;
		border: 1px solid #e5e5ea;
		padding: 0 16px;
		font-size: 15px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		outline: none;
		box-sizing: border-box;
		width: 100%;
	}

	.ios-input:focus {
		border-color: #007aff;
	}

	.send-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.send-btn:disabled {
		cursor: default;
	}

	.start-over-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.4);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
	}

	.start-over-btn {
		background-color: #007aff;
		color: white;
		border: none;
		border-radius: 20px;
		padding: 10px 24px;
		font-size: 16px;
		font-weight: 500;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
		transition: transform 0.2s;
	}
	.start-over-btn:active {
		transform: scale(0.95);
	}
</style>
