<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Stats from '$lib/sleep/components/Stats.svelte';
	import Timeline from '$lib/sleep/components/Timeline.svelte';
	import DatabaseGrid from '$lib/sleep/components/DatabaseGrid.svelte';
	import type { SleepEntry } from '$lib/sleep/types';

	let data: SleepEntry[] = [];
	let loading = true;
	let selectedDate: string | null = null; // 'YYYY-MM-DD'

	onMount(async () => {
		// Load the filtered JSON file dynamically
		const res = await import('$lib/sleep/filtered.json');
		data = res.default;
		loading = false;
	});

	function handleDateSelect(event: CustomEvent<string | null>) {
		selectedDate = event.detail;
	}
</script>

<svelte:head>
	<title>The City That Never Sleeps</title>
</svelte:head>

<main class="page-container">
	<div class="content">
		<section class="hero">
			<h1>The City That Never Sleeps</h1>
			<p class="blurb">
				This is all of the Google Chrome data from times where I should have been asleep.
				<span class="highlight">The city never sleeps, but I needed to.</span>
				And you can be the judge whether browsing these websites was a good use of my time between the
				hours of 1 a.m. and 7 a.m.
			</p>
		</section>

		{#if loading}
			<div class="loading" out:fade>
				<div class="spinner"></div>
				<p>Loading your late-night regrets...</p>
			</div>
		{:else}
			<div class="dashboard" in:fade={{ duration: 500 }}>
				<Timeline {data} {selectedDate} on:select={handleDateSelect} />

				<DatabaseGrid {data} {selectedDate} />

				<Stats {data} {selectedDate} />
			</div>
		{/if}
		<footer class="footer">
			<p>
				Made with ❤️ by <a href="https://leviv.cool" target="_blank" rel="noopener noreferrer"
					>Levi</a
				> in Shanghai
			</p>
		</footer>
	</div>
</main>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Space+Grotesk:wght@400;500&display=swap');

	/* Global Page Styles */
	.page-container {
		background-color: #f8f5f0; /* Fig light theme base */
		color: #1e293b;
		font-family: 'Space Grotesk', 'Helvetica Neue', sans-serif;
		position: relative;
		min-height: 100vh;
		width: 100vw;
	}

	/* Main Content */
	.content {
		position: relative;
		z-index: 1;
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.hero {
		text-align: left;
		padding: 2rem 0;
	}

	h1 {
		font-family: 'Playfair Display', 'Times New Roman', serif;
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: #1d4ed8; /* Using the fig-line color for the title */
		letter-spacing: -0.02em;
	}

	.blurb {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #64748b;
		max-width: 800px;
		margin: 0;
	}

	.highlight {
		color: #1e293b;
		font-weight: 500;
	}

	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 4rem;
	}

	/* Loading State */
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 5rem 0;
		color: #64748b;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 2px solid rgba(29, 78, 216, 0.2);
		border-top-color: #1d4ed8;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.content {
			padding: 2rem 1rem;
		}
		.dashboard {
			gap: 2.5rem;
		}
	}

	.footer {
		text-align: left;
		padding: 2rem 0 0 0;
		color: #64748b;
		font-size: 0.9rem;
		font-family: inherit;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-top: 1px dashed #cbd5e1;
		margin-top: 0;
	}

	.footer p {
		margin: 0;
	}

	.footer a {
		color: #1d4ed8;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s;
	}

	.footer a:hover {
		color: #1e40af;
		text-decoration: underline;
	}
</style>
