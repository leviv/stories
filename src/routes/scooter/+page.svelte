<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import { storySentences } from '$lib/scooter/config';

	let gameState: 'LOADING' | 'INTRO' | 'PLAYING' | 'GAME_OVER' | 'STORY_PAUSE' = 'LOADING';
	let loadingProgress = 0;

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

	// Intro animation
	let introScooterIndex = 1;
	let introInterval: any;

	// Story
	let currentStoryIndex = -1;

	let gameLoop: number;
	let lastTime = 0;
	let timeSinceLastSpawn = 0;
	let storyPauseTime = 0;

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
		// Start slow, gradually increase spawn rate as progress increases
		const currentSpawnInterval = Math.max(0.15, 0.8 - progress * 0.015);
		const maxScooters = 15 + progress * 1.5;
		if (timeSinceLastSpawn > currentSpawnInterval && scooters.length < maxScooters) {
			timeSinceLastSpawn = 0;
			spawnScooter();
		}

		// Horizon spawn (guarantees traffic always exists far ahead of the player)
		let maxForwardLane =
			scooters.length > 0 ? Math.max(...scooters.map((s) => s.y_lane)) : progress + 5;
		while (maxForwardLane < progress + 40) {
			// Larger gaps between scooters at the beginning
			const maxGap = Math.max(2, 6 - Math.floor(progress / 10));
			maxForwardLane += 1 + Math.floor(Math.random() * maxGap);
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
			if (performance.now() - storyPauseTime > 1000) {
				if (
					e.key.toLowerCase() === 'w' ||
					e.key === 'ArrowUp' ||
					e.key === ' ' ||
					e.key === 'Enter'
				) {
					gameState = 'PLAYING';
				}
			}
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
				storyPauseTime = performance.now();
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

	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length > 0) {
			touchStartX = e.touches[0].clientX;
			touchStartY = e.touches[0].clientY;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (gameState === 'PLAYING' || gameState === 'STORY_PAUSE') {
			// Prevent scrolling while playing
			e.preventDefault();
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (gameState === 'STORY_PAUSE') {
			if (performance.now() - storyPauseTime > 1000) {
				gameState = 'PLAYING';
			}
			return;
		}

		if (gameState !== 'PLAYING') {
			return;
		}

		if (e.changedTouches.length > 0) {
			const touchEndX = e.changedTouches[0].clientX;
			const touchEndY = e.changedTouches[0].clientY;

			const dx = touchEndX - touchStartX;
			const dy = touchEndY - touchStartY;
			const absDx = Math.abs(dx);
			const absDy = Math.abs(dy);

			const swipeThreshold = 30; // pixels

			if (absDx < swipeThreshold && absDy < swipeThreshold) {
				// Tap -> Forward
				progress++;
				if (progress % 10 === 0 && currentStoryIndex < storySentences.length - 1) {
					currentStoryIndex++;
					gameState = 'STORY_PAUSE';
					storyPauseTime = performance.now();
				}
				triggerWalk();
			} else {
				// Swipe
				if (absDx > absDy) {
					// Horizontal swipe
					if (dx > 0) {
						// Swipe right
						if (playerLane < 2) {
							playerLane++;
						}
						facingDirection = 1;
						triggerWalk();
					} else {
						// Swipe left
						if (playerLane > -2) {
							playerLane--;
						}
						facingDirection = -1;
						triggerWalk();
					}
				} else {
					// Vertical swipe
					if (dy > 0) {
						// Swipe down -> crouch
						if (!isJumping && !isCrouching) {
							isCrouching = true;
							playerState = 'crouch';
							setTimeout(() => {
								isCrouching = false;
								if (!isJumping) {
									playerState = 'idle';
								}
							}, 1000);
						}
					} else {
						// Swipe up -> jump
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

	let isTouchDevice = false;

	onMount(() => {
		if (typeof window !== 'undefined') {
			const imageUrls = [
				...Array.from({ length: 20 }, (_, i) => `${base}/scooter/scooter/scooter${i + 1}.png`),
				`${base}/scooter/wallking/idle.png`,
				`${base}/scooter/wallking/walk1.png`,
				`${base}/scooter/wallking/walk2.png`,
				`${base}/scooter/wallking/jump.png`,
				`${base}/scooter/wallking/crouch.png`,
				`${base}/shanghai_skyline.png`
			];

			let loaded = 0;
			imageUrls.forEach((url) => {
				const img = new Image();
				img.onload = img.onerror = () => {
					loaded++;
					loadingProgress = Math.round((loaded / imageUrls.length) * 100);
					if (loaded === imageUrls.length) {
						gameState = 'INTRO';
					}
				};
				img.src = url;
			});

			isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

			window.addEventListener('keydown', handleKeydown);
			window.addEventListener('keyup', handleKeyup);
			if (isTouchDevice) {
				window.addEventListener('touchstart', handleTouchStart, { passive: false });
				window.addEventListener('touchmove', handleTouchMove, { passive: false });
				window.addEventListener('touchend', handleTouchEnd, { passive: false });
			}
			const stored = localStorage.getItem('scooterTopScore');
			if (stored) {
				topScore = parseInt(stored, 10);
			}
			introInterval = setInterval(() => {
				if (gameState === 'INTRO') {
					introScooterIndex = (introScooterIndex % 20) + 1;
				}
			}, 100);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('keyup', handleKeyup);
			if (isTouchDevice) {
				window.removeEventListener('touchstart', handleTouchStart);
				window.removeEventListener('touchmove', handleTouchMove);
				window.removeEventListener('touchend', handleTouchEnd);
			}
		}
		if (gameLoop) {
			cancelAnimationFrame(gameLoop);
		}
		if (introInterval) {
			clearInterval(introInterval);
		}
	});
</script>

<svelte:head>
	<title>Scooter Sprint</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="viewport">
	<div class="skyline" style="background-image: url('{base}/shanghai_skyline.png')"></div>

	<div class="road-perspective-wrapper">
		<div class="road-visual" style="background-position: 0px calc(100% + {progress * 150}px)"></div>
		<div class="game-container">
			<!-- Active Lane Highlight Removed -->

			<!-- Scooters -->
			{#if gameState === 'PLAYING' || gameState === 'GAME_OVER' || gameState === 'STORY_PAUSE'}
				{#each scooters as s (s.id)}
					<img
						id={`scooter-${s.id}`}
						class="scooter"
						src={`${base}/scooter/scooter/scooter${s.type}.png`}
						alt="Scooter"
						style="
					left: calc(50% + {s.x * 20}%);
					bottom: calc(5% + {(s.y_lane - progress) * 150}px + 47px);
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
					src={`${base}/scooter/wallking/${playerState}.png`}
					alt="Player"
					style="
				  left: calc(50% + {playerLane * 20}%);
				  bottom: calc(5% - 31px);
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
			<div class="score-outer">
				<div class="score-inner">
					<div class="score-label">得分 SCORE</div>
					<div class="score-val">{progress}</div>
					<div class="top-val">最高 / TOP: {topScore}</div>
				</div>
			</div>
		</div>

		<div class="controls-hint" in:fade={{ delay: 1000, duration: 1000 }} out:fade>
			{isTouchDevice
				? 'Tap to Go Forward • Swipe to Move/Jump'
				: 'WASD/Arrows to Move • Space to Jump'}
		</div>
	{/if}

	<!-- Overlays -->
	{#if gameState === 'LOADING'}
		<div class="overlay" transition:fade={{ duration: 300 }}>
			<div class="content">
				<h1>Loading...<br /><span class="subtitle-cn">加载中</span></h1>
				<p>Loading Assets: {loadingProgress}%</p>
			</div>
		</div>
	{/if}

	{#if gameState === 'INTRO'}
		<div class="overlay" transition:fade={{ duration: 300 }}>
			<div class="content">
				<h1>Scooter Sprint<br /><span class="subtitle-cn">踏板车游戏</span></h1>
				<div class="intro-scooter-container">
					<img
						class="intro-scooter"
						src={`${base}/scooter/scooter/scooter${introScooterIndex}.png`}
						alt="Scooter Preview"
					/>
				</div>
				<p>Survive the streets of Shanghai</p>
				<button on:click={startGame}>Play Now / 开始</button>
			</div>
		</div>
	{/if}

	{#if gameState === 'STORY_PAUSE'}
		<div class="overlay" transition:fade={{ duration: 300 }}>
			<div class="content story-content">
				<p class="story-text">{storySentences[currentStoryIndex]}</p>
				<button
					on:click={() => {
						gameState = 'PLAYING';
					}}>Continue / 继续</button
				>
			</div>
		</div>
	{/if}

	{#if gameState === 'GAME_OVER'}
		<div class="overlay" transition:fade={{ duration: 500 }}>
			<div class="content game-over-content">
				<h1>Game Over<br /><span class="subtitle-cn">游戏结束</span></h1>
				<p>You made it <strong>{progress}</strong> steps.</p>
				{#if progress >= topScore && progress > 0}
					<div class="new-record">New Record! / 新纪录!</div>
				{/if}
				<button on:click={() => (gameState = 'INTRO')}>Try Again / 再试一次</button>
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
		touch-action: none;
	}

	.skyline {
		width: 100%;
		height: 30vh;
		flex-shrink: 0;
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
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect x='0' y='72' width='80' height='6' fill='%23eab308'/%3E%3C/svg%3E");
		background-size: 150px 150px;
		background-repeat: repeat;
		background-color: #4b5563;
		transition: background-position 0.15s cubic-bezier(0.4, 0, 0.2, 1);
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
		background: #0050b3;
		border: 4px solid white;
		border-radius: 12px;
		box-shadow: 0 0 0 8px #0050b3;
		padding: 3rem 4rem;
		text-align: center;
		color: white;
		max-width: 80%;
		margin: 16px;
	}

	.game-over-content {
		transform: scale(1);
	}

	h1 {
		font-size: 3.5rem;
		margin: 0 0 1rem 0;
		color: white;
		font-weight: 800;
	}

	.subtitle-cn {
		font-size: 1.5rem;
		font-weight: 500;
		opacity: 0.9;
		display: block;
		margin-top: 0.25rem;
	}

	p {
		font-size: 1.25rem;
		margin-bottom: 2.5rem;
		color: #e0f2fe;
		line-height: 1.6;
	}

	button {
		background: white;
		color: #0050b3;
		border: 2px solid white;
		border-radius: 8px;
		padding: 1.25rem 3rem;
		font-size: 1.25rem;
		font-weight: 800;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	button:hover {
		background: #f1f5f9;
		transform: scale(1.05);
	}

	button:active {
		background: #e2e8f0;
		transform: scale(0.95);
	}

	.intro-scooter-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 150px;
		margin-bottom: 2rem;
	}

	.intro-scooter {
		height: 100%;
		width: auto;
		object-fit: contain;
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
		padding: 2rem;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		pointer-events: none;
		z-index: 40;
		box-sizing: border-box;
	}

	.score-outer {
		background: #111;
		padding: 6px;
		clip-path: polygon(
			25px 0%,
			calc(100% - 25px) 0%,
			100% 50%,
			calc(100% - 25px) 100%,
			25px 100%,
			0% 50%
		);
		display: inline-flex;
	}

	.score-inner {
		background: #f8fafc;
		clip-path: polygon(
			21px 0%,
			calc(100% - 21px) 0%,
			100% 50%,
			calc(100% - 21px) 100%,
			21px 100%,
			0% 50%
		);
		padding: 0.75rem 3.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 180px;
	}

	.score-label {
		font-size: 0.85rem;
		color: #111;
		font-weight: 800;
		margin-bottom: 0.25rem;
		letter-spacing: 2px;
	}

	.score-val {
		font-size: 3rem;
		font-weight: 800;
		color: #111;
		line-height: 1;
	}

	.top-val {
		font-size: 0.85rem;
		color: #333;
		margin-top: 0.25rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.story-text {
		font-size: 2rem;
		font-weight: 700;
		color: white;
		line-height: 1.4;
		margin-bottom: 2rem;
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
		text-align: center;
		z-index: 30;
		letter-spacing: 0.5px;
	}
</style>
