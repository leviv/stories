<script lang="ts">
	import { onMount } from 'svelte';
	import rough from 'roughjs';
	import { createDebugGui } from '$lib/debugGui';
	import InfoTile from '$lib/components/InfoTile.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageFooter from '$lib/components/PageFooter.svelte';
	import tiles from '$lib/tiles.json';

	let canvasEl: HTMLCanvasElement;
	let headerComponent: ReturnType<typeof PageHeader>;
	let footerComponent: ReturnType<typeof PageFooter>;
	let gridContainer: HTMLDivElement;
	let currentSubCell: string | null = null;
	let nextHighlightId = 0;

	interface GridHighlight {
		id: number;
		left: number;
		top: number;
		width: number;
		height: number;
		color: string;
		visible: boolean;
	}

	let highlights: GridHighlight[] = $state([]);
	let hoveredImage: string | null = $state(null);

	const lines = [
		{ color: '#60D4C6', heightPct: 1.0 },
		{ color: '#CCB4EC', heightPct: 0.75 },
		{ color: '#F49EB6', heightPct: 0.5 },
		{ color: '#FCC5A2', heightPct: 0.25 }
	];

	const GRID_COLUMNS = 5;
	const GRID_ROW_HEIGHT = '200px';

	const LINE_WIDTH = 40;
	const OVERLAP = 20;

	const params = {
		roughness: 2.1,
		fillStyle: 'zigzag-line' as string,
		bowing: 0,
		fillWeight: 4.5,
		hachureGap: 1
	};

	function drawLines() {
		const pageHeight = document.body.scrollHeight;
		const totalWidth = lines.length * LINE_WIDTH - (lines.length - 1) * OVERLAP;

		canvasEl.width = totalWidth + 10;
		canvasEl.height = pageHeight + 10;

		const ctx = canvasEl.getContext('2d')!;
		ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

		const rc = rough.canvas(canvasEl);

		for (let i = lines.length - 1; i >= 0; i--) {
			const x = i * (LINE_WIDTH - OVERLAP);
			const h = pageHeight * lines[i].heightPct;

			rc.rectangle(x, -10, LINE_WIDTH, h + 10, {
				fill: lines[i].color,
				stroke: lines[i].color,
				strokeWidth: 1,
				roughness: params.roughness,
				fillStyle: params.fillStyle,
				bowing: params.bowing,
				fillWeight: params.fillWeight,
				hachureGap: params.hachureGap,
				seed: i + 1
			});
		}
	}

	function drawAll() {
		drawLines();
		headerComponent?.redraw();
		footerComponent?.redraw();
	}

	const hoverColors = ['#60D4C6', '#CCB4EC', '#F49EB6', '#FCC5A2'];

	function getRandomColor() {
		return hoverColors[Math.floor(Math.random() * hoverColors.length)];
	}

	function handleGridMouseMove(e: MouseEvent) {
		if (!gridContainer) return;
		const rect = gridContainer.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const colWidth = rect.width / GRID_COLUMNS;
		const subColWidth = colWidth / 3;
		const rowHeight = parseInt(GRID_ROW_HEIGHT);
		const subRowHeight = rowHeight / 3;

		const subCol = Math.floor(x / subColWidth);
		const subRow = Math.floor(y / subRowHeight);
		const cellKey = `${subCol},${subRow}`;

		if (cellKey === currentSubCell) return;

		// Fade out all current highlights
		highlights.forEach((h) => (h.visible = false));
		setTimeout(() => {
			highlights = highlights.filter((h) => h.visible);
		}, 300);

		currentSubCell = cellKey;

		const idx =
			highlights.push({
				id: nextHighlightId++,
				left: subCol * subColWidth,
				top: subRow * subRowHeight,
				width: subColWidth,
				height: subRowHeight,
				color: getRandomColor(),
				visible: false
			}) - 1;

		requestAnimationFrame(() => {
			if (highlights[idx]) {
				highlights[idx].visible = true;
			}
		});
	}

	function handleGridMouseLeave() {
		highlights.forEach((h) => (h.visible = false));
		setTimeout(() => {
			highlights = highlights.filter((h) => h.visible);
		}, 300);
		currentSubCell = null;
	}

	onMount(() => {
		drawAll();

		const destroyGui = createDebugGui(params, drawAll);

		const observer = new ResizeObserver(() => drawAll());
		observer.observe(document.body);

		window.addEventListener('resize', drawAll);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', drawAll);
			destroyGui();
		};
	});
</script>

<div class="page-layout">
	<div class="lines-column">
		<canvas bind:this={canvasEl} class="border-lines"></canvas>
	</div>

	<div class="content">
		<PageHeader bind:this={headerComponent} text="web-based digital storytelling" {params} />

		<div
			bind:this={gridContainer}
			class="grid-container"
			style="--grid-columns: {GRID_COLUMNS}; --grid-row-height: {GRID_ROW_HEIGHT};"
			onmousemove={handleGridMouseMove}
			onmouseleave={handleGridMouseLeave}
			role="presentation"
		>
			<div
				class="grid-bg-image"
				class:visible={!!hoveredImage}
				style="background-image: url({hoveredImage ?? ''});"
			></div>
			<div class="intro-tile" style:grid-column="2 / span 2" style:grid-row="1">
				<p>
					A non-exhaustive list of my favorite techniques and examples for web-based interactive
					digital storytelling.
				</p>
			</div>

			{#each tiles as tile, i (tile.title)}
				<InfoTile
					gif={tile.gif}
					title={tile.title}
					body={tile.body}
					links={tile.links}
					column={tile.col}
					row={tile.row}
					onlinkhover={(img) => (hoveredImage = img)}
				/>
			{/each}

			{#each highlights as h (h.id)}
				<div
					class="grid-highlight"
					class:visible={h.visible}
					style="left: {h.left}px; top: {h.top}px; width: {h.width}px; height: {h.height}px; background-color: {h.color};"
				></div>
			{/each}
		</div>

		<PageFooter bind:this={footerComponent} {params} />
	</div>
</div>

<style>
	.page-layout {
		display: flex;
		min-height: 100vh;
	}

	.lines-column {
		flex-shrink: 0;
		position: relative;
		width: 90px; /* 4 * 40 - 3 * 20 + some padding */
	}

	.border-lines {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
	}

	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.grid-container {
		position: relative;
		display: grid;
		grid-template-columns: repeat(var(--grid-columns), 1fr);
		grid-auto-rows: var(--grid-row-height);
		border: 1px solid black;
		min-height: 100vh;
		margin-top: 15px;
		margin-left: 25px;
		margin-right: 15px;
		margin-bottom: 15px;
		background-image:
			linear-gradient(to right, black 1px, transparent 1px),
			linear-gradient(to bottom, black 1px, transparent 1px),
			linear-gradient(to right, rgba(14, 51, 74, 0.15) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(14, 51, 74, 0.15) 1px, transparent 1px);
		background-size:
			calc(100% / var(--grid-columns)) var(--grid-row-height),
			calc(100% / var(--grid-columns)) var(--grid-row-height),
			calc(100% / var(--grid-columns) / 3) calc(var(--grid-row-height) / 3),
			calc(100% / var(--grid-columns) / 3) calc(var(--grid-row-height) / 3);
		background-position: -1px -1px;
	}

	.intro-tile {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px 18px;
		background: #fff;
		border: 1px solid #0e334a;
		margin: -1px;
		font-family: 'Inter', sans-serif;
		font-size: 0.88rem;
		line-height: 1.45;
		color: #333;
		text-align: center;
	}

	.intro-tile p {
		margin: 0;
	}

	.grid-highlight {
		position: absolute;
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.grid-highlight.visible {
		opacity: 0.45;
	}

	.grid-bg-image {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		opacity: 0;
		transition: opacity 0.4s ease;
		pointer-events: none;
		z-index: 0;
	}

	.grid-bg-image.visible {
		opacity: 0.35;
	}

	@media (max-width: 1024px) {
		.grid-container {
			grid-template-columns: repeat(3, 1fr);
			background-size:
				calc(100% / 3) var(--grid-row-height),
				calc(100% / 3) var(--grid-row-height),
				calc(100% / 3 / 3) calc(var(--grid-row-height) / 3),
				calc(100% / 3 / 3) calc(var(--grid-row-height) / 3);
		}

		/* Let tiles auto-flow instead of using explicit positions */
		.grid-container :global(.info-tile),
		.intro-tile {
			grid-column: span 1 !important;
			grid-row: span 2 !important;
		}
	}

	@media (max-width: 640px) {
		.grid-container {
			grid-template-columns: 1fr;
			background-size:
				100% var(--grid-row-height),
				100% var(--grid-row-height),
				calc(100% / 3) calc(var(--grid-row-height) / 3),
				calc(100% / 3) calc(var(--grid-row-height) / 3);
		}

		.grid-container :global(.info-tile),
		.intro-tile {
			grid-column: span 1 !important;
			grid-row: span 2 !important;
		}
	}
</style>
