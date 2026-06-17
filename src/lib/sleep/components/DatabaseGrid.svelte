<script lang="ts">
	import type { SleepEntry } from '../types';
	import { formatDuration } from '../utils';

	export let data: SleepEntry[] = [];
	export let selectedDate: string | null = null;

	let searchQuery = '';
	let sortBy = 'time_spent_desc'; // Default to Most Time Spent
	let isExpanded = false;

	$: filteredData = data
		.filter((d) => {
			// Date filter
			if (selectedDate) {
				if (d.groupDate !== selectedDate) {
					return false;
				}
			}

			// Search filter
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				const t = (d.title || '').toLowerCase();
				const u = (d.url || '').toLowerCase();
				if (!t.includes(q) && !u.includes(q)) {
					return false;
				}
			}

			return true;
		})
		.sort((a, b) => {
			if (sortBy === 'time_desc') {
				return b.time - a.time;
			}
			if (sortBy === 'time_asc') {
				return a.time - b.time;
			}
			if (sortBy === 'time_spent_desc') {
				const timeA = a.durationMs || 0;
				const timeB = b.durationMs || 0;
				if (timeA !== timeB) {
					return timeB - timeA;
				}
				return b.time - a.time; // secondary sort
			}
			return 0;
		});

	let page = 1;
	const perPage = 50;
	$: totalPages = Math.ceil(filteredData.length / perPage);

	$: paginatedData = isExpanded
		? filteredData.slice((page - 1) * perPage, page * perPage)
		: filteredData.slice(0, 10);

	// Reset page when filters change
	$: if (selectedDate !== undefined || searchQuery !== undefined || sortBy !== undefined) {
		page = 1;
	}

	function formatTime(row: SleepEntry) {
		return (
			row.localTime ||
			new Date(row.time).toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			})
		);
	}

	function formatDate(row: SleepEntry) {
		return (
			row.localDate ||
			new Date(row.time).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			})
		);
	}
</script>

<div class="db-container">
	<div class="controls">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search title or URL..."
			class="search-input"
			on:input={() => {
				if (searchQuery) {
					isExpanded = true;
				}
			}}
		/>

		<select bind:value={sortBy} class="sort-select">
			<option value="time_spent_desc">Most Time Spent</option>
			<option value="time_desc">Newest First</option>
			<option value="time_asc">Oldest First</option>
		</select>
	</div>

	<div class="table-wrapper">
		<table class="data-table">
			<thead>
				<tr>
					<th style="width: 15%">Date & Time</th>
					<th style="width: 45%">Title</th>
					<th style="width: 25%">Domain</th>
					<th style="width: 15%">Est. Time</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedData as row (row.time)}
					<tr>
						<td class="time-col">
							<span class="date">{formatDate(row)}</span>
							<span class="time">{formatTime(row)}</span>
						</td>
						<td class="title-col">
							<div class="title-with-icon">
								{#if row.domain}
									<img
										src={`https://www.google.com/s2/favicons?domain=${row.domain}&sz=32`}
										class="favicon"
										alt=""
										loading="lazy"
									/>
								{/if}
								<div class="title-text">
									<div class="title" title={row.title}>{row.title || 'Unknown Title'}</div>
									<div class="url" title={row.url}>{row.url}</div>
								</div>
							</div>
						</td>
						<td class="domain-col">
							<span class="domain-badge">{row.domain || 'unknown'}</span>
						</td>
						<td class="duration-col">{formatDuration(row.durationMs, 'minutes')}</td>
					</tr>
				{/each}

				{#if paginatedData.length === 0}
					<tr>
						<td colspan="4" class="empty-state">No entries found for this selection.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	{#if !isExpanded && filteredData.length > 10}
		<button class="expand-btn" on:click={() => (isExpanded = true)}>
			Expand to show more ({filteredData.length - 10} hidden)
		</button>
	{/if}

	{#if isExpanded && totalPages > 1}
		<div class="pagination">
			<button class="page-btn" disabled={page === 1} on:click={() => page--}>Prev</button>
			<span class="page-info">Page {page} of {totalPages}</span>
			<button class="page-btn" disabled={page === totalPages} on:click={() => page++}>Next</button>
			<button
				class="collapse-btn"
				on:click={() => {
					isExpanded = false;
					page = 1;
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}}
			>
				Collapse
			</button>
		</div>
	{/if}
</div>

<style>
	.db-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.controls {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.search-input,
	.sort-select {
		background: transparent;
		border: 1px solid #cbd5e1;
		color: #1e293b;
		padding: 0.5rem 1rem;
		font-family: inherit;
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.search-input {
		flex: 1;
		min-width: 200px;
	}

	.search-input:focus,
	.sort-select:focus {
		border-color: #1d4ed8;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.data-table th {
		padding: 1rem 0.5rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		color: #64748b;
		border-bottom: 2px solid #e2e8f0;
		font-weight: 500;
		letter-spacing: 0.05em;
	}

	.data-table td {
		padding: 0.75rem 0.5rem;
		border-bottom: 1px solid #e2e8f0;
		vertical-align: middle;
	}

	.data-table tr:hover td {
		background: rgba(29, 78, 216, 0.02);
	}

	.time-col {
		display: flex;
		flex-direction: column;
	}

	.date {
		font-size: 0.8rem;
		color: #64748b;
	}

	.time {
		font-weight: 500;
		color: #1e293b;
	}

	.title-col {
		max-width: 0;
	}

	.title-with-icon {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.favicon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		border-radius: 2px;
	}

	.title-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.title {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: #1e293b;
	}

	.url {
		font-size: 0.8rem;
		color: #64748b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.domain-badge {
		color: #1d4ed8;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.duration-col {
		font-weight: 500;
		color: #64748b;
	}

	.empty-state {
		text-align: center;
		padding: 3rem !important;
		color: #64748b;
		font-style: italic;
	}

	.expand-btn {
		background: transparent;
		border: 1px solid #1d4ed8;
		color: #1d4ed8;
		padding: 0.75rem 1rem;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
		font-weight: 500;
		text-align: center;
		width: 100%;
		transition: background-color 0.2s;
	}

	.expand-btn:hover {
		background: rgba(29, 78, 216, 0.05);
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.page-btn,
	.collapse-btn {
		background: transparent;
		border: 1px solid #cbd5e1;
		color: #1e293b;
		padding: 0.4rem 1rem;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.2s;
	}

	.collapse-btn {
		margin-left: 2rem;
		border-color: #ef4444;
		color: #ef4444;
	}

	.page-btn:hover:not(:disabled),
	.collapse-btn:hover {
		background: rgba(0, 0, 0, 0.02);
	}

	.page-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.page-info {
		font-size: 0.9rem;
		color: #64748b;
	}
</style>
