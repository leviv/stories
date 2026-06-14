<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	export let title: string;
	export let message: string;
	export let appName: string = 'Messages';
	export let icon: string = '💬'; // Default icon
	export let durationMs: number = 5000;
	export let onDismiss: () => void;

	onMount(() => {
		const timer = setTimeout(() => {
			onDismiss();
		}, durationMs);

		return () => clearTimeout(timer);
	});
</script>

<div
	class="notification-banner"
	in:fly={{ y: -100, duration: 400 }}
	out:fly={{ y: -100, duration: 400 }}
	on:click={onDismiss}
>
	<div class="notification-content">
		<div class="icon-area">
			<!-- Default iOS Contact Icon or custom logo -->
			<div class="contact-icon">
				{#if icon.startsWith('/')}
					<img src={icon} alt={appName} class="custom-app-icon" />
				{:else}
					<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
						<circle cx="50" cy="50" r="50" fill="#8E9DC4" />
						<!-- Silhouette -->
						<circle cx="50" cy="35" r="16" fill="#FFF" />
						<path d="M 22 88 C 22 60, 78 60, 78 88 Z" fill="#FFF" />
					</svg>
				{/if}
			</div>
			<!-- iMessage overlay icon -->
			<div class="imessage-badge">
				<img
					src="https://upload.wikimedia.org/wikipedia/commons/5/51/IMessage_logo.svg"
					alt="iMessage"
				/>
			</div>
		</div>

		<div class="text-area">
			<div class="top-row">
				<span class="title">{title}</span>
				<span class="time">now</span>
			</div>
			<div class="message">{message}</div>
		</div>
	</div>
</div>

<style>
	.notification-banner {
		position: absolute;
		top: 12px;
		left: 12px;
		right: 12px;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(30px) saturate(200%);
		-webkit-backdrop-filter: blur(30px) saturate(200%);
		border-radius: 28px;
		padding: 14px 16px;
		box-shadow:
			0 10px 40px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.6);
		z-index: 100;
		cursor: pointer;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	}

	.notification-content {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.icon-area {
		position: relative;
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.contact-icon {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		overflow: hidden;
	}

	.contact-icon svg {
		width: 100%;
		height: 100%;
	}

	.custom-app-icon {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	.imessage-badge {
		position: absolute;
		bottom: -2px;
		right: -2px;
		width: 20px;
		height: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.imessage-badge img {
		width: 20px;
		height: 20px;
		object-fit: contain;
	}

	.text-area {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
	}

	.top-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 2px;
	}

	.title {
		font-size: 16px;
		font-weight: 600;
		color: #000;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.time {
		font-size: 13px;
		color: #8e8e93;
		flex-shrink: 0;
		margin-left: 8px;
	}

	.message {
		font-size: 15px;
		color: #1c1c1e;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.3;
	}
</style>
