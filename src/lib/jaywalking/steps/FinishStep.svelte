<script lang="ts">
	import GlitchScreen from '../components/GlitchScreen.svelte';
	import { PowerGlitch } from 'powerglitch';

	const {
		locale,
		onRestart,
		failed = false,
		photoSrc = null
	}: {
		locale: string;
		onRestart: () => void;
		failed?: boolean;
		photoSrc?: string | null;
	} = $props();

	const getTitle = (isFailed: boolean, currentLocale: string) => {
		const zh = isFailed ? '你失败了' : '你成功了';
		const en = isFailed ? 'You Failed' : 'You Succeeded';
		if (currentLocale === 'zh') {
			return `${zh} / ${en}`;
		}
		return `${en} / ${zh}`;
	};

	function glitchHover(node: HTMLElement) {
		PowerGlitch.glitch(node, {
			playMode: 'hover',
			createContainers: true,
			hideOverflow: false,
			timing: { duration: 400 },
			shake: { velocity: 15, amplitudeX: 0.04, amplitudeY: 0.04 },
			slice: { count: 4, velocity: 15, minHeight: 0.02, maxHeight: 0.15, hueRotate: true }
		});
	}
</script>

<GlitchScreen
	title={getTitle(failed, locale)}
	buttonText={locale === 'zh' ? '重试 / Retry' : 'Retry / 重试'}
	onAction={onRestart}
>
	{#snippet content()}
		<p>
			Landing in Shanghai Pudong airport and trying to figure out VPNs, WeChat, AliPay, verification
			in addition to a steep language barrier has been to date the harshest intro to a new country
			I've ever had.
		</p>
		<p>
			Over the past few weeks, I've gotten a bit more comfortable with the mega-apps, the errs, and
			the many prompts I accept without knowing what they are asking for. I constantly worry about
			performing the wrong action and getting banned, or ending up on a digital blacklist that would
			leave me paralyzed in a country that so heavily relies on phone access.
		</p>
		<p>But it always makes me wonder, is technology like this really the future?</p>
	{/snippet}

	{#snippet rightExtra()}
		{#if failed && photoSrc}
			<div class="shame-photo-container">
				<img src={photoSrc} alt="User" class="shame-photo" use:glitchHover />
			</div>
		{/if}
	{/snippet}
</GlitchScreen>

<style>
	.shame-photo-container {
		position: absolute;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.shame-photo {
		width: 280px;
		height: 280px;
		object-fit: cover;
		border: 4px solid #ff003c;
		box-shadow: 0 0 40px rgba(255, 0, 60, 0.4);
		transform: rotate(-5deg);
	}
</style>
