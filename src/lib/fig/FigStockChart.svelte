<script lang="ts">
	import { scaleLinear, scaleTime, type ScaleLinear, type ScaleTime } from 'd3-scale';
	import { curveMonotoneX, line } from 'd3-shape';

	type ChartPoint = {
		ts: number;
		price: number;
	};

	type FigEventPoint = {
		id: string;
		date: string;
		title: string;
		description: string;
		ts: number;
		price: number;
	};

	type PlottedEventPoint = { event: FigEventPoint; x: number; y: number };
	type CursorPoint = { x: number; y: number; ts: number; price: number };

	export let series: ChartPoint[] = [];
	export let events: FigEventPoint[] = [];
	export let height = 360;
	export let selectedEventId: string | null = null;
	export let onselect: ((event: FigEventPoint) => void) | undefined = undefined;

	const padding = {
		top: 24,
		right: 28,
		bottom: 30,
		left: 44
	};

	let width = 0;
	let hoverSplitX: number | null = null;
	let cursorPoint: CursorPoint | null = null;
	let plotWidth = 1;
	let hasChartData = false;
	let xDomain: [Date, Date] | null = null;
	let yExtent: [number, number] | null = null;
	let xScale: ScaleTime<number, number> | null = null;
	let yScale: ScaleLinear<number, number> | null = null;
	let chartPath = '';
	let chartPathEl: SVGPathElement | null = null;
	let plottedEvents: PlottedEventPoint[] = [];
	let hoverPercentage = 100;
	let tooltipLeft: number | null = null;
	let tooltipTop: number | null = null;
	let tooltipText = '';

	const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

	const isPlottedEventPoint = (item: PlottedEventPoint | null): item is PlottedEventPoint =>
		item !== null;

	const interpolatePoint = (targetTs: number, points: ChartPoint[]) => {
		if (!points.length) {
			return null;
		}

		if (targetTs <= points[0].ts) {
			return points[0];
		}

		const lastPoint = points[points.length - 1];
		if (targetTs >= lastPoint.ts) {
			return lastPoint;
		}

		for (let index = 0; index < points.length - 1; index += 1) {
			const leftPoint = points[index];
			const rightPoint = points[index + 1];

			if (targetTs < leftPoint.ts || targetTs > rightPoint.ts) {
				continue;
			}

			const ratio = (targetTs - leftPoint.ts) / (rightPoint.ts - leftPoint.ts);
			return {
				ts: targetTs,
				price: leftPoint.price + (rightPoint.price - leftPoint.price) * ratio
			};
		}

		return lastPoint;
	};

	const getPointOnPathAtX = (targetX: number) => {
		if (!chartPathEl) {
			return null;
		}

		const totalLength = chartPathEl.getTotalLength();
		let low = 0;
		let high = totalLength;
		let bestPoint = chartPathEl.getPointAtLength(0);
		let bestDistance = Math.abs(bestPoint.x - targetX);

		for (let iteration = 0; iteration < 18; iteration += 1) {
			const mid = (low + high) / 2;
			const point = chartPathEl.getPointAtLength(mid);
			const distance = Math.abs(point.x - targetX);

			if (distance < bestDistance) {
				bestPoint = point;
				bestDistance = distance;
			}

			if (point.x < targetX) {
				low = mid;
			} else {
				high = mid;
			}
		}

		return bestPoint;
	};

	$: plotWidth = Math.max(width - padding.left - padding.right, 1);
	$: hasChartData = series.length > 1 && width > 0;
	$: xDomain = hasChartData
		? [new Date(series[0].ts * 1000), new Date(series[series.length - 1].ts * 1000)]
		: null;
	$: yExtent = hasChartData
		? [
				Math.min(...series.map((point) => point.price)),
				Math.max(...series.map((point) => point.price))
			]
		: null;
	$: xScale = xDomain
		? scaleTime()
				.domain(xDomain)
				.range([padding.left, padding.left + plotWidth])
		: null;
	$: yScale = yExtent
		? scaleLinear()
				.domain(yExtent)
				.nice()
				.range([height - padding.bottom, padding.top])
		: null;

	$: {
		if (!xScale || !yScale || !series.length) {
			chartPath = '';
		} else {
			const chartLine = line<ChartPoint>()
				.x((point) => xScale(new Date(point.ts * 1000)))
				.y((point) => yScale(point.price))
				.curve(curveMonotoneX);

			chartPath = chartLine(series) ?? '';
		}
	}

	$: plottedEvents =
		xScale && yScale
			? events
					.map((event) => {
						const x = xScale(new Date(event.ts * 1000));
						const y = yScale(event.price);
						if (!Number.isFinite(x) || !Number.isFinite(y)) {
							return null;
						}
						return { event, x, y };
					})
					.filter(isPlottedEventPoint)
			: [];

	$: {
		if (hoverSplitX === null || width === 0) {
			hoverPercentage = 100;
		} else {
			hoverPercentage = (hoverSplitX / width) * 100;
		}
	}
	$: tooltipLeft = !xScale || !cursorPoint ? null : cursorPoint.x;
	$: tooltipTop = !yScale || !cursorPoint ? null : cursorPoint.y - 42;
	$: tooltipText = cursorPoint ? `$${cursorPoint.price.toFixed(2)}` : '';

	const handlePointerMove = (event: PointerEvent) => {
		if (!xScale || !series.length) {
			cursorPoint = null;
			return;
		}

		const target = event.currentTarget as HTMLElement;
		const bounds = target.getBoundingClientRect();
		const mouseX = clamp(event.clientX - bounds.left, 0, bounds.width);

		hoverSplitX = mouseX;
		const matchedPoint = interpolatePoint(xScale.invert(mouseX).getTime(), series);
		const pathPoint = getPointOnPathAtX(mouseX);

		if (!matchedPoint || !yScale || !pathPoint) {
			cursorPoint = null;
			return;
		}

		cursorPoint = {
			ts: matchedPoint.ts,
			x: mouseX,
			y: pathPoint.y,
			price: matchedPoint.price
		};
	};

	const handlePointerLeave = () => {
		hoverSplitX = null;
		cursorPoint = null;
	};

	const selectEvent = (event: FigEventPoint) => {
		onselect?.(event);
	};
</script>

<div
	class="chart-shell"
	bind:clientWidth={width}
	on:pointermove={handlePointerMove}
	on:pointerleave={handlePointerLeave}
	role="img"
	aria-label="Stock price chart"
>
	{#if width > 0}
		<svg class="chart-svg" {width} {height} viewBox={`0 0 ${width} ${height}`}>
			<defs>
				<linearGradient id="fig-hover-gradient" x1="0" y1="0" x2="100%" y2="0">
					<stop offset={`${hoverPercentage}%`} stop-color="var(--fig-line)" />
					<stop offset={`${hoverPercentage}%`} stop-color="var(--fig-muted-line)" />
				</linearGradient>
			</defs>

			{#if chartPath}
				<path
					bind:this={chartPathEl}
					d={chartPath}
					fill="none"
					stroke={cursorPoint ? 'url(#fig-hover-gradient)' : 'var(--fig-line)'}
					stroke-width="2.5"
				/>
			{/if}

			{#if cursorPoint}
				<line
					x1={cursorPoint.x}
					y1={padding.top}
					x2={cursorPoint.x}
					y2={height - padding.bottom}
					class="hover-line"
				/>
				<circle cx={cursorPoint.x} cy={cursorPoint.y} r="4" class="hover-dot" />
			{/if}
		</svg>

		<div class="hover-layer">
			{#if tooltipLeft !== null && tooltipTop !== null && cursorPoint}
				<div class="tooltip" style={`left: ${tooltipLeft}px; top: ${tooltipTop}px;`}>
					{tooltipText}
				</div>
			{/if}

			<div class="event-points">
				{#each plottedEvents as plotted (plotted.event.id)}
					<button
						type="button"
						class="event-dot"
						class:is-active={selectedEventId === plotted.event.id}
						style={`left: ${plotted.x}px; top: ${plotted.y}px;`}
						aria-label={`${plotted.event.title} at $${plotted.event.price.toFixed(2)}`}
						on:mouseenter={() => selectEvent(plotted.event)}
						on:focus={() => selectEvent(plotted.event)}
						on:click={() => selectEvent(plotted.event)}
					></button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.chart-shell {
		position: relative;
		width: 100%;
		min-height: 300px;
		color: var(--fig-text, #1e293b);
		font-family: inherit;
		cursor: crosshair;
	}

	.chart-svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.hover-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.tooltip {
		position: absolute;
		transform: translate(-50%, -100%);
		background: rgba(15, 23, 42, 0.95);
		color: #f8fafc;
		padding: 6px 10px;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
		white-space: nowrap;
	}

	.event-points {
		position: absolute;
		inset: 0;
	}

	.event-dot {
		position: absolute;
		display: block;
		width: 10px;
		height: 10px;
		padding: 0;
		border: 1px solid #ffffff;
		border-radius: 50%;
		background: var(--fig-dot, #1d4ed8);
		transform: translate(-50%, -50%);
		box-shadow: 0 0 0 4px var(--fig-dot-ring, rgba(29, 78, 216, 0.18));
		cursor: pointer;
		pointer-events: auto;
		transition:
			transform 150ms ease,
			box-shadow 150ms ease;
	}

	.event-dot.is-active {
		transform: translate(-50%, -50%) scale(1.2);
		box-shadow: 0 0 0 6px var(--fig-dot-ring, rgba(29, 78, 216, 0.18));
	}

	.hover-line {
		stroke: rgba(15, 23, 42, 0.18);
		stroke-width: 1;
		stroke-dasharray: 4 4;
	}

	.hover-dot {
		fill: var(--fig-line, #1d4ed8);
		stroke: #ffffff;
		stroke-width: 2;
	}
</style>
