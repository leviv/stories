<script lang="ts">
	import type { SleepEntry } from '../types';
	import { formatDuration } from '../utils';

	export let data: SleepEntry[] = [];
	export let selectedDate: string | null = null; // String 'YYYY-MM-DD' or null for all

	$: filteredData = selectedDate
		? data.filter((d) => {
				return d.groupDate === selectedDate;
			})
		: data;

	$: totalVisits = filteredData.length;

	$: totalHoursWasted =
		filteredData.reduce((acc, curr) => acc + (curr.durationMs || 0), 0) / 1000 / 60 / 60;

	// Top sites by time spent
	$: topSites = (() => {
		const timeSpent: Record<string, number> = {};
		filteredData.forEach((d) => {
			if (!d.domain) {
				return;
			}
			if (!timeSpent[d.domain]) {
				timeSpent[d.domain] = 0;
			}
			timeSpent[d.domain] += d.durationMs || 0;
		});
		return Object.entries(timeSpent)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5);
	})();

	// Unique days active (if viewing all)
	$: uniqueDays = (() => {
		if (selectedDate) {
			return 1;
		}
		const days: Record<string, boolean> = {};
		data.forEach((d) => {
			days[d.groupDate] = true;
		});
		return Object.keys(days).length;
	})();
</script>

<div class="stats-container">
	<div class="stat-card">
		<h3>Total Late-Night Visits</h3>
		<p class="stat-value">{totalVisits.toLocaleString()}</p>
		<span class="stat-label">Pages loaded</span>
	</div>

	<div class="stat-card">
		<h3>Time Wasted</h3>
		<p class="stat-value">{totalHoursWasted.toFixed(1)} <span class="unit">hrs</span></p>
		<span class="stat-label">Estimated duration</span>
	</div>

	{#if !selectedDate}
		<div class="stat-card">
			<h3>Days Active</h3>
			<p class="stat-value">{uniqueDays}</p>
			<span class="stat-label">Out of 353 total days</span>
		</div>
	{/if}

	<div class="stat-card top-sites">
		<h3>Top Sites</h3>
		<ul>
			{#each topSites as [domain, ms] (domain)}
				<li>
					<span class="domain">{domain}</span>
					<span class="count">{formatDuration(ms)}</span>
				</li>
			{/each}
			{#if topSites.length === 0}
				<li class="empty">No data for this selection</li>
			{/if}
		</ul>
	</div>
</div>

<style>
	.stats-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
		border-top: 2px solid #e2e8f0;
		padding-top: 2rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
	}

	h3 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #64748b;
		font-weight: 500;
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 600;
		margin: 0;
		color: #1d4ed8;
		font-family: 'Playfair Display', 'Times New Roman', serif;
	}

	.unit {
		font-size: 1rem;
		font-weight: 400;
		color: #64748b;
		font-family: 'Space Grotesk', sans-serif;
	}

	.stat-label {
		font-size: 0.8rem;
		color: #94a3b8;
		margin-top: 4px;
	}

	.top-sites ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.top-sites li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
		padding: 0.25rem 0;
		border-bottom: 1px solid #e2e8f0;
		color: #1e293b;
	}

	.top-sites li:last-child {
		border-bottom: none;
	}

	.domain {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 150px;
	}

	.count {
		font-size: 0.8rem;
		color: #64748b;
	}

	.empty {
		color: #94a3b8;
		font-style: italic;
		justify-content: center !important;
		border: none !important;
	}
</style>
