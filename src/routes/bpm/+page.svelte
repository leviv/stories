<script lang="ts">
	import { scaleTime, scaleLinear } from 'd3-scale';
	import { line, curveMonotoneX } from 'd3-shape';
	import bpmDataRaw from '$lib/data/bpm_data.json';
	import { onMount } from 'svelte';

	type TopTrack = {
		name: string;
		artist: string;
		spotifyUri: string | null;
		bpm: number;
	};

	type DailyDataPoint = {
		date: string;
		avgBpm: number;
		topTrack: TopTrack;
		over140BpmCount: number;
		rollingWeightedBpm: number;
	};

	type BpmData = {
		daily: DailyDataPoint[];
		timeOfDayStats: {
			morning: number;
			afternoon: number;
			evening: number;
			night: number;
		};
		monthlyGenres: Record<string, string[]>;
		topBpmTracks: TopTrack[];
		topDaysByMinutes: { date: string; minutes: number }[];
	};

	const bpmData = bpmDataRaw as BpmData;

	const dailyData = bpmData.daily.map((d) => ({
		...d,
		dateObj: new Date(d.date + 'T00:00:00Z') // Ensure it parses as midnight UTC to avoid local timezone shifts
	}));

	let width = $state(800);
	const height = $state(400);
	const margin = { top: 20, right: 20, bottom: 40, left: 50 };

	const innerWidth = $derived(width - margin.left - margin.right);
	const innerHeight = $derived(height - margin.top - margin.bottom);

	const xScale = $derived(
		scaleTime()
			.domain([dailyData[0].dateObj, dailyData[dailyData.length - 1].dateObj])
			.range([0, innerWidth])
	);

	const maxBpm = $derived(Math.max(...dailyData.map((d) => d.rollingWeightedBpm)));
	const minBpm = $derived(Math.min(...dailyData.map((d) => d.rollingWeightedBpm)));

	const yScale = $derived(
		scaleLinear()
			.domain([Math.max(0, minBpm - 2), maxBpm + 2])
			.range([innerHeight, 0])
	);

	const pathGenerator = $derived(
		line<(typeof dailyData)[0]>()
			.x((d) => xScale(d.dateObj))
			.y((d) => yScale(d.rollingWeightedBpm))
			.curve(curveMonotoneX)
	);

	const pathData = $derived(pathGenerator(dailyData));

	// Spotify IFrame API types
	interface SpotifyEmbedController {
		loadUri: (uri: string) => void;
		play: () => void;
		seek: (seconds: number) => void;
		togglePlay: () => void;
	}

	interface SpotifyIframeApi {
		createController: (
			element: HTMLElement,
			options: { width: string; height: string; uri: string },
			callback: (EmbedController: SpotifyEmbedController) => void
		) => void;
	}

	// Interaction state
	let hoveredData = $state<(typeof dailyData)[0] | null>(null);
	let spotifyPlayer = $state<SpotifyEmbedController | null>(null);
	let currentSpotifyUri = $state<string | null>(null);

	onMount(() => {
		(
			window as Window & { onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void }
		).onSpotifyIframeApiReady = (IFrameAPI) => {
			const element = document.getElementById('spotify-embed-iframe');
			if (!element) {
				return;
			}
			const options = {
				width: '100%',
				height: '80',
				uri: dailyData[0].topTrack.spotifyUri || 'spotify:track:3n3Ppam7vgaBg1s4vP9zZA'
			};
			const callback = (EmbedController: SpotifyEmbedController) => {
				spotifyPlayer = EmbedController;
			};
			IFrameAPI.createController(element, options, callback);
		};

		const script = document.createElement('script');
		script.src = 'https://open.spotify.com/embed/iframe-api/v1';
		script.async = true;
		document.body.appendChild(script);
	});

	function handleMousemove(e: MouseEvent) {
		const { left } = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
		const xPos = e.clientX - left - margin.left;

		if (xPos < 0 || xPos > innerWidth) {
			hoveredData = null;
			return;
		}

		const hoverDate = xScale.invert(xPos);

		let closest = dailyData[0];
		let minDiff = Infinity;
		for (const d of dailyData) {
			const diff = Math.abs(d.dateObj.getTime() - hoverDate.getTime());
			if (diff < minDiff) {
				minDiff = diff;
				closest = d;
			}
		}

		hoveredData = closest;
	}

	function handleMouseleave() {
		hoveredData = null;
	}

	function playSpotifyUri(uri: string) {
		if (spotifyPlayer) {
			if (currentSpotifyUri !== uri) {
				console.log('Loading new URI into Spotify player:', uri);
				currentSpotifyUri = uri;
				spotifyPlayer.loadUri(uri);
				setTimeout(() => {
					spotifyPlayer?.play();
					spotifyPlayer?.seek(60); // Seek to ~midpoint (60 seconds)
				}, 500);
			} else {
				console.log('Toggling play on current URI');
				spotifyPlayer.togglePlay();
			}
		}
	}

	function handleClick() {
		console.log(
			'Clicked track:',
			hoveredData?.topTrack?.name,
			'URI:',
			hoveredData?.topTrack?.spotifyUri
		);
		if (hoveredData?.topTrack?.spotifyUri && spotifyPlayer) {
			playSpotifyUri(hoveredData.topTrack.spotifyUri);
		} else {
			console.log('No Spotify URI available for this track or player not initialized.');
		}
	}

	// Calculate which time of day had highest bpm
	const tod = bpmData.timeOfDayStats;
	const times = [
		{ name: 'Mornings', val: tod.morning || 0 },
		{ name: 'Afternoons', val: tod.afternoon || 0 },
		{ name: 'Evenings', val: tod.evening || 0 },
		{ name: 'Nights', val: tod.night || 0 }
	];
	times.sort((a, b) => b.val - a.val);
	const busiestTime = times[0].name;
</script>

<div class="container">
	<header class="header">
		<h1>Summer 2025: The Pace of Life</h1>
		<p class="subtitle">
			A 7-day weighted moving average of my BPM. Days where I listened to more songs pull the
			average closer to their pace.
		</p>
	</header>

	<main>
		<!-- Stats Grid -->
		<div class="stats-grid">
			<div class="stat-card">
				<h3>Fastest Time of Day</h3>
				<p class="fact-text">
					<strong>{busiestTime}</strong>
					were the most frantic. This is when the highest average BPM music was played.
				</p>
			</div>
			<div class="stat-card genre-card">
				<h3>Genre Shift</h3>
				{#each Object.entries(bpmData.monthlyGenres) as [month, genres] (month)}
					<div class="month-genres">
						<span class="month-label">{month}:</span>
						<span class="genre-list">{(genres as string[]).slice(0, 3).join(', ')}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Graph Container -->
		<div class="graph-wrapper" bind:clientWidth={width}>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<svg
				{width}
				{height}
				onmousemove={handleMousemove}
				onmouseleave={handleMouseleave}
				onclick={handleClick}
				role="img"
				aria-label="Graph of 7-day weighted rolling average BPM"
			>
				<g transform="translate({margin.left}, {margin.top})">
					<!-- Y Axis -->
					<g class="axis y-axis">
						{#each yScale.ticks(5) as tick (tick)}
							<g transform="translate(0, {yScale(tick)})">
								<line x1="0" x2={innerWidth} stroke="#eee" />
								<text x="-10" y="5" text-anchor="end">{tick}</text>
							</g>
						{/each}
					</g>

					<!-- X Axis -->
					<g class="axis x-axis" transform="translate(0, {innerHeight})">
						{#each xScale.ticks(5) as tick (tick)}
							<g transform="translate({xScale(tick)}, 0)">
								<line y1="0" y2="5" stroke="#000" />
								<text y="20" text-anchor="middle"
									>{tick.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text
								>
							</g>
						{/each}
					</g>

					<!-- Data Line -->
					{#if pathData}
						<path d={pathData} class="data-line" />
					{/if}

					<!-- Interactive Crosshair -->
					{#if hoveredData}
						<line
							class="crosshair"
							x1={xScale(hoveredData.dateObj)}
							x2={xScale(hoveredData.dateObj)}
							y1={0}
							y2={innerHeight}
						/>
						<circle
							class="data-point"
							cx={xScale(hoveredData.dateObj)}
							cy={yScale(hoveredData.rollingWeightedBpm)}
							r="6"
						/>
					{/if}
				</g>
			</svg>

			<!-- Hover Panel HTML overlay -->
			{#if hoveredData}
				<div
					class="hover-panel"
					style="left: {margin.left + xScale(hoveredData.dateObj)}px; top: {margin.top +
						Math.min(innerHeight, Math.max(0, yScale(hoveredData.rollingWeightedBpm)))}px"
				>
					<div class="hover-date">
						{hoveredData.dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
					</div>
					<div class="hover-bpm">
						Weighted BPM: <strong>{Math.round(hoveredData.rollingWeightedBpm)}</strong>
					</div>

					<div class="top-track">
						<div class="track-label">Track of the Day</div>
						<div class="track-name">{hoveredData.topTrack.name}</div>
						<div class="track-artist">{hoveredData.topTrack.artist}</div>
						{#if hoveredData.topTrack.spotifyUri}
							<div class="click-hint">Click graph to play on Spotify preview</div>
						{:else}
							<div class="click-hint no-audio">No Spotify preview available</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Top BPM Tracks Section -->
		<section class="top-tracks-section">
			<h2>Highest BPM Tracks</h2>
			<div class="tracks-list">
				{#each bpmData.topBpmTracks as track (track.spotifyUri || track.name)}
					<div class="track-card">
						<div class="track-info">
							<span class="track-name">{track.name}</span>
							<span class="track-artist">{track.artist}</span>
						</div>
						<div class="track-bpm">{Math.round(track.bpm)} BPM</div>
						{#if track.spotifyUri}
							<button class="preview-btn" onclick={() => playSpotifyUri(track.spotifyUri!)}
								>Play</button
							>
						{:else}
							<button class="preview-btn disabled" disabled>N/A</button>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<!-- Top Days Section -->
		<section class="top-days-section">
			<h2>Most Minutes Listening</h2>
			<div class="days-list">
				{#each bpmData.topDaysByMinutes as day (day.date)}
					<div class="day-card">
						<div class="day-date">
							{new Date(day.date + 'T00:00:00Z').toLocaleDateString('en-US', {
								month: 'long',
								day: 'numeric',
								year: 'numeric'
							})}
						</div>
						<div class="day-minutes">{day.minutes} mins</div>
					</div>
				{/each}
			</div>
		</section>
	</main>

	<!-- Sticky Spotify Player -->
	<div class="spotify-sticky-player">
		<div id="spotify-embed-iframe"></div>
	</div>
</div>

<style>
	.spotify-sticky-player {
		position: fixed;
		bottom: 20px;
		left: 20px;
		right: 20px;
		z-index: 1000;
	}

	:global(body) {
		background-color: #fcfcfc;
		color: #111;
		font-family:
			'Inter',
			-apple-system,
			sans-serif;
		margin: 0;
		padding: 0;
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 4rem 2rem 12rem 2rem;
	}

	.header {
		margin-bottom: 3rem;
		border-bottom: 4px solid #111;
		padding-bottom: 1rem;
	}

	h1 {
		font-size: 3rem;
		font-weight: 900;
		letter-spacing: -0.05em;
		margin: 0 0 0.5rem 0;
		text-transform: uppercase;
	}

	.subtitle {
		font-size: 1.25rem;
		margin: 0;
		color: #555;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.stat-card {
		border: 3px solid transparent;
		padding: 1.5rem;
		background: transparent;
		position: relative;
		z-index: 1;
	}

	.stat-card::before {
		content: '';
		position: absolute;
		top: -3px;
		left: -3px;
		right: -3px;
		bottom: -3px;
		background: #fff;
		border: 3px solid #111;
		z-index: -1;
	}

	.stat-card::after {
		content: '';
		position: absolute;
		top: 6px;
		left: 6px;
		right: -9px;
		bottom: -9px;
		background: #1db954;
		z-index: -2;
		border: 3px solid #111;
	}

	.stat-card h3 {
		margin: 0 0 1rem 0;
		font-weight: 800;
		text-transform: uppercase;
		font-size: 1.2rem;
		background: #111;
		color: #fff;
		display: inline-block;
		padding: 0.25rem 0.5rem;
	}

	.fact-text {
		font-size: 1.1rem;
		line-height: 1.5;
		margin: 0;
	}

	.fact-text strong {
		color: #1db954;
		text-transform: uppercase;
	}

	.month-genres {
		margin-bottom: 0.75rem;
		font-size: 1rem;
		display: flex;
	}

	.month-label {
		text-transform: uppercase;
		font-weight: 800;
		width: 80px;
		color: #1db954;
	}

	.genre-list {
		font-family: monospace;
	}

	.graph-wrapper {
		position: relative;
		border: 3px solid transparent;
		background: transparent;
		cursor: crosshair;
		z-index: 1;
	}

	.graph-wrapper::before {
		content: '';
		position: absolute;
		top: -3px;
		left: -3px;
		right: -3px;
		bottom: -3px;
		background: #fff;
		border: 3px solid #111;
		z-index: -1;
	}

	.graph-wrapper::after {
		content: '';
		position: absolute;
		top: 8px;
		left: 8px;
		right: -11px;
		bottom: -11px;
		background: #1db954;
		z-index: -2;
		border: 3px solid #111;
		pointer-events: none;
	}

	svg {
		display: block;
	}

	.axis text {
		font-family: monospace;
		font-size: 12px;
		fill: #111;
	}

	.data-line {
		fill: none;
		stroke: #1db954;
		stroke-width: 4;
	}

	.crosshair {
		stroke: #111;
		stroke-width: 1;
		stroke-dasharray: 4 4;
	}

	.data-point {
		fill: #1db954;
		stroke: #111;
		stroke-width: 2;
	}

	.hover-panel {
		position: absolute;
		background: #fff;
		border: 2px solid #111;
		padding: 1rem;
		pointer-events: none;
		transform: translate(-50%, -110%);
		min-width: 220px;
		box-shadow: 6px 6px 0 rgba(29, 185, 84, 0.2);
		z-index: 10;
	}

	.hover-panel::before {
		content: '';
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-top: 10px solid #111;
	}

	.hover-date {
		font-weight: 800;
		font-size: 1.1rem;
		text-transform: uppercase;
		margin-bottom: 0.25rem;
	}

	.hover-bpm {
		font-family: monospace;
		font-size: 1.2rem;
		margin-bottom: 1rem;
		border-bottom: 2px solid #111;
		padding-bottom: 0.5rem;
	}

	.hover-bpm strong {
		color: #1db954;
		font-size: 1.4rem;
	}

	.track-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		font-weight: 700;
		letter-spacing: 1px;
		color: #555;
	}

	.track-name {
		font-weight: 800;
		font-size: 1rem;
		margin: 0.25rem 0;
	}

	.track-artist {
		font-size: 0.9rem;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.click-hint {
		font-size: 0.75rem;
		font-family: monospace;
		background: #1db954;
		color: #fff;
		padding: 0.25rem 0.5rem;
		display: inline-block;
		font-weight: 600;
		margin-top: 0.25rem;
	}

	.click-hint.no-audio {
		background: #eee;
		color: #888;
	}

	section h2 {
		font-size: 2rem;
		font-weight: 900;
		text-transform: uppercase;
		margin: 4rem 0 1.5rem 0;
		border-bottom: 4px solid #111;
		padding-bottom: 0.5rem;
	}

	.tracks-list,
	.days-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.track-card,
	.day-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 3px solid transparent;
		padding: 1rem 1.5rem;
		background: transparent;
		position: relative;
		z-index: 1;
		transition: transform 0.2s;
	}

	.track-card::before,
	.day-card::before {
		content: '';
		position: absolute;
		top: -3px;
		left: -3px;
		right: -3px;
		bottom: -3px;
		background: #fff;
		border: 3px solid #111;
		z-index: -1;
	}

	.track-card:hover,
	.day-card:hover {
		transform: translate(-4px, -4px);
	}

	.track-card::after,
	.day-card::after {
		content: '';
		position: absolute;
		top: 6px;
		left: 6px;
		right: -9px;
		bottom: -9px;
		background: #1db954;
		z-index: -2;
		border: 3px solid #111;
		transition: all 0.2s;
	}

	.track-card:hover::after,
	.day-card:hover::after {
		top: 10px;
		left: 10px;
		right: -13px;
		bottom: -13px;
	}

	.track-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.track-name,
	.day-date {
		font-size: 1.25rem;
		font-weight: 800;
	}

	.track-artist {
		font-size: 1rem;
		color: #555;
		font-weight: 600;
	}

	.track-bpm,
	.day-minutes {
		font-family: monospace;
		font-size: 1.5rem;
		font-weight: bold;
		color: #1db954;
		text-shadow:
			1px 1px 0 #111,
			-1px -1px 0 #111,
			1px -1px 0 #111,
			-1px 1px 0 #111;
		margin: 0 1.5rem;
		white-space: nowrap;
	}

	.preview-btn {
		background: #111;
		color: #fff;
		border: 2px solid #111;
		padding: 0.5rem 1rem;
		font-weight: 800;
		text-transform: uppercase;
		cursor: pointer;
		font-family: 'Inter', sans-serif;
	}

	.preview-btn:hover {
		background: #1db954;
		color: #111;
	}

	.preview-btn.disabled {
		background: #ccc;
		color: #888;
		cursor: not-allowed;
		border-color: #888;
	}

	.preview-btn.disabled:hover {
		background: #ccc;
		color: #888;
	}
</style>
