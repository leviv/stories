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
		image?: string;
		ts: number;
		price: number;
	};

	type PlottedEventPoint = { event: FigEventPoint; x: number; y: number };
	type CursorPoint = { x: number; y: number; ts: number; price: number };

	export let series: ChartPoint[] = [];
	export let events: FigEventPoint[] = [];
	export let height = 360;
	export let selectedEventId: string | null = null;
	export let onhover:
		| ((data: { price: number; event: FigEventPoint; ts?: number } | null) => void)
		| undefined = undefined;
	export let onclickchart: ((event: FigEventPoint) => void) | undefined = undefined;

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

	const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

	const isPlottedEventPoint = (item: PlottedEventPoint | null): item is PlottedEventPoint =>
		item !== null;

	const getSegmentEvent = (ts: number) => {
		for (let i = events.length - 1; i >= 0; i--) {
			if (ts >= events[i].ts) {
				return events[i];
			}
		}
		return events[0];
	};

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
				.x((point) => xScale!(new Date(point.ts * 1000)))
				.y((point) => yScale!(point.price))
				.curve(curveMonotoneX);

			chartPath = chartLine(series) ?? '';
		}
	}

	$: plottedEvents =
		xScale && yScale
			? events
					.map((event) => {
						const x = xScale!(new Date(event.ts * 1000));
						const y = yScale!(event.price);
						if (!Number.isFinite(x) || !Number.isFinite(y)) {
							return null;
						}
						return { event, x, y };
					})
					.filter(isPlottedEventPoint)
			: [];

	const figmaColors = ['#1d4ed8', '#a259ff', '#0acf83', '#f24e1e', '#1abcfe'];
	let activeGradientStops: { offset: number; color: string }[] = [];
	let hoverPercentage = 100;

	$: {
		if (hoverSplitX === null || width === 0) {
			hoverPercentage = 100;
		} else {
			hoverPercentage = (hoverSplitX / width) * 100;
		}
	}

	$: {
		if (xScale && plottedEvents.length > 0 && width > 0) {
			const baseStops: { offset: number; color: string }[] = [];
			let lastOffset = 0;
			for (let i = 0; i < plottedEvents.length; i++) {
				const currentOffset = (plottedEvents[i].x / width) * 100;
				const segmentColor = figmaColors[Math.min(i, figmaColors.length - 1)];
				baseStops.push({ offset: lastOffset, color: segmentColor });
				baseStops.push({ offset: currentOffset, color: segmentColor });
				lastOffset = currentOffset;
			}
			const finalColor = figmaColors[Math.min(plottedEvents.length, figmaColors.length - 1)];
			baseStops.push({ offset: lastOffset, color: finalColor });
			baseStops.push({ offset: 100, color: finalColor });

			if (cursorPoint && hoverPercentage < 100) {
				const mixedStops: { offset: number; color: string }[] = [];
				let hoverColor = finalColor;

				for (let i = 0; i < baseStops.length; i++) {
					const stop = baseStops[i];
					if (stop.offset <= hoverPercentage) {
						mixedStops.push(stop);
						hoverColor = stop.color;
					} else {
						if (
							mixedStops.length === 0 ||
							mixedStops[mixedStops.length - 1].offset < hoverPercentage
						) {
							mixedStops.push({ offset: hoverPercentage, color: hoverColor });
							mixedStops.push({ offset: hoverPercentage, color: '#cbd5e1' });
						} else if (
							mixedStops[mixedStops.length - 1].offset === hoverPercentage &&
							mixedStops[mixedStops.length - 1].color !== '#cbd5e1'
						) {
							mixedStops.push({ offset: hoverPercentage, color: '#cbd5e1' });
						}
						break;
					}
				}

				if (mixedStops[mixedStops.length - 1].offset < 100) {
					mixedStops.push({ offset: 100, color: '#cbd5e1' });
				}
				activeGradientStops = mixedStops;
			} else {
				activeGradientStops = baseStops;
			}
		} else {
			activeGradientStops = [
				{ offset: 0, color: 'var(--fig-line)' },
				{ offset: 100, color: 'var(--fig-line)' }
			];
		}
	}

	$: {
		if (cursorPoint) {
			const activeEv = getSegmentEvent(cursorPoint.ts);
			onhover?.({ price: cursorPoint.price, event: activeEv, ts: cursorPoint.ts });
		} else {
			onhover?.(null);
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
		const targetTs = xScale.invert(mouseX).getTime() / 1000;
		const matchedPoint = interpolatePoint(targetTs, series);
		const pathPoint = getPointOnPathAtX(mouseX);

		if (!matchedPoint || !yScale || !pathPoint) {
			cursorPoint = null;
			return;
		}

		cursorPoint = {
			ts: targetTs,
			x: mouseX,
			y: pathPoint.y,
			price: yScale.invert(pathPoint.y)
		};
	};

	const handlePointerDown = (event: PointerEvent) => {
		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture(event.pointerId);
		handlePointerMove(event);
	};

	const handlePointerUp = (event: PointerEvent) => {
		const target = event.currentTarget as HTMLElement;
		target.releasePointerCapture(event.pointerId);
		if (cursorPoint) {
			const activeEv = getSegmentEvent(cursorPoint.ts);
			onclickchart?.(activeEv);
		}
	};

	const handlePointerLeave = () => {
		hoverSplitX = null;
		cursorPoint = null;
	};
</script>

<div
	class="chart-shell"
	bind:clientWidth={width}
	on:pointerdown={handlePointerDown}
	on:pointermove={handlePointerMove}
	on:pointerup={handlePointerUp}
	on:pointerleave={handlePointerLeave}
	role="img"
	aria-label="Stock price chart"
>
	{#if width > 0}
		{#each plottedEvents as plotted (plotted.event.id)}
			{#if plotted.event.image}
				<img
					src={plotted.event.image}
					alt={plotted.event.title}
					class="event-background-image"
					class:is-active={selectedEventId === plotted.event.id}
					style={`left: ${plotted.x}px; top: ${plotted.y}px;`}
					on:pointerdown={(e) => {
						e.stopPropagation();
						onclickchart?.(plotted.event);
					}}
				/>
			{/if}
		{/each}

		<svg class="chart-svg" {width} {height} viewBox={`0 0 ${width} ${height}`}>
			<defs>
				<linearGradient
					id="fig-line-gradient"
					x1="0"
					y1="0"
					x2="100%"
					y2="0"
					gradientUnits="userSpaceOnUse"
				>
					{#each activeGradientStops as stop, i (i)}
						<stop offset={`${stop.offset}%`} stop-color={stop.color} />
					{/each}
				</linearGradient>
			</defs>

			{#if chartPath}
				<path
					bind:this={chartPathEl}
					d={chartPath}
					fill="none"
					stroke="url(#fig-line-gradient)"
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
				{#each plottedEvents as plotted, i (plotted.event.id)}
					<button
						type="button"
						class="event-dot"
						class:is-active={selectedEventId === plotted.event.id}
						style={`left: ${plotted.x}px; top: ${plotted.y}px; --fig-dot: ${figmaColors[Math.min(i, figmaColors.length - 1)]}; --fig-dot-ring: ${figmaColors[Math.min(i, figmaColors.length - 1)]}2e;`}
						aria-label={`${plotted.event.title} at $${plotted.event.price.toFixed(2)}`}
						on:pointerdown={(e) => {
							e.stopPropagation();
							onclickchart?.(plotted.event);
						}}
					></button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.chart-shell {
		position: relative;
		z-index: 0;
		width: 100%;
		min-height: 300px;
		color: var(--fig-text, #1e293b);
		font-family: inherit;
		cursor: crosshair;
		touch-action: none;
	}

	.chart-svg {
		display: block;
		width: 100%;
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
		width: 18px;
		height: 18px;
		padding: 0;
		border: 2px solid #ffffff;
		border-radius: 50%;
		background: var(--fig-dot, #1d4ed8);
		transform: translate(-50%, -50%);
		box-shadow: 0 0 0 6px var(--fig-dot-ring, rgba(29, 78, 216, 0.18));
		cursor: pointer;
		pointer-events: auto;
		transition:
			transform 150ms ease,
			box-shadow 150ms ease;
	}

	.event-dot.is-active {
		transform: translate(-50%, -50%) scale(1.3);
		box-shadow: 0 0 0 8px var(--fig-dot-ring, rgba(29, 78, 216, 0.18));
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

	.event-background-image {
		position: absolute;
		width: 50px;
		height: auto;
		transform: translate(-50%, -50%);
		z-index: -1;
		pointer-events: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: width 0.1s ease;
		cursor: pointer;
	}

	.event-background-image.is-active {
		width: 400px;
		z-index: -1; /* Keep it behind everything else */
	}
</style>
