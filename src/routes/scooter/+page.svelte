<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';

	let gameState: 'INTRO' | 'PLAYING' | 'GAME_OVER' | 'STORY_PAUSE' = 'INTRO';

	// Player state
	let playerLane = 0; // -2 to 2 (5 lanes)
	let progress = 0;
	let topScore = 0;

	let playerState = 'idle'; // idle, walk1, walk2, jump, crouch
	let isJumping = false;
	let isCrouching = false;
	let facingDirection = 1;
	let nextWalkState = 'walk1';

	let playerScaleY = 1;
	$: {
		if (isCrouching) {
			playerScaleY = 0.6;
		} else if (isJumping) {
			playerScaleY = 1.15;
		} else {
			playerScaleY = 1;
		}
	}

	// Scooters
	interface Scooter {
		id: number;
		y_lane: number;
		x: number;
		speed: number;
		type: number;
		animationTime: number;
	}
	let scooters: Scooter[] = [];
	let scooterId = 0;

	// Story
	const storySentences = [
		'The city is loud, but your purpose is clear.',
		'A sea of scooters stands between you and your goal.',
		'Each step forward brings you closer to the truth.',
		'You remember why you started this journey.',
		"They said it couldn't be done, crossing this street.",
		'But you are not just anyone.',
		'The exhaust fumes smell like victory.',
		'Almost halfway there... or so you hope.',
		'The scooters are getting faster, more aggressive.',
		"Don't look back, only forward.",
		'The rhythm of the traffic is a deadly dance.',
		'Just a little further now.',
		"You can see the other side in your mind's eye.",
		'Almost there. Just a few more lanes.',
		'You found your truth.'
	];
	let currentStoryIndex = -1;

	let gameLoop: number;
	let lastTime = 0;
	let timeSinceLastSpawn = 0;

	function startGame() {
		gameState = 'PLAYING';
		progress = 0;
		playerLane = 0;
		scooters = [];
		currentStoryIndex = -1;
		isJumping = false;
		isCrouching = false;
		playerState = 'idle';
		lastTime = performance.now();
		timeSinceLastSpawn = 0;
		gameLoop = requestAnimationFrame(update);
	}

	function gameOver() {
		gameState = 'GAME_OVER';
		if (gameLoop) {
			cancelAnimationFrame(gameLoop);
		}
		if (progress > topScore) {
			topScore = progress;
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('scooterTopScore', topScore.toString());
			}
		}
	}

	function spawnScooter(spawn_y?: number, customStartX?: number) {
		let y = spawn_y ?? progress + Math.floor(Math.random() * 25) - 5;

		// At the beginning of the game, leave the first few rows empty
		if (progress < 3 && y <= 2) {
			y = 3 + Math.floor(Math.random() * 5);
		}
		const dir = Math.random() > 0.5 ? 1 : -1;
		const startX = customStartX ?? (dir === 1 ? -10 : 10);
		const baseSpeed = 0.5 + progress * 0.05;
		const s_speed = dir * (baseSpeed + Math.random() * 0.6);
		const s_type = Math.floor(Math.random() * 20) + 1;

		scooters.push({
			id: scooterId++,
			y_lane: y,
			x: startX,
			speed: s_speed,
			type: s_type,
			animationTime: Math.random() * Math.PI * 2
		});
	}

	function update() {
		const now = performance.now();
		const dt = (now - lastTime) / 1000;
		lastTime = now;

		if (gameState !== 'PLAYING') {
			// Keep animating bounces but pause game logic
			for (let i = 0; i < scooters.length; i++) {
				scooters[i].animationTime += dt * 8;
			}
			scooters = scooters;
			gameLoop = requestAnimationFrame(update);
			return;
		}

		timeSinceLastSpawn += dt;

		// Update scooters
		for (let i = 0; i < scooters.length; i++) {
			const s = scooters[i];
			s.x += s.speed * dt;
			s.animationTime += dt * 8; // speed of bouncing
		}

		// Clean up far behind or way offscreen
		scooters = scooters.filter((s) => s.y_lane >= progress - 5 && s.x > -15 && s.x < 15);

		// Continuous spawn (ambient traffic)
		if (timeSinceLastSpawn > 0.2) {
			timeSinceLastSpawn = 0;
			spawnScooter();
		}

		// Horizon spawn (guarantees traffic always exists far ahead of the player)
		let maxForwardLane =
			scooters.length > 0 ? Math.max(...scooters.map((s) => s.y_lane)) : progress + 5;
		while (maxForwardLane < progress + 40) {
			maxForwardLane += 1 + Math.floor(Math.random() * 2);
			spawnScooter(maxForwardLane);
		}

		// Collision detection
		if (!isJumping) {
			const playerEl = document.querySelector('.player');
			if (playerEl) {
				const pRect = playerEl.getBoundingClientRect();
				// Use smaller bounding box: half the width of the character
				const pWidth = pRect.width / 2;
				const pCenter = pRect.left + pRect.width / 2;
				const pLeft = pCenter - pWidth / 2;
				const pRight = pCenter + pWidth / 2;

				for (const s of scooters) {
					if (s.y_lane === progress) {
						const scooterEl = document.getElementById(`scooter-${s.id}`);
						if (scooterEl) {
							const sRect = scooterEl.getBoundingClientRect();

							// Use smaller bounding box: half the width of the scooter
							const sWidth = sRect.width / 2;
							const sCenter = sRect.left + sRect.width / 2;
							const sLeft = sCenter - sWidth / 2;
							const sRight = sCenter + sWidth / 2;

							if (
								pLeft < sRight &&
								pRight > sLeft &&
								pRect.top < sRect.bottom &&
								pRect.bottom > sRect.top
							) {
								gameOver();
								return;
							}
						}
					}
				}
			}
		}

		scooters = scooters; // trigger reactivity
		gameLoop = requestAnimationFrame(update);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (gameState === 'STORY_PAUSE') {
			e.preventDefault();
			gameState = 'PLAYING';
			return;
		}

		if (gameState !== 'PLAYING') {
			return;
		}

		// Prevent default scrolling for game keys
		if (
			['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)
		) {
			e.preventDefault();
		}

		if (e.repeat) {
			return;
		} // Prevent holding down to move infinitely fast

		if (e.key === 'w' || e.key === 'ArrowUp') {
			progress++;
			if (progress % 10 === 0 && currentStoryIndex < storySentences.length - 1) {
				currentStoryIndex++;
				gameState = 'STORY_PAUSE';
			}
			triggerWalk();
		} else if (
			e.key === 's' ||
			e.key === 'ArrowDown' ||
			e.key === 'Shift' ||
			e.key === 'Control' ||
			e.key.toLowerCase() === 'c'
		) {
			if (!isJumping && !isCrouching) {
				isCrouching = true;
				playerState = 'crouch';
			}
		} else if (e.key === 'a' || e.key === 'ArrowLeft') {
			if (playerLane > -2) {
				playerLane--;
			}
			facingDirection = -1;
			triggerWalk();
		} else if (e.key === 'd' || e.key === 'ArrowRight') {
			if (playerLane < 2) {
				playerLane++;
			}
			facingDirection = 1;
			triggerWalk();
		} else if (e.key === ' ') {
			if (!isJumping && !isCrouching) {
				isJumping = true;
				playerState = 'jump';
				setTimeout(() => {
					isJumping = false;
					if (!isCrouching) {
						playerState = 'idle';
					}
				}, 1000);
			}
		}
	}

	function handleKeyup(e: KeyboardEvent) {
		if (gameState !== 'PLAYING') {
			return;
		}

		if (
			e.key === 's' ||
			e.key === 'ArrowDown' ||
			e.key === 'Shift' ||
			e.key === 'Control' ||
			e.key.toLowerCase() === 'c'
		) {
			if (isCrouching) {
				isCrouching = false;
				if (!isJumping) {
					playerState = 'idle';
				}
			}
		}
	}

	function triggerWalk() {
		if (isJumping || isCrouching) {
			return;
		}
		playerState = nextWalkState;
		nextWalkState = nextWalkState === 'walk1' ? 'walk2' : 'walk1';
		setTimeout(() => {
			if (!isJumping && !isCrouching && playerState.startsWith('walk')) {
				playerState = 'idle';
			}
		}, 200);
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeydown);
			window.addEventListener('keyup', handleKeyup);
			const stored = localStorage.getItem('scooterTopScore');
			if (stored) {
				topScore = parseInt(stored, 10);
			}
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('keyup', handleKeyup);
		}
		if (gameLoop) {
			cancelAnimationFrame(gameLoop);
		}
	});
</script>

<svelte:head>
	<title>Scooter Game</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="viewport">
	<div class="skyline"></div>

	<div class="road-perspective-wrapper">
		<div class="road-visual" style="background-position-y: {progress * 150}px"></div>
		<div class="game-container">
			<!-- Active Lane Highlight Removed -->

			<!-- Scooters -->
			{#if gameState === 'PLAYING' || gameState === 'GAME_OVER' || gameState === 'STORY_PAUSE'}
				{#each scooters as s (s.id)}
					<img
						id={`scooter-${s.id}`}
						class="scooter"
						src={`/scooter/scooter/scooter${s.type}.png`}
						alt="Scooter"
						style="
					left: calc(50% + {s.x * 20}%);
					bottom: calc(5% + {(s.y_lane - progress) * 150}px);
					transform: translateY({Math.sin(s.animationTime) * -20}px) 
							   rotateX(-40deg)
							   scaleX({(s.speed < 0 ? -1 : 1) * (1 + Math.cos(s.animationTime * 2) * 0.25)}) 
							   scaleY({1 - Math.sin(s.animationTime * 2) * 0.1});
				  "
					/>
				{/each}

				<!-- Player -->
				<img
					class="player"
					src={`/scooter/wallking/${playerState}.png`}
					alt="Player"
					style="
				  left: calc(50% + {playerLane * 20}%);
				  bottom: 5%;
				  transform: translateZ({isJumping ? '150px' : '0px'}) rotateX(-40deg) scaleX({facingDirection *
						(isJumping ? 1.15 : 1)}) scaleY({playerScaleY});
				"
				/>
			{/if}
		</div>
	</div>
	<!-- HUD -->
	{#if gameState === 'PLAYING'}
		<div class="hud">
			<div class="score-container">
				<div class="score-val">{progress}</div>
				<div class="top-val">Top: {topScore}</div>
			</div>
		</div>

		<div class="controls-hint" in:fade={{ delay: 1000, duration: 1000 }} out:fade>
			WASD/Arrows to Move • Space to Jump
		</div>
	{/if}

	<!-- Overlays -->
	{#if gameState === 'INTRO'}
		<div class="overlay" transition:fade={{ duration: 300 }}>
			<div class="content">
				<h1>Scooter Game</h1>
				<p>Dodge the bouncing scooters and find your truth in the city. One step at a time.</p>
				<button on:click={startGame}>Play Now</button>
			</div>
		</div>
	{/if}

	{#if gameState === 'STORY_PAUSE'}
		<div class="overlay" transition:fade={{ duration: 300 }}>
			<div class="content story-content">
				<p class="story-text">"{storySentences[currentStoryIndex]}"</p>
				<button
					on:click={() => {
						gameState = 'PLAYING';
					}}>Continue</button
				>
			</div>
		</div>
	{/if}

	{#if gameState === 'GAME_OVER'}
		<div class="overlay" transition:fade={{ duration: 500 }}>
			<div class="content game-over-content">
				<h1>Game Over</h1>
				<p>You made it <strong>{progress}</strong> steps.</p>
				{#if progress >= topScore && progress > 0}
					<div class="new-record">New Record!</div>
				{/if}
				<button on:click={startGame}>Try Again</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.viewport {
		width: 100%;
		height: 100vh;
		position: relative;
		overflow: hidden;
		background: #0f172a;
		display: flex;
		flex-direction: column;
		font-family: 'Inter', sans-serif;
	}

	.skyline {
		width: 100%;
		height: 30vh;
		flex-shrink: 0;
		background-image: url('/shanghai_skyline.png');
		background-size: cover;
		background-position: center bottom;
		z-index: 1;
	}

	.road-perspective-wrapper {
		width: 100%;
		flex: 1;
		margin-top: -5vh;
		position: relative;
		perspective: 800px;
		z-index: 2;
		overflow: hidden;
		-webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%);
		mask-image: linear-gradient(to bottom, transparent 0%, black 5%);
	}

	.road-visual {
		width: 300%;
		height: 200vh;
		position: absolute;
		bottom: 0;
		left: -100%;
		background-image:
			linear-gradient(
				to bottom,
				transparent 73px,
				rgba(255, 255, 0, 0.4) 73px,
				rgba(255, 255, 0, 0.4) 77px,
				transparent 77px
			),
			url('/scooter/road.png');
		background-size:
			100% 150px,
			33.33% 400px;
		background-repeat: repeat;
		background-color: #1e293b;
		transition: background-position-y 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		transform-origin: bottom center;
		transform: rotateX(40deg);
	}

	.game-container {
		width: 100%;
		height: 200vh;
		position: absolute;
		bottom: 0;
		left: 0;
		transform-origin: bottom center;
		transform: rotateX(40deg);
		transform-style: preserve-3d;
	}

	.overlay {
		position: absolute;
		inset: 0;
		background: rgba(15, 23, 42, 0.9);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 50;
	}

	.content {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 4rem 3rem;
		text-align: center;
		color: white;
		max-width: 80%;
	}

	.game-over-content {
		transform: scale(1);
	}

	h1 {
		font-size: 3.5rem;
		margin: 0 0 1rem 0;
		color: #38bdf8;
		font-weight: 800;
	}

	p {
		font-size: 1.25rem;
		margin-bottom: 2.5rem;
		color: #cbd5e1;
		line-height: 1.6;
	}

	button {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 1.25rem 3rem;
		font-size: 1.25rem;
		font-weight: 800;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	button:hover {
		background: #6366f1;
	}

	button:active {
		background: #4f46e5;
	}

	.new-record {
		font-size: 1.5rem;
		color: #fbbf24;
		font-weight: 800;
		margin-bottom: 1.5rem;
	}

	.hud {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		pointer-events: none;
		z-index: 40;
		box-sizing: border-box;
	}

	.score-container {
		background: rgba(15, 23, 42, 0.9);
		color: white;
		padding: 1rem 1.5rem;
		text-align: right;
		border-right: 4px solid #818cf8;
	}

	.story-text {
		font-size: 1.8rem;
		font-weight: 500;
		color: #38bdf8;
		font-style: italic;
		line-height: 1.4;
		margin-bottom: 2rem;
	}

	.score-val {
		font-size: 2.5rem;
		font-weight: 800;
		color: #38bdf8;
		line-height: 1;
	}

	.top-val {
		font-size: 0.9rem;
		color: #94a3b8;
		margin-top: 0.5rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.player {
		position: absolute;
		width: 240px;
		height: auto;
		margin-left: -120px;
		z-index: 20;
		transition:
			left 0.15s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform, left;
		transform-origin: bottom center;
	}

	.scooter {
		position: absolute;
		width: 240px;
		height: auto;
		margin-left: -120px;
		z-index: 10;
		transition: bottom 0.15s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform, left, bottom;
		transform-origin: bottom center;
	}

	.controls-hint {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.9);
		color: #cbd5e1;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		pointer-events: none;
		z-index: 30;
		letter-spacing: 0.5px;
	}
</style>
