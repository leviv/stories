<script lang="ts">
	interface Link {
		url: string;
		label: string;
		image?: string;
	}

	interface Props {
		gif: string;
		title: string;
		body: string;
		links: Link[];
		column?: number;
		row?: number;
		onlinkhover?: (image: string | null) => void;
	}

	let { gif, title, body, links, column, row, onlinkhover }: Props = $props();

	let flipped = $state(false);

	const bgColors = ['#60D4C6', '#CCB4EC', '#F49EB6', '#FCC5A2'];
	const directions = ['top', 'right', 'bottom', 'left'] as const;

	let backColor = $state(bgColors[Math.floor(Math.random() * bgColors.length)]);
	let slideDir = $state(directions[Math.floor(Math.random() * directions.length)]);

	function toggle() {
		if (!flipped) {
			backColor = bgColors[Math.floor(Math.random() * bgColors.length)];
			slideDir = directions[Math.floor(Math.random() * directions.length)];
		}
		flipped = !flipped;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggle();
		}
	}
</script>

<div
	class="info-tile"
	class:flipped
	style:grid-column={column ? `${column} / span 2` : undefined}
	style:grid-row={row ? `${row} / span 2` : undefined}
	onclick={toggle}
	onkeydown={handleKeydown}
	tabindex="0"
	role="button"
	aria-label="Click to see links"
>
	<div class="card-inner">
		<!-- FRONT FACE -->
		<div class="card-face card-front">
			<img src={gif} alt="" class="tile-bg" />
			<div class="front-overlay">
				<div class="tile-top-bar">
					<h3 class="tile-title">{title}</h3>
				</div>
				<div class="front-body">
					<p class="tile-body">{body}</p>
					<span class="flip-hint">Click to see links &rarr;</span>
				</div>
			</div>
		</div>

		<!-- BACK FACE -->
		<div class="card-face card-back slide-{slideDir}" style:background-color={backColor}>
			<div class="back-top">
				<h3 class="tile-title back-title">{title}</h3>
			</div>
			<div class="back-content">
				<ul class="link-list">
					{#each links as link (link.url)}
						<li>
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								onclick={(e) => e.stopPropagation()}
								onmouseenter={() => onlinkhover?.(link.image ?? null)}
								onmouseleave={() => onlinkhover?.(null)}
							>
								{link.label} &rarr;
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.info-tile {
		position: relative;
		z-index: 1;
		overflow: hidden;
		border: 1px solid #0e334a;
		margin: -1px;
		font-family: 'Inter', sans-serif;
		cursor: pointer;
	}

	.info-tile:focus-visible {
		outline: 2px solid #1a73e8;
		outline-offset: -2px;
	}

	/* ═══════════════════════════════════════
	   CARD LAYOUT
	   ═══════════════════════════════════════ */
	.card-inner {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.card-face {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	/* ═══════════════════════════════════════
	   FRONT FACE
	   ═══════════════════════════════════════ */
	.card-front {
		z-index: 2;
	}

	.tile-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}

	.front-overlay {
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: linear-gradient(
			to top,
			rgba(255, 255, 255, 0.95) 40%,
			rgba(255, 255, 255, 0.75) 70%,
			rgba(255, 255, 255, 0.15) 100%
		);
	}

	.tile-top-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px 14px;
		border-bottom: 1px solid #0e334a;
		background: rgba(255, 255, 255, 0.95);
	}

	.tile-title {
		font-weight: 700;
		font-size: 0.85rem;
		text-transform: uppercase;
		text-align: center;
		letter-spacing: 0.06em;
		color: #0e334a;
		margin: 0;
	}

	.front-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 6px;
		padding: 12px 14px;
	}

	.tile-body {
		font-size: 0.88rem;
		line-height: 1.45;
		margin: 0;
		color: #333;
	}

	.flip-hint {
		font-weight: 600;
		font-size: 0.82rem;
		color: #1a73e8;
		text-transform: uppercase;
		padding-top: 6px;
		border-top: 1px solid #0e334a;
	}

	/* ═══════════════════════════════════════
	   BACK FACE — SLIDE IN
	   ═══════════════════════════════════════ */
	.card-back {
		z-index: 3;
		display: flex;
		flex-direction: column;
		transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Starting positions (off-screen) */
	.card-back.slide-top {
		transform: translateY(-100%);
	}
	.card-back.slide-bottom {
		transform: translateY(100%);
	}
	.card-back.slide-left {
		transform: translateX(-100%);
	}
	.card-back.slide-right {
		transform: translateX(100%);
	}

	/* When flipped, slide into view */
	.flipped .card-back {
		transform: translate(0, 0);
	}

	.back-top {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px 14px;
		border-bottom: 1px solid rgba(14, 51, 74, 0.25);
		flex-shrink: 0;
	}

	.back-title {
		color: #0e334a !important;
	}

	.back-content {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		flex: 1;
		padding: 16px;
	}

	/* ═══════════════════════════════════════
	   LINK LIST
	   ═══════════════════════════════════════ */
	.link-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.link-list li {
		border-bottom: 1px solid rgba(14, 51, 74, 0.15);
		padding-bottom: 10px;
	}

	.link-list li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.link-list a {
		font-weight: 600;
		font-size: 0.9rem;
		color: #0e334a;
		text-decoration: none;
		display: block;
		transition: color 0.15s;
	}

	.link-list a:hover {
		color: #333;
		text-decoration: underline;
	}
</style>
