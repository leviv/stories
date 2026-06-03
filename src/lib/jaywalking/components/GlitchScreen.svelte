<script lang="ts">
	import { PowerGlitch } from 'powerglitch';
	import type { Snippet } from 'svelte';

	const {
		title,
		content,
		buttonText,
		onAction,
		rightExtra
	}: {
		title: string;
		content: Snippet;
		buttonText: string;
		onAction: () => void;
		rightExtra?: Snippet;
	} = $props();

	const allPhrases = [
		'如您操作退票，款项会先退回购票平台，再由购票平台退回支付宝账户',
		'已阅读并同意《淘宝平台服务协议》《淘宝平台隐私政策》《支付宝注册相关协议》，未注册的手机号将自动完成账号注册',
		'请先阅读并同意协议',
		'已阅读并同意《淘宝平台服务协议》',
		'《淘宝平台隐私政策》《支付宝注册相关协议》，未注册的手机号将自动完成账号注册',
		'同意并登录',
		'抱歉，我们暂不开放该地区的服务',
		'行程管家私信',
		'新行程+1, 上海站到苏州站的火车票订单已加入行程安排, 请关注订单状态，规划出行路线。点击查看全部行程',
		'夜间出票较慢，请您耐心等待~',
		'网络不太好',
		'检测有帮助你疏通网络',
		'检测到网络代理',
		'请尝试去掉代理后重试',
		'您的网络代理服务可能影响网络请求，请尝试去掉代理后重试。',
		'调整好了，重新检测'
	];

	let activePhrases = $state<
		Array<{
			id: number;
			text: string;
			top: number;
			left: number;
			delay: number;
		}>
	>([]);

	const refreshPhrases = () => {
		const shuffled = [...allPhrases].sort(() => 0.5 - Math.random()).slice(0, 6);
		activePhrases = shuffled.map((text) => ({
			id: Math.random(),
			text,
			top: Math.random() * 60,
			left: Math.random() * 80,
			delay: Math.random() * 2
		}));
	};

	$effect(() => {
		refreshPhrases();
		const interval = setInterval(() => {
			refreshPhrases();
		}, 5000);
		return () => clearInterval(interval);
	});

	function glitchPhrase(node: HTMLElement) {
		const { startGlitch, stopGlitch } = PowerGlitch.glitch(node, {
			playMode: 'manual',
			createContainers: true,
			hideOverflow: false,
			timing: { duration: 400 },
			shake: { velocity: 15, amplitudeX: 0.04, amplitudeY: 0.04 },
			slice: { count: 4, velocity: 15, minHeight: 0.02, maxHeight: 0.15, hueRotate: true }
		});

		const delayToGlitch = Math.random() * 3500 + 500;
		let timeoutId: ReturnType<typeof setTimeout>;

		const startTimer = setTimeout(() => {
			startGlitch();
			timeoutId = setTimeout(() => {
				stopGlitch();
			}, 400);
		}, delayToGlitch);

		return {
			destroy() {
				clearTimeout(startTimer);
				clearTimeout(timeoutId);
			}
		};
	}

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

<div class="intro-container">
	<div class="left-panel">
		<div class="content">
			<h1 use:glitchHover>{title}</h1>
			{@render content()}
		</div>
		<div class="actions">
			<button class="start-btn" onclick={onAction} use:glitchHover>
				{buttonText}
			</button>
		</div>
	</div>

	<div class="right-panel">
		{#if rightExtra}
			{@render rightExtra()}
		{/if}
		{#each activePhrases as phrase (phrase.id)}
			<div
				class="floating-phrase"
				style="top: {phrase.top}%; left: {phrase.left}%; animation-delay: {phrase.delay}s;"
			>
				<div use:glitchPhrase>
					{phrase.text}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.intro-container {
		min-height: 100vh;
		width: 100vw;
		background-color: #ede5d8;
		color: #4c8c35;
		display: grid;
		grid-template-columns: 1fr 1fr;
		padding: 60px;
		box-sizing: border-box;
		position: absolute;
		top: 0;
		left: 0;
		z-index: 100;
	}

	.left-panel {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		max-width: 600px;
		position: relative;
		z-index: 20;
	}

	.content h1 {
		font-size: 48px;
		line-height: 1.2;
		margin: 0 0 24px 0;
		font-weight: 700;
		color: #4c8c35;
	}

	.content :global(p) {
		font-size: 18px;
		line-height: 1.6;
		margin: 0;
		color: #4c8c35;
		opacity: 0.9;
	}
	
	.content :global(br) {
		display: block;
		margin: 10px 0;
	}

	.actions {
		margin-top: 40px;
	}

	.start-btn {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font-size: 28px;
		font-weight: 700;
		color: #4c8c35;
		cursor: pointer;
		position: relative;
		font-family: inherit;
		z-index: 1;
		text-transform: uppercase;
		letter-spacing: 2px;
		outline: none;
	}

	.start-btn::after {
		content: '';
		position: absolute;
		bottom: 4px;
		left: -4px;
		right: -4px;
		height: 8px;
		background-color: #4c8c35;
		opacity: 0.3;
		z-index: -1;
		transition: height 0.2s ease, opacity 0.2s ease;
	}

	.start-btn:hover::after {
		height: 20px;
		opacity: 0.5;
	}

	.right-panel {
		position: relative;
		height: 100%;
		width: 100%;
		overflow: visible;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.floating-phrase {
		position: absolute;
		writing-mode: vertical-rl;
		font-size: 18px;
		font-weight: 400;
		opacity: 0;
		animation: floatAndFade 5s ease-in-out forwards;
		max-height: 100%;
		color: #4c8c35;
		letter-spacing: 4px;
		line-height: 1.5;
		z-index: 1;
	}

	@keyframes floatAndFade {
		0% {
			opacity: 0;
			transform: translateY(20px);
		}
		20% {
			opacity: 0.6;
			transform: translateY(0);
		}
		80% {
			opacity: 0.6;
			transform: translateY(-10px);
		}
		100% {
			opacity: 0;
			transform: translateY(-30px);
		}
	}

	@media (max-width: 900px) {
		.intro-container {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
			gap: 40px;
			padding: 40px 20px;
			position: relative;
			min-height: 100vh;
		}

		.left-panel {
			height: auto;
		}

		.right-panel {
			min-height: 400px;
		}

		.content h1 {
			font-size: 36px;
		}
	}
</style>
