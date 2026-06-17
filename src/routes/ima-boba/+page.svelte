<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import rawData from '$lib/ima-boba/data.csv?raw';
	import Matter from 'matter-js';

	// Parse CSV Data
	const lines = rawData.trim().split('\n');
	// Handle empty headers by generating unique names and strip quotes
	const headers = lines[0].split(',').map((h, i) => h.replace(/^"|"$/g, '').trim() || `Field${i}`);

	function parseLine(line: string) {
		const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
		const obj: any = {};
		headers.forEach((h, i) => {
			obj[h] = values[i] ? values[i].replace(/^"|"$/g, '').trim() : '';
		});
		return obj;
	}

	const rawStudents = lines.slice(1).map(parseLine);

	const students = rawStudents.map((s) => {
		let AgeBucket = 'Unknown Age';
		if (s.Age) {
			const age = parseInt(s.Age);
			if (age >= 18 && age < 24) {
				AgeBucket = '18-24';
			} else if (age >= 24 && age < 30) {
				AgeBucket = '24-30';
			} else if (age >= 30 && age <= 40) {
				AgeBucket = '30-40';
			} else if (age > 40) {
				AgeBucket = '40+';
			}
		}

		return {
			...s,
			Gender: s.Gender && s.Gender !== 'NA' ? s.Gender : 'Other',
			AgeBucket,
			Nationalities: s.Nationality
				? s.Nationality.split(',').map((n: string) => n.trim())
				: ['Other'],
			MajorCategory: s.Major && s.Major !== 'NA' ? s.Major : 'Other',
			ArtType: s.ArtType && s.ArtType !== 'NA' ? s.ArtType : 'Other'
		};
	});

	// Derive unique options for dropdowns
	function sortWithOtherAtEnd(arr: string[]) {
		const sorted = arr.sort();
		const otherIndex = sorted.indexOf('Other');
		if (otherIndex !== -1) {
			sorted.splice(otherIndex, 1);
		}
		sorted.push('Other');
		return sorted;
	}

	const genders = sortWithOtherAtEnd([...new Set(students.map((s) => s.Gender))]);
	const ages = ['18-24', '24-30', '30-40', '40+'];

	const continents = sortWithOtherAtEnd([...new Set(students.flatMap((s) => s.Nationalities))]);

	const majors = sortWithOtherAtEnd([...new Set(students.map((s) => s.MajorCategory))]);
	const artTypes = sortWithOtherAtEnd([...new Set(students.map((s) => s.ArtType))]);

	// State
	let selectedGender = $state('');
	let selectedAge = $state('');
	let selectedContinent = $state('');
	let selectedMajor = $state('');
	let selectedArt = $state('');

	const filteredCount = $derived(
		students.filter((s) => {
			return (
				(selectedGender === '' || s.Gender === selectedGender) &&
				(selectedAge === '' || s.AgeBucket === selectedAge) &&
				(selectedContinent === '' || s.Nationalities.includes(selectedContinent)) &&
				(selectedMajor === '' || s.MajorCategory === selectedMajor) &&
				(selectedArt === '' || s.ArtType === selectedArt)
			);
		}).length
	);

	// Physics variables
	let canvasContainer: HTMLDivElement;
	let engine: Matter.Engine;
	let render: Matter.Render;
	let runner: Matter.Runner;
	let pearls: Matter.Body[] = [];
	let straw: Matter.Body;
	let lidProgress = 0;
	let lidClosing = false;
	let lidTimeout: any;
	let strawProgress = 1;
	let pearlsToDrop = 0;

	onMount(() => {
		const { Engine, Render, Runner, World, Bodies } = Matter;
		engine = Engine.create();

		render = Render.create({
			element: canvasContainer,
			engine,
			options: {
				width: 400,
				height: 600,
				wireframes: false,
				background: 'transparent'
			}
		});

		// Cup line art
		const cupOptions = {
			isStatic: true,
			render: {
				visible: false
			}
		};

		// Left wall, right wall, and bottom to form a cup
		const ground = Bodies.rectangle(200, 550, 180, 10, cupOptions);
		const leftWall = Bodies.rectangle(100, 350, 10, 400, cupOptions);
		const rightWall = Bodies.rectangle(300, 350, 10, 400, cupOptions);

		// Angle walls slightly for a cup shape
		Matter.Body.setAngle(leftWall, -0.06);
		Matter.Body.setAngle(rightWall, 0.06);

		// A pinkish straw
		straw = Bodies.rectangle(230, -310, 24, 480, {
			label: 'straw',
			isStatic: true,
			isSensor: true, // pearls fall through it
			chamfer: { radius: 10 },
			render: {
				fillStyle: '#ea92aa',
				strokeStyle: '#494441',
				lineWidth: 6
			}
		});
		Matter.Body.setAngle(straw, 0.15);

		// Add all static bodies
		World.add(engine.world, [ground, leftWall, rightWall, straw]);

		// Run engine
		Render.run(render);
		runner = Runner.create();
		Runner.run(runner, engine);

		// Lid closing animation logic
		Matter.Events.on(engine, 'afterUpdate', function () {
			if (strawProgress < 1) {
				strawProgress += 0.04;
				if (strawProgress >= 1) {
					strawProgress = 1;
					dropPearls(pearlsToDrop);
				}
				Matter.Body.setPosition(straw, {
					x: 230,
					y: -310 + 618 * strawProgress
				});
			} else {
				if (!lidClosing && pearls.length > 0) {
					let allInside = true;
					for (let i = 0; i < pearls.length; i++) {
						// Cup top is at y=150. Check if pearls have fallen below y=120
						if (pearls[i].position.y < 120) {
							allInside = false;
							break;
						}
					}
					if (allInside) {
						lidClosing = true;
					}
				} else if (!lidClosing && pearls.length === 0) {
					lidClosing = true;
				}

				if (lidClosing && lidProgress < 1) {
					lidProgress += 0.05;
					if (lidProgress > 1) {
						lidProgress = 1;
					}
				}
			}
		});

		// Custom render hook for cup outline and lid (drawn over bodies)
		Matter.Events.on(render, 'afterRender', function () {
			const context = render.context;

			// Draw cup outline
			context.save();
			context.beginPath();
			context.moveTo(93, 150);
			// Slightly rounded bottom-left corner
			context.arcTo(117, 545, 283, 545, 15);
			// Slightly rounded bottom-right corner
			context.arcTo(283, 545, 307, 150, 15);
			context.lineTo(307, 150);
			context.strokeStyle = '#494441';
			context.lineWidth = 18; // 6x thicker
			context.lineJoin = 'round';
			context.lineCap = 'round';
			context.stroke();
			context.restore();

			// Draw Lid
			if (lidProgress > 0) {
				context.save();

				const finalY = 150;
				const startY = -20; // Starts slightly above canvas
				const currentY = startY + (finalY - startY) * lidProgress;

				context.translate(200, currentY);

				const w = 250; // Slightly oversized on left and right
				context.beginPath();
				context.moveTo(-w / 2, 0);
				context.lineTo(w / 2, 0);

				// Add a subtle shadow to make the lid pop
				context.shadowColor = 'rgba(0, 0, 0, 0.15)';
				context.shadowBlur = 4;
				context.shadowOffsetY = 2;

				context.strokeStyle = '#494441';
				context.lineWidth = 18; // 6x thicker
				context.lineCap = 'round';
				context.stroke();
				context.restore();
			}
		});
	});

	onDestroy(() => {
		if (render) {
			Matter.Render.stop(render);
		}
		if (runner) {
			Matter.Runner.stop(runner);
		}
		if (engine) {
			Matter.Engine.clear(engine);
		}
	});

	// Reactively update pearls when filters change
	$effect(() => {
		if (engine) {
			updatePearls(filteredCount);
		}
	});

	function updatePearls(count: number) {
		lidProgress = 0;
		lidClosing = false;
		if (lidTimeout) {
			clearTimeout(lidTimeout);
		}

		strawProgress = 0; // restart straw drop
		pearlsToDrop = count;

		const { Composite } = Matter;
		// Remove existing pearls immediately
		Composite.remove(engine.world, pearls);
		pearls = [];
	}

	function dropPearls(count: number) {
		const { Bodies, World } = Matter;
		for (let i = 0; i < count; i++) {
			const p = Bodies.circle(
				200 + (Math.random() - 0.5) * 80, // random x start position inside cup bounds
				-50 - i * 45, // stagger height a bit more for larger balls
				16, // radius reduced to keep overall size similar with thicker stroke
				{
					restitution: 0.3,
					friction: 0.1,
					render: {
						fillStyle: '#7d6961', // stylized boba color
						strokeStyle: '#2b2624',
						lineWidth: 8 // doubled stroke width
					}
				}
			);
			pearls.push(p);
		}
		World.add(engine.world, pearls);

		// Fallback: close lid after a max timeout
		lidTimeout = setTimeout(() => {
			lidClosing = true;
		}, 3000);
	}
</script>

<svelte:head>
	<title>IMA Boba | Interactive Storytelling</title>
</svelte:head>

<div class="page">
	<div class="split-layout">
		<!-- Left Side: Sentence Form -->
		<div class="sentence-container">
			<p class="sentence">
				I am a
				<select bind:value={selectedGender}>
					<option value="">---</option>
					{#each genders as g (g)}
						<option value={g}>{g.toLowerCase()}</option>
					{/each}
				</select>
				of the age
				<select bind:value={selectedAge}>
					<option value="">---</option>
					{#each ages as a (a)}
						<option value={a}>{a}</option>
					{/each}
				</select>
				from
				<select bind:value={selectedContinent}>
					<option value="">---</option>
					{#each continents as c (c)}
						<option value={c}>{c}</option>
					{/each}
				</select>
				studying / studied
				<select bind:value={selectedMajor}>
					<option value="">---</option>
					{#each majors as m (m)}
						<option value={m}>{m}</option>
					{/each}
				</select>
				and I love working with
				<select bind:value={selectedArt}>
					<option value="">---</option>
					{#each artTypes as a (a)}
						<option value={a}>{a.toLowerCase()}</option>
					{/each}
				</select>
				.
			</p>

			<div class="stats">
				<span class="count">{filteredCount}</span>
				<span class="label">students match this description</span>
			</div>
		</div>

		<!-- Right Side: Boba Cup Canvas -->
		<div class="visualization-container" bind:this={canvasContainer}>
			<!-- Matter.js renders here -->
		</div>
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Junicode:wght@400;600;700&family=Open+Sans:wght@400;600;700&display=swap');

	.page {
		position: relative;
		min-height: 100vh;
		background: #eae3dd;
		color: #494441;
		font-family: 'Open Sans', sans-serif;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px;
		box-sizing: border-box;
		overflow: hidden; /* Avoid scroll on desktop */
	}

	.split-layout {
		display: flex;
		flex-direction: row;
		width: 100%;
		max-width: 1300px;
		gap: 60px;
		align-items: flex-start; /* Moved to top */
	}

	.sentence-container {
		flex: 1.2;
		display: flex;
		flex-direction: column;
		gap: 50px;
		max-width: 800px;
		margin-top: 20px; /* Add a bit of space from the very top */
	}

	.sentence {
		font-family: 'Junicode', serif;
		font-size: clamp(24px, 3.5vw, 48px);
		line-height: 1.6;
		margin: 0;
		font-weight: 600;
		color: #494441;
	}

	select {
		appearance: none;
		background: transparent;
		border: none;
		border-bottom: 3px dashed #494441;
		border-radius: 0;
		color: #494441;
		font-family: 'Junicode', serif;
		font-size: inherit;
		font-weight: 700;
		padding: 0 8px;
		margin: 0 4px;
		min-width: 60px;
		cursor: pointer;
		text-align: center;
		transition: all 0.3s ease;
		display: inline-block;
		text-transform: lowercase;
	}

	select:hover,
	select:focus {
		outline: none;
		border-bottom-style: solid;
		color: #1a1817;
		background: rgba(73, 68, 65, 0.05);
	}

	select option {
		font-family: 'Open Sans', sans-serif;
		font-size: 16px;
		background: #eae3dd;
		color: #494441;
		text-transform: none;
	}

	.stats {
		position: absolute;
		bottom: 40px;
		left: 40px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.count {
		font-size: 64px;
		font-weight: 700;
		line-height: 1;
		color: #494441;
	}

	.label {
		font-size: 16px;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		opacity: 0.7;
		font-weight: 600;
	}

	.visualization-container {
		flex: 0.8;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 600px;
		position: relative;
	}

	/* Optional: add a subtle glow behind the cup */
	.visualization-container::before {
		content: '';
		position: absolute;
		width: 300px;
		height: 300px;
		background: radial-gradient(circle, rgba(234, 146, 170, 0.2) 0%, rgba(234, 146, 170, 0) 70%);
		z-index: 0;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	@media (max-width: 1000px) {
		.split-layout {
			flex-direction: column;
			gap: 40px;
		}

		.page {
			padding: 20px;
			overflow: auto; /* Allow scroll on mobile */
		}

		.sentence {
			font-size: clamp(20px, 5vw, 32px);
		}

		.stats {
			position: static;
		}

		.count {
			font-size: 48px;
		}
	}
</style>
