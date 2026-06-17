<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SleepEntry } from '../types';
	import { formatDuration } from '../utils';

	const dispatch = createEventDispatcher();

	export let data: SleepEntry[] = [];
	export let selectedDate: string | null = null;

	interface DayData {
		date: string;
		count: number;
		wastedFormatted: string;
		isFuture: boolean;
	}

	// Group by day string 'YYYY-MM-DD'
	$: statsByDay = (() => {
		const stats: Record<string, { count: number; wastedMs: number }> = {};
		data.forEach((d) => {
			const dateStr = d.groupDate;
			if (!stats[dateStr]) {
				stats[dateStr] = { count: 0, wastedMs: 0 };
			}
			stats[dateStr].count++;
			stats[dateStr].wastedMs += d.durationMs || 0;
		});
		return stats;
	})();

	$: maxCount = Math.max(1, ...Object.values(statsByDay).map((s) => s.count));

	// Generate grid (52 weeks x 7 days)
	$: grid = (() => {
		if (data.length === 0) {
			return [];
		}
		// Get the latest groupDate
		const allDates = data.map((d) => d.groupDate).sort();
		const newestDateStr = allDates[allDates.length - 1];

		// Parse newestDateStr into a Date object at noon (to avoid timezone shifts)
		const [y, m, d_num] = newestDateStr.split('-');
		const endDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d_num), 12, 0, 0);

		const daysToNextSat = 6 - endDate.getDay();
		const finalEndDate = new Date(
			endDate.getFullYear(),
			endDate.getMonth(),
			endDate.getDate() + daysToNextSat,
			12,
			0,
			0
		);

		const startDate = new Date(
			finalEndDate.getFullYear(),
			finalEndDate.getMonth(),
			finalEndDate.getDate() - 52 * 7 + 1,
			12,
			0,
			0
		);

		const weeks = [];
		let curr = new Date(startDate);
		const newestDateNum = parseInt(newestDateStr.replace(/-/g, ''));

		for (let w = 0; w < 52; w++) {
			const week = [];
			for (let day = 0; day < 7; day++) {
				const dateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
				const currDateNum = parseInt(dateStr.replace(/-/g, ''));
				const dayStats = statsByDay[dateStr] || { count: 0, wastedMs: 0 };
				week.push({
					date: dateStr,
					count: dayStats.count,
					wastedFormatted: formatDuration(dayStats.wastedMs),
					isFuture: currDateNum > newestDateNum
				});
				curr = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() + 1, 12, 0, 0);
			}
			weeks.push(week);
		}
		return weeks;
	})();

	function selectDate(dateStr: string | null) {
		if (selectedDate === dateStr) {
			dispatch('select', null);
		} else {
			dispatch('select', dateStr);
		}
	}

	let tooltipVisible = false;
	let tooltipContent = '';
	let tooltipX = 0;
	let tooltipY = 0;

	function handleMouseEnter(event: MouseEvent, day: DayData) {
		if (day.isFuture) {
			return;
		}
		tooltipContent = `${day.date} - ${day.wastedFormatted}`;
		tooltipVisible = true;
		tooltipX = event.clientX;
		tooltipY = event.clientY;
	}

	function handleMouseMove(event: MouseEvent) {
		if (tooltipVisible) {
			tooltipX = event.clientX;
			tooltipY = event.clientY;
		}
	}

	function handleMouseLeave() {
		tooltipVisible = false;
	}

	function getOpacity(count: number) {
		if (count === 0) {
			return 0.05;
		} // very faint for empty
		return 0.3 + 0.7 * (count / maxCount);
	}
</script>

<div class="timeline-container">
	<div class="header">
		<h3>Activity Timeline</h3>
		{#if selectedDate}
			<button class="clear-btn" on:click={() => dispatch('select', null)}> Clear Selection </button>
		{/if}
	</div>

	<div class="heatmap-wrapper">
		<div class="heatmap">
			{#each grid as week, i (i)}
				<div class="week">
					{#each week as day (day.date)}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="day {selectedDate === day.date ? 'selected' : ''}"
							class:empty={day.count === 0}
							class:future={day.isFuture}
							style="background-color: {day.count > 0
								? `rgba(29, 78, 216, ${getOpacity(day.count)})`
								: 'rgba(29, 78, 216, 0.05)'}"
							on:click={() => {
								if (!day.isFuture) {
									selectDate(day.date);
								}
							}}
							on:mouseenter={(e) => handleMouseEnter(e, day)}
							on:mousemove={handleMouseMove}
							on:mouseleave={handleMouseLeave}
						></div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
	<div class="legend">
		<span>Less</span>
		<div class="legend-scale">
			<div style="background-color: rgba(29, 78, 216, 0.05)"></div>
			<div style="background-color: rgba(29, 78, 216, 0.3)"></div>
			<div style="background-color: rgba(29, 78, 216, 0.5)"></div>
			<div style="background-color: rgba(29, 78, 216, 0.8)"></div>
			<div style="background-color: rgba(29, 78, 216, 1.0)"></div>
		</div>
		<span>More</span>
	</div>
</div>

{#if tooltipVisible}
	<div class="custom-tooltip" style="top: {tooltipY - 12}px; left: {tooltipX}px;">
		{tooltipContent}
	</div>
{/if}

<style>
	.timeline-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h3 {
		margin: 0;
		font-size: 1rem;
		color: #1e293b;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.clear-btn {
		background: transparent;
		border: 1px solid #cbd5e1;
		color: #64748b;
		padding: 4px 12px;
		cursor: pointer;
		font-size: 0.8rem;
		transition: all 0.2s;
	}

	.clear-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1e293b;
	}

	.heatmap-wrapper {
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.heatmap {
		display: flex;
		gap: 2px; /* Very tight, clean gap */
		width: fit-content;
		margin: 0 auto;
	}

	.week {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.day {
		width: 12px;
		height: 12px;
		cursor: pointer;
		transition: transform 0.1s;
		border: 1px solid transparent;
	}

	.day:hover {
		border-color: #1e293b;
		transform: scale(1.1);
		z-index: 2;
	}

	.day.future {
		background: transparent !important;
		border: 0;
		cursor: default;
	}

	.day.future:hover {
		transform: none;
		border-color: transparent;
	}

	.day.selected {
		border: 1px solid #1e293b;
		transform: scale(1.1);
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: #64748b;
		justify-content: flex-end;
	}

	.legend-scale {
		display: flex;
		gap: 2px;
	}

	.legend-scale div {
		width: 12px;
		height: 12px;
	}

	.custom-tooltip {
		position: fixed;
		background: #1e293b;
		color: white;
		padding: 6px 10px;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 500;
		pointer-events: none;
		z-index: 1000;
		transform: translate(-50%, -100%);
		white-space: nowrap;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}
</style>
