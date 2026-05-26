<script lang="ts">
	import { onMount } from 'svelte';
	import tiles from '$lib/information';
	import { createPlayground, type PlaygroundController } from '$lib/playgroundPhysics';

	let hoveredImage: string | null = $state(null);
	let cursorEl: HTMLDivElement;
	let cursorInverted = $state(false);
	let cursorExpanded = $state(false);
	let playgroundEl: HTMLDivElement;
	let contentEl: HTMLDivElement;
	let titleEls: HTMLButtonElement[] = [];
	let playgroundController: PlaygroundController | null = null;
	const playgroundTitles = ['10 digital storytelling devices', ...tiles.map((tile) => tile.title)];

	function getTitleParts(title: string) {
		const parts = title.trim().split(/\s+/);
		if (parts.length <= 1) {
			return { before: title, after: '' };
		}
		const mid = Math.ceil(parts.length / 2);
		return {
			before: parts.slice(0, mid).join(' '),
			after: parts.slice(mid).join(' ') + "."
		};
	}

	function setCursorInvert(next: boolean) {
		cursorInverted = next;
	}

	function resetPlayground() {
		playgroundController?.refresh();
	}

	onMount(() => {
		const handleMove = (event: MouseEvent) => {
			if (!cursorEl) return;
			const offset = 6;
			cursorEl.style.transform = `translate(${event.clientX - offset}px, ${event.clientY - offset}px)`;
		};

		const handleActivate = () => {
			playgroundController?.activate();
		};

		const handleResize = () => {
			playgroundController?.refresh();
		};

		const handleScroll = () => {
			playgroundController?.updatePointer();
			playgroundController?.activate();
		};

		handleResize();
		playgroundController = createPlayground({
			container: playgroundEl,
			items: titleEls,
			boundary: contentEl,
			boundaryOffset: 40
		});

		const resizeObserver = new ResizeObserver(() => {
			playgroundController?.refresh();
		});
		if (playgroundEl) resizeObserver.observe(playgroundEl);

		window.addEventListener('mousemove', handleMove);
		window.addEventListener('resize', handleResize);
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('pointerdown', handleActivate, { once: true });
		window.addEventListener('wheel', handleActivate, { passive: true, once: true });
		return () => {
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('pointerdown', handleActivate);
			window.removeEventListener('wheel', handleActivate);
			resizeObserver.disconnect();
			playgroundController?.destroy();
		};
	});
</script>

<div class="page">
	<div
		class="background-media"
		class:visible={!!hoveredImage}
		style="background-image: url({hoveredImage ?? ''});"
	></div>
	<div
		class="cursor"
		class:invert={cursorInverted}
		class:expanded={cursorExpanded}
		bind:this={cursorEl}
	></div>

	<div class="header-row">
		<header class="site-header">
			<p class="site-kicker">Web-based digital storytelling</p>
		</header>
		<p class="playground-intro">
			The web is a unique and dynamic platform for storyelling. Here are 10 of the most common devices across the medium.
		</p>
	</div>

	<section class="playground" aria-label="Gravity playground">
		<div class="playground-stage" bind:this={playgroundEl}>
			<button type="button" class="playground-reset" onclick={resetPlayground}>
				Reset
			</button>
			{#each playgroundTitles as title, index (title)}
				<button
					type="button"
					class="playground-title"
					class:featured={index === 0}
					bind:this={titleEls[index]}
				>
					{title}
				</button>
			{/each}
		</div>
	</section>

	<div class="content-container" bind:this={contentEl}>
		<main class="types" aria-label="Storytelling types">
			{#each tiles as tile (tile.title)}
				{@const titleParts = getTitleParts(tile.title)}
				<section class="type">
					<div
						class="type-toggle"
						role="button"
						tabindex="0"
						onmouseenter={() => setCursorInvert(true)}
						onmouseleave={() => setCursorInvert(false)}
						onfocus={() => setCursorInvert(true)}
						onblur={() => setCursorInvert(false)}
					>
						<span class="type-line">
							<span class="type-title">{titleParts.before}</span>
							<span class="type-gif">
								(<img src={tile.gif} alt="" loading="lazy" decoding="async" />)
							</span>
							{#if titleParts.after}
								<span class="type-title">{titleParts.after}</span>
							{/if}
						</span>
					</div>

					<div class="type-details">
						<button
							type="button"
							class="type-body"
							onmouseenter={() => setCursorInvert(true)}
							onmouseleave={() => setCursorInvert(false)}
							onfocus={() => setCursorInvert(true)}
							onblur={() => setCursorInvert(false)}
						>
							{tile.body}
						</button>
						<div class="type-links">
							<p>Curated examples</p>

							{#each tile.links as link (link.url)}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a href={link.url} target="_blank" rel="noopener noreferrer"
									onmouseenter={() => {
										hoveredImage = link.image ?? null;
										setCursorInvert(true);
										cursorExpanded = true;
									}}
									onmouseleave={() => {
										hoveredImage = null;
										setCursorInvert(false);
										cursorExpanded = false;
									}}
								>
									&rarr; {link.label}
								</a>
							{/each}
						</div>
					</div>
				</section>
			{/each}
		</main>
	</div>

	<footer class="site-footer">
		<p class="site-kicker">
			designed with &lt;3 by
			<a
				href="https://leviv.cool"
				target="_blank"
				rel="noopener noreferrer"
				onmouseenter={() => setCursorInvert(true)}
				onmouseleave={() => setCursorInvert(false)}
				onpointerenter={() => (cursorExpanded = true)}
				onpointerleave={() => (cursorExpanded = false)}
			>
				Levi
			</a>
			for
			<a
				href="https://itp.nyu.edu/lowres/"
				target="_blank"
				rel="noopener noreferrer"
				onmouseenter={() => setCursorInvert(true)}
				onmouseleave={() => setCursorInvert(false)}
				onpointerenter={() => (cursorExpanded = true)}
				onpointerleave={() => (cursorExpanded = false)}
			>
				IMALR
			</a>
		</p>
	</footer>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Junicode:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap');

	:global(body) {
		margin: 0;
		font-family: 'Open Sans', sans-serif;
		background: #eae3dd;
		color: #494441;
		cursor: none;
	}

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	.page {
		overflow: hidden;
		text-align: center;
	}

	.playground {
		position: relative;
		bottom: -22px;
		z-index: 2;
		padding: 0;
	}

	.playground-reset {
		position: absolute;
		top: 10px;
		left: 10px;
		border: 1px solid #494441;
		background: #eae3dd;
		color: inherit;
		font-family: 'Open Sans', sans-serif;
		font-size: 12px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		padding: 8px 12px;
		cursor: pointer;
		z-index: 3;
	}

	.playground-reset:hover {
		background: #f3ede6;
	}

	.playground-reset:focus-visible {
		outline: 2px solid #494441;
		outline-offset: 2px;
	}

	.playground-stage {
		position: relative;
		width: min(1200px, 96vw);
		height: clamp(260px, 38vh, 420px);
		margin: 0 auto 16px;
		border: none;
		background: transparent;
		overflow: visible;
		touch-action: pan-y;
	}

	.playground-intro {
		max-width: 320px;
		margin: 20px 0 0;
		font-size: 15.2px;
		line-height: 1.5;
		text-align: right;
	}

	.playground-title {
		position: absolute;
		left: 0;
		top: 0;
		border: 1px solid #494441;
		background: #eae3dd;
		padding: 10px 16px;
		font-family: 'Junicode', serif;
		font-size: 17.6px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: inherit;
		cursor: grab;
		user-select: none;
		touch-action: pan-y;
		transform-origin: center;
		will-change: transform;
	}

	.playground-title.featured {
		font-weight: 700;
	}

	.playground-title:active {
		cursor: grabbing;
	}


	.content-container {
		padding: 0px 96px;
	}

	.background-media {
		position: fixed;
		inset: 0;
		background-size: cover;
		background-position: center;
		opacity: 0;
		transition: opacity 0.35s ease;
		pointer-events: none;
		filter: saturate(0.8) contrast(1.05);
		z-index: 0;
	}

	.background-media.visible {
		opacity: 0.15;
	}

	.cursor {
		position: fixed;
		top: 0;
		left: 0;
		width: 12px;
		height: 12px;
		border-radius: 999px;
		background: #494441;
		transform: translate(-999px, -999px);
		pointer-events: none;
		z-index: 10;
		transition: transform 0.02s linear, background 0.2s ease, width 0.18s ease, height 0.18s ease;
	}

	.cursor.expanded {
		width: 18px;
		height: 18px;
		background: #ea92aa89;
	}

	.site-header {
		position: relative;
		z-index: 2;
		text-align: left;
		padding: 20px 0;
	}


	.header-row {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 24px;
		width: min(1200px, 96vw);
		margin: 0 auto;
	}

	.site-kicker {
		margin: 0 0 6px;
		font-size: 12.8px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	.types {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 44px;
		align-items: center;
	}

	.type {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
	}

	.type-toggle {
		border: none;
		background: transparent;
		padding: 0;
		text-align: center;
		font-family: 'Junicode', serif;
		color: inherit;
		cursor: default;
		font-size: clamp(44.8px, 9vw, 99.2px);
		font-weight: 600;
		line-height: 0.9;
		letter-spacing: -0.015em;
		display: inline-flex;
		align-items: baseline;
		gap: 12px;
		justify-content: center;
		position: relative;
	}

	.type-line {
		display: inline;
		gap: 12px;
	}


	.type-title {
		text-transform: uppercase;
	}

	.type-gif {
		font-size: inherit;
		letter-spacing: 0.02em;
		display: inline-flex;
		align-items: center;
		line-height: inherit;
	}

	.type-gif img {
		width: clamp(48px, 10vw, 120px);
		height: clamp(32px, 7vw, 80px);
		object-fit: cover;
		background: rgba(234, 227, 221, 0.6);
		vertical-align: middle;
		overflow: visible;
	}


	.type-details {
		max-width: 720px;
		font-size: 16px;
		line-height: 1.6;
		text-align: left;
	}

	.type-body {
		border: none;
		background: transparent;
		padding: 0;
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: none;
		margin: 0 0 16px;
	}

	.type-body:focus-visible {
		outline: 2px solid #494441;
		outline-offset: 2px;
	}

	.type-links {
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: flex-start;
	}

	.type-links p {
		margin: 0 0 6px;
		font-size: 12.8px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	.type-links a {
		color: inherit;
		text-decoration: none;
		font-weight: 600;
		border-bottom: 1px solid rgba(73, 68, 65, 0.35);
		padding-bottom: 3px;
		width: fit-content;
		cursor: none;
	}

	.type-links a:hover {
		border-bottom-color: #494441;
	}

	.site-footer {
		position: relative;
		z-index: 2;
		width: min(1200px, 96vw);
		margin: 64px auto 0;
		text-align: left;
		padding: 20px 0;
	}

	.site-footer a {
		color: inherit;
		text-decoration: none;
		border-bottom: 1px solid rgba(73, 68, 65, 0.35);
		padding-bottom: 2px;
		cursor: none;
	}

	.site-footer a:hover {
		border-bottom-color: #494441;
	}

	@media (max-width: 900px) {
		.header-row {
			flex-direction: column;
			align-items: flex-start;
		}


		.playground-stage {
			height: clamp(230px, 36vh, 360px);
		}

		.playground-intro {
			margin: 0 0 16px;
			max-width: 520px;
			text-align: left;
		}

		.content-container {
			padding: 0px 32px;
		}


		.types {
			gap: 28px;
		}

		.type-toggle {
			line-height: 1;
		}
	}

	@media (max-width: 600px) {
		.playground-title {
			padding: 6px 10px;
			font-size: 12.8px;
			letter-spacing: 0.05em;
		}

		.types {
			align-items: flex-start;
		}

		.type {
			align-items: flex-start;
		}

		.type-toggle {
			font-size: clamp(35.2px, 11vw, 64px);
			text-align: left;
			justify-content: flex-start;
		}

		.type-details {
			font-size: 15.2px;
		}
	}
</style>
