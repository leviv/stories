<script lang="ts">
	import { scaleTime, scaleLinear } from 'd3-scale';
	import { line, curveMonotoneX } from 'd3-shape';
	import bpmDataRaw from '$lib/bpm/bpm_data.json';
	import { onMount } from 'svelte';
	import firstDayImg from '$lib/bpm/first_day.png';
	import ipoImg from '$lib/bpm/ipo.png';
	import finalPresentationImg from '$lib/bpm/final_presentation.png';

	type TopTrack = {
		name: string;
		artist: string;
		spotifyUri: string | null;
		bpm: number;
		playCount?: number;
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
		pause: () => void;
		seek: (seconds: number) => void;
		togglePlay: () => void;
		addListener: (
			event: string,
			callback: (e: {
				data: { position: number; duration: number; isPaused: boolean; isBuffering: boolean };
			}) => void
		) => void;
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
	let hoveredGraph = $state<boolean>(false);
	let spotifyPlayer = $state<SpotifyEmbedController | null>(null);
	let currentSpotifyUri = $state<string | null>(null);

	let progressJune = $state(0);
	let progressJuly = $state(0);
	let progressAug = $state(0);

	const playingState = $state<Record<string, boolean>>({
		'embed-june': false,
		'embed-july': false,
		'embed-aug': false
	});

	let mouseX = $state(0);
	let mouseY = $state(0);
	let hoveredHero = $state<string | null>(null);
	let hoveredImage = $state<string | null>(null);
	let isGlobalPlaying = $state(false);
	let hoveredTrackUri = $state<string | null>(null);

	const imgExpanded = $state({
		june: false,
		july: false,
		aug: false
	});

	const showHoverCursor = $derived(
		hoveredHero ||
			hoveredImage ||
			(hoveredGraph && hoveredData && hoveredData.topTrack.spotifyUri) ||
			hoveredTrackUri
	);

	const showPauseIcon = $derived(
		(hoveredHero && playingState[hoveredHero]) ||
			(hoveredTrackUri && currentSpotifyUri === hoveredTrackUri && isGlobalPlaying) ||
			(hoveredGraph &&
				hoveredData &&
				currentSpotifyUri === hoveredData.topTrack.spotifyUri &&
				isGlobalPlaying)
	);

	const heroControllers: Record<string, SpotifyEmbedController> = {};

	function handleHeroClick(id: string) {
		let uri = '';
		if (id === 'embed-june') {
			uri = 'spotify:track:5LWazXYOx5t8R5EPFuROfL';
		} else if (id === 'embed-july') {
			uri = 'spotify:track:50i1ZQ8G29AU7VSS7ExEi3';
		} else if (id === 'embed-aug') {
			uri = 'spotify:track:0uFV4VWZYMSt2IAXbWwg4y';
		}

		if (uri) {
			playSpotifyUri(uri);
		}
	}

	onMount(() => {
		const win = window as Window & {
			onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
			_spotifyIframeApi?: SpotifyIframeApi;
		};

		const initSpotify = (IFrameAPI: SpotifyIframeApi) => {
			const element = document.getElementById('spotify-embed-iframe');
			if (element) {
				const options = {
					width: '100%',
					height: '80',
					uri: dailyData[0].topTrack.spotifyUri || 'spotify:track:3n3Ppam7vgaBg1s4vP9zZA'
				};
				const callback = (EmbedController: SpotifyEmbedController) => {
					spotifyPlayer = EmbedController;
					spotifyPlayer.addListener('playback_update', (e) => {
						isGlobalPlaying = !e.data.isPaused;

						// Reset all hero states
						playingState['embed-june'] = false;
						playingState['embed-july'] = false;
						playingState['embed-aug'] = false;

						if (currentSpotifyUri === 'spotify:track:5LWazXYOx5t8R5EPFuROfL') {
							playingState['embed-june'] = isGlobalPlaying;
							if (e.data.duration > 0) {
								progressJune = e.data.position / e.data.duration;
							}
						} else if (currentSpotifyUri === 'spotify:track:50i1ZQ8G29AU7VSS7ExEi3') {
							playingState['embed-july'] = isGlobalPlaying;
							if (e.data.duration > 0) {
								progressJuly = e.data.position / e.data.duration;
							}
						} else if (currentSpotifyUri === 'spotify:track:0uFV4VWZYMSt2IAXbWwg4y') {
							playingState['embed-aug'] = isGlobalPlaying;
							if (e.data.duration > 0) {
								progressAug = e.data.position / e.data.duration;
							}
						}
					});
				};
				IFrameAPI.createController(element, options, callback);
			}

			const createHeroPlayer = (id: string, uri: string) => {
				const el = document.getElementById(id);
				if (!el) {
					return;
				}
				IFrameAPI.createController(el, { width: '100%', height: '152', uri }, (controller) => {
					heroControllers[id] = controller;
				});
			};

			createHeroPlayer('embed-june', 'spotify:track:5LWazXYOx5t8R5EPFuROfL');
			createHeroPlayer('embed-july', 'spotify:track:50i1ZQ8G29AU7VSS7ExEi3');
			createHeroPlayer('embed-aug', 'spotify:track:0uFV4VWZYMSt2IAXbWwg4y');
		};

		if (win._spotifyIframeApi) {
			initSpotify(win._spotifyIframeApi);
		} else {
			win.onSpotifyIframeApiReady = (IFrameAPI) => {
				win._spotifyIframeApi = IFrameAPI;
				initSpotify(IFrameAPI);
			};

			if (!document.getElementById('spotify-iframe-api-script')) {
				const script = document.createElement('script');
				script.id = 'spotify-iframe-api-script';
				script.src = 'https://open.spotify.com/embed/iframe-api/v1';
				script.async = true;
				document.body.appendChild(script);
			}
		}
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
		{ name: '6am - 12pm EST', val: tod.morning || 0 },
		{ name: '12pm - 5pm EST', val: tod.afternoon || 0 },
		{ name: '5pm - 9pm EST', val: tod.evening || 0 },
		{ name: '9pm - 6am EST', val: tod.night || 0 }
	];
	times.sort((a, b) => b.val - a.val);
	const busiestTime = times[0].name;

	// Pre-calculated from full Spotify export data to ensure accuracy
	const monthlyArtists = {
		June: ['PinkPantheress', 'Porter Robinson', 'Hydraa'],
		July: ['xaev', 'PinkPantheress', 'TWICE'],
		August: ['xaev', 'gingus', 'NewJeans']
	};
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window
	onmousemove={(e) => {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}}
	onkeydown={(e) => {
		if (
			e.key === ' ' &&
			e.target instanceof HTMLElement &&
			e.target.tagName !== 'INPUT' &&
			e.target.tagName !== 'TEXTAREA'
		) {
			e.preventDefault();
			if (spotifyPlayer) {
				spotifyPlayer.togglePlay();
			}
		}
	}}
/>

<div class="bpm-page">
	{#if showHoverCursor}
		<div class="hero-hover-cursor playful-font" style="left: {mouseX}px; top: {mouseY}px;">
			{#if hoveredImage}
				{#if imgExpanded[hoveredImage as keyof typeof imgExpanded]}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						style="margin-left: 4px;"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" /></svg
					>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="32"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
						style="margin-left: 4px;"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg
					>
				{/if}
			{:else if showPauseIcon}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
					><rect x="6" y="4" width="4" height="16" rx="2"></rect><rect
						x="14"
						y="4"
						width="4"
						height="16"
						rx="2"
					></rect></svg
				>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
					style="margin-left: 4px;"
					><path
						d="M6 3.5C5.2 3 4.5 3.5 4.5 4.5V19.5C4.5 20.5 5.2 21 6 20.5L18.5 13C19.2 12.5 19.2 11.5 18.5 11L6 3.5Z"
					></path></svg
				>
			{/if}
		</div>
	{/if}

	<div class="container title-container">
		<header class="header">
			<h1>The summer I accidentally discovered Dariacore and Hyperpop</h1>
		</header>
	</div>

	<div class="hero-sections-container">
		<!-- Section 1: June -->
		<section
			class="hero-section hero-bg-white"
			data-embed-id="embed-june"
			role="button"
			tabindex="0"
			onmouseenter={() => (hoveredHero = 'embed-june')}
			onmouseleave={() => (hoveredHero = null)}
			onclick={() => handleHeroClick('embed-june')}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					handleHeroClick('embed-june');
				}
			}}
		>
			<div class="progress-divider-container">
				<div class="progress-divider-fill" style="width: calc({progressJune} * 100%)"></div>
			</div>
			<div class="hero-text playful-font">
				<div class="hero-image-container">
					<button
						class="hero-image-wrapper {imgExpanded.june ? 'expanded' : ''}"
						onmouseenter={() => (hoveredImage = 'june')}
						onmouseleave={() => (hoveredImage = null)}
						onclick={(e) => {
							e.stopPropagation();
							imgExpanded.june = !imgExpanded.june;
						}}
					>
						<img src={firstDayImg} alt="First day" class="hero-image" />
					</button>
					<div class="image-caption {imgExpanded.june ? 'expanded' : ''}">
						July 8 - First day of 17th grade
					</div>
				</div>
				<p>
					Before I started grad school I was an average Spotify user. I listened to a mix of mostly
					pop, rap, and electronic music while scrolling reels on the subway or reviewing code at my
					desk.
				</p>
				<p>
					But on <em>July 8 2025</em> I started a full courseload summer semester at NYU while still working
					full time. I didn't know it at the time, but I had just started the busiest six weeks of my
					life.
				</p>
			</div>
			<div class="hero-column inline-player-container">
				<div class="stat-card">
					<div class="iframe-click-shield"></div>
					<div class="playful-title">Most Played: June 1 - 15, 2025</div>
					<div id="embed-june"></div>
				</div>

				<div class="top-days-section">
					<h2>Top Artists</h2>
					<div class="artists-list">
						{#each Object.entries(monthlyArtists) as [month, artists] (month)}
							<div class="month-genres">
								<span class="month-label">{month}:</span>
								<span class="genre-list">{artists.join(', ')}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<!-- Section 2: July -->
		<section
			class="hero-section hero-bg-white"
			data-embed-id="embed-july"
			role="button"
			tabindex="0"
			onmouseenter={() => (hoveredHero = 'embed-july')}
			onmouseleave={() => (hoveredHero = null)}
			onclick={() => handleHeroClick('embed-july')}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					handleHeroClick('embed-july');
				}
			}}
		>
			<div class="progress-divider-container">
				<div class="progress-divider-fill" style="width: calc({progressJuly} * 100%)"></div>
			</div>
			<div class="hero-text playful-font">
				<div class="hero-image-container">
					<button
						class="hero-image-wrapper {imgExpanded.july ? 'expanded' : ''}"
						onmouseenter={() => (hoveredImage = 'july')}
						onmouseleave={() => (hoveredImage = null)}
						onclick={(e) => {
							e.stopPropagation();
							imgExpanded.july = !imgExpanded.july;
						}}
					>
						<img src={ipoImg} alt="IPO" class="hero-image" />
					</button>
					<div class="image-caption {imgExpanded.july ? 'expanded' : ''}">
						July 31 - From school to work to wall street and back to school
					</div>
				</div>
				<p>
					Every weekday I had class 6 hours a day, and 8 hours of work, not to mention homework,
					gym, and eating. I replaced eight hours of sleep with $1 Lidl energy drinks, and rode an
					electric Citi bike recklessly through the city to shave a few minutes off my commute.
				</p>
				<p>
					And as my mind became more scattered and frantic, so did my music. I started craving
					faster beats, more sampled sound effects, and anything that could keep pace with my racing
					thoughts. In a way it felt that if I found songs that were even more chaotic than my own
					life, I could surf the wave of the chaos instead of drowning in it.
				</p>
			</div>
			<div class="hero-column inline-player-container">
				<div class="stat-card">
					<div class="iframe-click-shield"></div>
					<div class="playful-title">Most Played: July 8 - 15, 2025</div>
					<div id="embed-july"></div>
				</div>

				<div class="top-days-section">
					<h2>Fastest Time of Day</h2>
					<p class="fact-text">
						<strong>{busiestTime}</strong>
						were the most frantic. This is when the highest average BPM music was played.
					</p>
				</div>
			</div>
		</section>

		<!-- Section 3: August -->
		<section
			class="hero-section hero-bg-white"
			data-embed-id="embed-aug"
			role="button"
			tabindex="0"
			onmouseenter={() => (hoveredHero = 'embed-aug')}
			onmouseleave={() => (hoveredHero = null)}
			onclick={() => handleHeroClick('embed-aug')}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					handleHeroClick('embed-aug');
				}
			}}
		>
			<div class="progress-divider-container">
				<div class="progress-divider-fill" style="width: calc({progressAug} * 100%)"></div>
			</div>
			<div class="hero-text playful-font">
				<div class="hero-image-container">
					<button
						class="hero-image-wrapper {imgExpanded.aug ? 'expanded' : ''}"
						onmouseenter={() => (hoveredImage = 'aug')}
						onmouseleave={() => (hoveredImage = null)}
						onclick={(e) => {
							e.stopPropagation();
							imgExpanded.aug = !imgExpanded.aug;
						}}
					>
						<img src={finalPresentationImg} alt="Final presentation" class="hero-image" />
					</button>
					<div class="image-caption {imgExpanded.aug ? 'expanded' : ''}">
						August 13 - Souless eyes on the night of my summer exhibition
					</div>
				</div>
				<p>
					I hit the top of my own personal crescendo the week of August 10. You can see that all
					five of my top listening days that summer came from August 9-13, in the sleepless nights
					before our summer show. I stayed at school each night until the sun rose, only to head
					straight to work to clock in for an extremely ill-timed week of on-call.
				</p>
				<p>
					I worked to make <a href="https://leviv.cool/stuy-town">my installation</a> something I was
					proud of. I blasted music to keep myself awake while researching, fabricating and coding. And
					finally after everyone left the building I rode home with no sound in my headphones, and slept
					for 14 hours.
				</p>
			</div>
			<div class="hero-column inline-player-container">
				<div class="stat-card">
					<div class="iframe-click-shield"></div>
					<div class="playful-title">Most Played: Aug 12 - 14, 2025</div>
					<div id="embed-aug"></div>
				</div>

				<!-- Top Days Section -->
				<div class="top-days-section">
					<h2>Highest Listening days</h2>
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
				</div>
			</div>
		</section>
	</div>

	<div class="container">
		<p class="intro-explore">Explore the real data below</p>

		<main>
			<!-- Graph Container -->
			<div
				class="graph-wrapper"
				bind:clientWidth={width}
				onmouseenter={() => (hoveredGraph = true)}
				onmouseleave={() => (hoveredGraph = false)}
				role="region"
			>
				<svg
					{width}
					{height}
					tabindex="0"
					onmousemove={handleMousemove}
					onmouseleave={handleMouseleave}
					onclick={handleClick}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							handleClick();
						}
					}}
					role="button"
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
							<div class="track-label">Most played track</div>
							<div class="track-name">{hoveredData.topTrack.name}</div>
							<div class="track-artist">{hoveredData.topTrack.artist}</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Top BPM Tracks Section -->
			<section class="top-tracks-section">
				<h2>Highest BPM Tracks</h2>
				<div class="tracks-list">
					{#each bpmData.topBpmTracks as track (track.spotifyUri || track.name)}
						<div
							class="track-card"
							role="button"
							tabindex="0"
							onmouseenter={() => (hoveredTrackUri = track.spotifyUri)}
							onmouseleave={() => (hoveredTrackUri = null)}
							onclick={() => track.spotifyUri && playSpotifyUri(track.spotifyUri)}
							onkeydown={(e) => {
								if ((e.key === 'Enter' || e.key === ' ') && track.spotifyUri) {
									playSpotifyUri(track.spotifyUri);
								}
							}}
							style={track.spotifyUri ? 'cursor: none;' : ''}
						>
							<div class="track-info">
								<span class="track-name">{track.name}</span>
								<span class="track-artist">{track.artist}</span>
							</div>
							<div class="track-bpm">{Math.round(track.bpm)} BPM</div>
							{#if !track.spotifyUri}
								<button class="preview-btn disabled" disabled>N/A</button>
							{/if}
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

	<footer class="footer playful-font">
		<p>
			Made with &lt;3 by <a href="https://leviv.cool" target="_blank" rel="noopener noreferrer"
				>levi</a
			> in Shanghai
		</p>
		<p>&copy; 2026</p>
	</footer>
</div>

<style>
	.spotify-sticky-player {
		position: fixed;
		bottom: 20px;
		left: 20px;
		right: 20px;
		z-index: 1000;
	}

	.bpm-page {
		background-color: #fcfcfc;
		color: #111;
		font-family:
			'Inter',
			-apple-system,
			sans-serif;
		margin: 0;
		padding: 0;
		min-height: 100vh;
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0rem 2rem 2rem 2rem;
	}

	.title-container {
		padding: 2rem 2rem 0 2rem;
	}

	.header {
		margin-bottom: 1.5rem;
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

	.intro-explore {
		font-size: 1.5rem;
		font-weight: 800;
		margin: 2rem 0 4rem 0;
		color: #111;
		text-align: center;
		text-transform: uppercase;
		border-bottom: 4px dashed #111;
		padding-bottom: 2rem;
	}

	.hero-sections-container {
		display: flex;
		flex-direction: column;
		width: 100vw;
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
	}

	.hero-section {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 4rem;
		padding: 2rem 10vw;
		position: relative;
		overflow: hidden;
		cursor: none;
	}

	.hero-section:nth-child(even) {
		flex-direction: row-reverse;
	}

	.hero-section:nth-child(even) .hero-text {
		text-align: right;
	}

	.hero-section * {
		cursor: none;
	}

	.hero-hover-cursor {
		position: fixed;
		pointer-events: none;
		z-index: 9999;
		font-size: 4rem;
		font-weight: 900;
		color: #1db954;
		text-shadow: 3px 3px 0 #111;
		transform: translate(-50%, -50%);
		text-transform: uppercase;
	}

	.iframe-click-shield {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 100;
	}

	.progress-divider-container {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 1000px;
		max-width: calc(100vw - 4rem);
		height: 8px;
		background-color: #eee;
		border-radius: 4px;
		z-index: 10;
	}

	.progress-divider-fill {
		height: 100%;
		background-color: #1db954;
		border-radius: 4px;
		transition: width 0.1s linear;
	}

	.hero-bg-white {
		background-color: #ffffff;
	}

	.playful-font {
		font-family: 'Fredoka', 'Comic Sans MS', sans-serif;
	}

	.hero-text {
		flex: 1;
		font-size: 20px;
		line-height: 1.4;
		margin-bottom: 0;
		color: #111;
	}

	.hero-image-container {
		display: flex;
		flex-direction: column;
		margin-bottom: 1.5rem;
		align-items: flex-start;
	}

	.hero-section:nth-child(even) .hero-image-container {
		align-items: flex-end;
	}

	.hero-image-wrapper {
		position: relative;
		border: 3px solid transparent;
		background: transparent;
		cursor: none;
		z-index: 1;
		width: 100px;
		aspect-ratio: 1 / 1;
		padding: 0;
		transition: width 0.3s ease-in-out;
		display: block;
	}

	.hero-image-wrapper.expanded {
		width: 100%;
	}

	.hero-image-wrapper::before {
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

	.hero-image-wrapper::after {
		content: '';
		position: absolute;
		top: 6px;
		left: 6px;
		right: -9px;
		bottom: -9px;
		background: #1db954;
		z-index: -2;
		border: 3px solid #111;
		transition: all 0.3s ease-in-out;
	}

	.hero-image-wrapper.expanded::after {
		top: 12px;
		left: 12px;
		right: -15px;
		bottom: -15px;
	}

	.hero-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.image-caption {
		margin-top: 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: #555;
		text-align: left;
		opacity: 0;
		max-height: 0;
		overflow: hidden;
		transition:
			opacity 0.3s ease-in-out,
			max-height 0.3s ease-in-out,
			margin-top 0.3s ease-in-out;
	}

	.hero-section:nth-child(even) .image-caption {
		text-align: right;
	}

	.image-caption.expanded {
		opacity: 1;
		max-height: 50px;
		margin-top: 1.5rem;
	}

	.footer {
		max-width: 1000px;
		margin: 0 auto;
		text-align: left;
		padding: 2rem 2rem 8rem 2rem;
		font-size: 1.2rem;
		font-weight: 700;
		color: #111;
		border-top: 4px dashed #111;
		display: flex;
		justify-content: space-between;
	}

	.footer a {
		color: #1db954;
		text-decoration: none;
	}

	.footer a:hover {
		text-decoration: underline;
	}

	.hero-column {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.inline-player-container {
		flex: 0 0 350px;
		position: relative;
		z-index: 20;
	}

	.top-days-section h2 {
		margin-top: 0;
		font-size: 1.5rem;
	}

	.playful-title {
		font-weight: 800;
		font-size: 1.2rem;
		text-align: center;
		margin-bottom: 0.5rem;
		color: #111;
		background: #fff;
		padding: 0.25rem;
		border-radius: 4px;
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
		cursor: none;
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
	@media (max-width: 768px) {
		.hero-section,
		.hero-section:nth-child(even) {
			flex-direction: column;
			gap: 2rem;
			padding: 2rem 5vw;
		}

		.hero-section:nth-child(even) .hero-text,
		.hero-section:nth-child(even) .image-caption {
			text-align: left;
		}

		.hero-section:nth-child(even) .hero-image-container {
			align-items: flex-start;
		}

		.inline-player-container {
			flex: 0 0 auto;
			width: 100%;
		}
	}
</style>
