<script lang="ts">
	import { onMount } from 'svelte';
	import { sections, type Section } from './script';

	let currentIndex = $state(0);
	const sectionEls: HTMLElement[] = [];
	let muted = $state(false);

	function langCode(lang: string): string {
		if (lang === 'Spanish') {
			return 'es';
		}

		if (lang === 'German') {
			return 'de';
		}
		return 'en';
	}

	function speak(text: string, lang: string) {
		window.speechSynthesis.cancel();
		if (!text || muted) {
			return;
		}
		const utter = new SpeechSynthesisUtterance(text);
		utter.lang = langCode(lang);
		utter.rate = 0.95;
		window.speechSynthesis.speak(utter);
	}

	function getAltSourceLang(lang: string) {
		if (lang === 'German') {
			return 'Spanish';
		}
		if (lang === 'Spanish') {
			return 'German';
		}
		return 'Spanish';
	}

	function getAltTargetLang(lang: string) {
		if (lang === 'German') {
			return 'Spanish';
		}
		return 'English';
	}

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const idx = sectionEls.indexOf(entry.target as HTMLElement);
						if (idx !== -1) {
							currentIndex = idx;
							const sec = sections[idx];
							speak(sec.source, sec.sourceLang);
						}
					}
				}
			},
			{ threshold: 0.6 }
		);

		for (const el of sectionEls) {
			if (el) {
				observer.observe(el);
			}
		}

		function handleKeydown(e: KeyboardEvent) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
				e.preventDefault();
				const next = Math.min(currentIndex + 1, sections.length - 1);
				sectionEls[next]?.scrollIntoView({ behavior: 'smooth' });
			} else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
				e.preventDefault();
				const prev = Math.max(currentIndex - 1, 0);
				sectionEls[prev]?.scrollIntoView({ behavior: 'smooth' });
			}
		}
		window.addEventListener('keydown', handleKeydown);

		return () => {
			observer.disconnect();
			window.removeEventListener('keydown', handleKeydown);
			window.speechSynthesis.cancel();
		};
	});

	const section: Section = $derived(sections[currentIndex]);
</script>

<div class="translate-page">
	<!-- Sticky Google Translate UI -->
	<div class="translate-sticky">
		<div class="translate-chrome">
			<!-- Top bar with tabs -->
			<div class="chrome-tabs">
				<button class="tab active">
					<!-- 文A translate icon -->
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
						/>
					</svg>
					Text
				</button>
				<button class="tab">
					<!-- Image icon -->
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
						/>
					</svg>
					Images
				</button>
				<button class="tab">
					<!-- Document icon -->
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"
						/>
					</svg>
					Documents
				</button>
				<button class="tab">
					<!-- Globe/websites icon -->
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"
						/>
					</svg>
					Websites
				</button>
			</div>

			<!-- Language selector row -->
			<div class="lang-row">
				<div class="lang-source">
					<span class="lang-option">Detect language</span>
					<span class="lang-option">{section.sourceLang}</span>
					<span class="lang-option dimmed">{getAltSourceLang(section.sourceLang)}</span>
					<span class="lang-option dimmed">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
							><path d="M7 10l5 5 5-5z" /></svg
						>
					</span>
				</div>
				<div class="lang-swap">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368">
						<path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
					</svg>
				</div>
				<div class="lang-target">
					<span class="lang-option">{section.targetLang}</span>
					<span class="lang-option dimmed">{getAltTargetLang(section.targetLang)}</span>
					<span class="lang-option dimmed">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
							><path d="M7 10l5 5 5-5z" /></svg
						>
					</span>
				</div>
			</div>

			<!-- Translation boxes -->
			<div class="translate-boxes">
				<div class="box source-box">
					<div class="box-text" class:empty={!section.source}>
						{#if section.source}
							{section.source}
						{:else}
							<span class="placeholder-text"></span>
						{/if}
					</div>
					<div class="box-bottom">
						<div class="box-icons">
							<!-- Microphone icon -->
							<svg width="24" height="24" viewBox="0 0 24 24" fill="#70757a">
								<path
									d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"
								/>
								<path
									d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
								/>
							</svg>
							<div class="spacer"></div>
							<!-- Pencil/edit icon -->
							<svg width="20" height="20" viewBox="0 0 24 24" fill="#70757a">
								<path
									d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
								/>
							</svg>
						</div>
					</div>
				</div>
				<div class="box target-box">
					<div class="box-text" class:empty={!section.target}>
						{#if section.target}
							{section.target}
						{:else}
							<span class="placeholder-text">Translation</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="translate-footer">
				<span class="send-feedback">Send feedback</span>
			</div>
		</div>

		<!-- Progress dots -->
		<div class="progress">
			{#each sections as _, i (i)}
				<button
					class="dot"
					class:active={i === currentIndex}
					onclick={() => sectionEls[i]?.scrollIntoView({ behavior: 'instant' })}
					aria-label="Go to section {i + 1}"
				></button>
			{/each}
		</div>
	</div>

	<!-- Mute button -->
	<button
		class="mute-btn"
		onclick={() => {
			muted = !muted;
			if (muted) {
				window.speechSynthesis.cancel();
			}
		}}
		aria-label={muted ? 'Unmute' : 'Mute'}
	>
		{#if muted}
			<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
				><path
					d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
				/></svg
			>
		{:else}
			<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
				><path
					d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-3.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
				/></svg
			>
		{/if}
	</button>

	<!-- Scroll sections -->
	<div class="scroll-container">
		{#each sections as _, i (i)}
			<section class="snap-section" bind:this={sectionEls[i]}>
				<div class="section-hint">
					{#if i === 0}
						<span class="scroll-cue">Scroll to begin ↓</span>
					{:else}
						<span class="section-num">{i}</span>
					{/if}
				</div>
			</section>
		{/each}
	</div>
</div>

<style>
	.translate-page {
		position: relative;
		background: #fff;
		color: #202124;
		font-family: 'Google Sans', 'Segoe UI', Roboto, Arial, sans-serif;
		min-height: 100vh;
	}

	/* ── Sticky translate UI ── */
	.translate-sticky {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(960px, 94vw);
		z-index: 10;
	}

	.translate-chrome {
		background: #fff;
	}

	/* Tabs */
	.chrome-tabs {
		display: flex;
		gap: 8px;
		padding: 0 0 16px;
	}

	.tab {
		padding: 8px 16px;
		border: 1px solid #dadce0;
		border-radius: 999px;
		background: #fff;
		color: #5f6368;
		font-size: 14px;
		cursor: default;
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: inherit;
		line-height: 1;
	}

	.tab.active {
		background: #d3e3fd;
		color: #1a73e8;
		border-color: transparent;
		font-weight: 500;
	}

	.tab:not(.active) svg {
		opacity: 0.7;
	}

	/* Language row */
	.lang-row {
		display: flex;
		align-items: center;
		padding: 0;
		gap: 0;
		border-bottom: 1px solid #dadce0;
	}

	.lang-source,
	.lang-target {
		display: flex;
		gap: 0;
		flex: 1;
		padding: 0;
	}

	.lang-option {
		font-size: 14px;
		color: #1a73e8;
		cursor: default;
		padding: 12px 16px;
		position: relative;
		white-space: nowrap;
	}

	.lang-source .lang-option:nth-child(2),
	.lang-target .lang-option:first-child {
		color: #1a73e8;
	}

	.lang-source .lang-option:nth-child(2)::after,
	.lang-target .lang-option:first-child::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 16px;
		right: 16px;
		height: 3px;
		background: #1a73e8;
		border-radius: 3px 3px 0 0;
	}

	.lang-option.dimmed {
		color: #5f6368;
	}

	.lang-option.dimmed svg {
		vertical-align: middle;
	}

	.lang-swap {
		color: #5f6368;
		display: flex;
		align-items: center;
		padding: 0 12px;
		flex-shrink: 0;
	}

	/* Translation boxes */
	.translate-boxes {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.box {
		padding: 20px 24px;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.source-box {
		background: #fff;
		border: 1px solid #dadce0;
		border-radius: 8px;
		margin-right: 8px;
		min-height: 220px;
	}

	.target-box {
		background: #f5f7fd;
		border-radius: 8px;
		margin-left: 8px;
		min-height: 220px;
	}

	.box-text {
		font-size: 24px;
		line-height: 1.5;
		color: #202124;
		flex: 1;
	}

	.box-text.empty {
		color: #80868b;
	}

	.placeholder-text {
		color: #80868b;
		font-size: 24px;
	}

	.box-bottom {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-top: 16px;
	}

	.box-icons {
		display: flex;
		align-items: center;
		gap: 0;
		margin-left: auto;
		width: 100%;
	}

	.box-icons svg {
		opacity: 0.6;
		cursor: default;
	}

	.box-icons .spacer {
		flex: 1;
	}

	/* Footer */
	.translate-footer {
		display: flex;
		justify-content: flex-end;
		padding: 8px 0;
	}

	.send-feedback {
		font-size: 12px;
		color: #70757a;
		cursor: default;
	}

	/* Progress dots */
	.progress {
		display: flex;
		justify-content: center;
		gap: 6px;
		padding: 1.5rem 0 0;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: 1px solid #dadce0;
		background: #dadce0;
		cursor: pointer;
		transition: all 0.15s ease;
		padding: 0;
	}

	.dot.active {
		background: #1a73e8;
		border-color: #1a73e8;
		transform: scale(1.3);
	}

	/* ── Scroll container ── */
	.scroll-container {
		height: 100vh;
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
	}

	.snap-section {
		height: 100vh;
		scroll-snap-align: start;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 3rem;
	}

	.section-hint {
		text-align: center;
	}

	.scroll-cue {
		color: #80868b;
		font-size: 0.85rem;
		animation: pulse 2s ease-in-out infinite;
	}

	.section-num {
		color: #dadce0;
		font-size: 0.7rem;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}

	/* Mute button */
	.mute-btn {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 100;
		background: rgba(255, 255, 255, 0.95);
		border: 1px solid #dadce0;
		border-radius: 50%;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #5f6368;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
		transition: color 0.15s;
	}
	.mute-btn:hover {
		color: #202124;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.translate-boxes {
			grid-template-columns: 1fr;
		}
		.source-box {
			margin-right: 0;
			margin-bottom: 8px;
		}
		.target-box {
			margin-left: 0;
		}
		.box-text,
		.placeholder-text {
			font-size: 18px;
		}
		.chrome-tabs {
			flex-wrap: wrap;
		}
		.lang-source,
		.lang-target {
			flex-wrap: wrap;
		}
	}
</style>
