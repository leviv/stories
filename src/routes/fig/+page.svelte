<script lang="ts">
	import FigStockChart from '$lib/fig/FigStockChart.svelte';
	import figData from '$lib/fig/fig-stock.json';
	import figCsv from '$lib/fig/fig_data.csv?raw';

	type FigEvent = {
		date: string;
		title: string;
		description: string;
	};

	type FigEventWithTs = FigEvent & { id: string; ts: number; price: number };
	type ChartPoint = { ts: number; price: number };

	const rangeStart = Math.floor(Date.UTC(2025, 6, 27) / 1000);
	const rangeEnd = Math.floor(Date.UTC(2026, 4, 22) / 1000);

	const parseIsoToTs = (date: string) => {
		const [year, month, day] = date.split('-').map((part) => Number(part));
		if (!year || !month || !day) {
			return null;
		}
		return Math.floor(Date.UTC(year, month - 1, day) / 1000);
	};

	const parseNasdaqToTs = (date: string) => {
		const [month, day, year] = date.split('/').map((part) => Number(part));
		if (!month || !day || !year) {
			return null;
		}
		return Math.floor(Date.UTC(year, month - 1, day) / 1000);
	};

	const findNearestDataPoint = (ts: number, series: ChartPoint[]) => {
		if (!series.length) {
			return null;
		}

		let low = 0;
		let high = series.length - 1;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			const current = series[mid];

			if (current.ts === ts) {
				return current;
			}

			if (current.ts < ts) {
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}

		const leftPoint = series[Math.max(0, Math.min(series.length - 1, high))];
		const rightPoint = series[Math.max(0, Math.min(series.length - 1, low))];

		if (!rightPoint) {
			return leftPoint;
		}

		if (!leftPoint) {
			return rightPoint;
		}

		return Math.abs(leftPoint.ts - ts) <= Math.abs(rightPoint.ts - ts) ? leftPoint : rightPoint;
	};

	const parseNasdaqCsv = (csv: string) => {
		const lines = csv.trim().split('\n');
		if (lines.length < 2) {
			return [];
		}

		return lines
			.slice(1)
			.map((line) => line.split(','))
			.map((cols) => {
				const date = cols[0]?.trim();
				const closeRaw = cols[1]?.trim();
				const close = Number(closeRaw?.replace('$', ''));
				const ts = date ? parseNasdaqToTs(date) : null;

				if (!ts || !Number.isFinite(close)) {
					return null;
				}

				if (ts < rangeStart || ts > rangeEnd) {
					return null;
				}

				return { ts, price: close };
			})
			.filter((item): item is ChartPoint => item !== null)
			.reverse();
	};

	const series = parseNasdaqCsv(figCsv);

	const figEvents = figData.events
		.map((event) => {
			const ts = parseIsoToTs(event.date);
			if (!ts) {
				return null;
			}

			const point = findNearestDataPoint(ts, series);
			if (!point) {
				return null;
			}

			return {
				...event,
				id: event.date,
				ts: point.ts,
				price: point.price
			};
		})
		.filter((item): item is FigEventWithTs => item !== null);

	let activeFigEvent = figEvents[figEvents.length - 1] ?? null;
</script>

<section class="fig-page">
	<header class="page-header">
		<p class="price">{activeFigEvent ? '$' + activeFigEvent.price.toFixed(2) : '--'}</p>
		<p class="active-date">{activeFigEvent?.date ?? ''}</p>
		<p class="active-title">{activeFigEvent?.title ?? ''}</p>
		<p class="active-body">{activeFigEvent?.description ?? ''}</p>
	</header>

	<FigStockChart
		{series}
		events={figEvents}
		selectedEventId={activeFigEvent?.id ?? null}
		onselect={(event) => {
			activeFigEvent = event;
		}}
	/>
</section>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Space+Grotesk:wght@400;500&display=swap');
	.fig-page {
		--fig-bg: #f8f5f0;
		--fig-text: #1e293b;
		--fig-muted: #64748b;
		--fig-line: #1d4ed8;
		--fig-fill: rgba(29, 78, 216, 0.18);
		--fig-grid: rgba(29, 78, 216, 0.08);
		--fig-axis: #1e293b;
		--fig-tick: #1e293b;
		--fig-dot: #1d4ed8;
		--fig-dot-ring: rgba(29, 78, 216, 0.18);

		min-height: 100vh;
		padding: 48px clamp(20px, 6vw, 96px) 64px;
		background: var(--fig-bg);
		color: var(--fig-text);
		font-family: 'Space Grotesk', 'Helvetica Neue', sans-serif;
	}

	.page-header {
		display: grid;
		gap: 8px;
		margin-bottom: 28px;
	}

	.price {
		font-family: 'Playfair Display', 'Times New Roman', serif;
		font-size: clamp(2.6rem, 6vw, 4.4rem);
		letter-spacing: 0.02em;
		margin: 0;
		color: var(--fig-line);
	}

	.active-date {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		font-size: 0.75rem;
		color: var(--fig-muted);
	}

	.active-title {
		margin: 8px 0 0;
		font-weight: 500;
		font-size: 1rem;
		color: var(--fig-text);
	}

	.active-body {
		margin: 0;
		max-width: 54ch;
		line-height: 1.6;
		color: var(--fig-muted);
	}

	@media (max-width: 640px) {
		.fig-page {
			padding: 32px 18px 48px;
		}
	}
</style>
