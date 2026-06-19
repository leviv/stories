<script>
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	// Auto-import all guide assets! (Excluding gifs)
	const assets = import.meta.glob('/src/lib/guide/assets/*.(png|jpe?g)', {
		eager: true,
		query: '?url',
		import: 'default'
	});
	const guideImages = Object.values(assets);
	let bgIndex = $state(0);

	let gui;

	onMount(async () => {
		const intervalId = setInterval(() => {
			if (guideImages.length > 0) {
				bgIndex = (bgIndex + 1) % guideImages.length;
			}
		}, 600);

		const lilGui = await import('lil-gui');
		gui = new lilGui.GUI();

		const params = {
			fontFamily: '"Comic Sans MS", "Times New Roman", serif',
			backgroundColor: '#ffc0cb', // Default to a light pink color just in case bg fails
			backgroundType: 'BG 2', // Default to BG 2 (pink bg) as requested
			cursor: "url('https://cur.cursors-4u.net/cursors/cur-2/cur116.cur'), auto"
		};

		const updateStyles = () => {
			document.body.style.fontFamily = params.fontFamily;
			document.body.style.backgroundColor = params.backgroundColor;

			let bgUrl = '';
			if (params.backgroundType === 'Stars') {
				bgUrl =
					"url('https://web.archive.org/web/20091027052936im_/http://www.geocities.com/glazba99/stars.gif')";
			} else if (params.backgroundType === 'BG 1') {
				bgUrl = `url('${base}/presentation/bg1.jpg')`;
			} else if (params.backgroundType === 'BG 2') {
				bgUrl = `url('${base}/presentation/bg2.gif')`;
			} else {
				bgUrl = 'none';
			}
			document.body.style.backgroundImage = bgUrl;

			document.body.style.cursor = params.cursor;
		};

		gui
			.add(params, 'fontFamily', {
				'Comic Sans': '"Comic Sans MS", "Times New Roman", serif',
				'Times New Roman': '"Times New Roman", Times, serif',
				Arial: 'Arial, Helvetica, sans-serif',
				'Courier New': '"Courier New", Courier, monospace'
			})
			.onChange(updateStyles);

		gui.addColor(params, 'backgroundColor').onChange(updateStyles);

		gui.add(params, 'backgroundType', ['Stars', 'BG 1', 'BG 2', 'None']).onChange(updateStyles);

		gui
			.add(params, 'cursor', {
				'Default Retro': "url('https://cur.cursors-4u.net/cursors/cur-2/cur116.cur'), auto",
				Sword: `url('${base}/presentation/sword.gif'), auto`,
				'???': `url('${base}/presentation/???.gif'), auto`,
				Normal: 'auto'
			})
			.onChange(updateStyles);

		gui.hide();

		const handleKeydown = (e) => {
			if (e.key === 'd') {
				gui._hidden ? gui.show() : gui.hide();
			}
		};

		window.addEventListener('keydown', handleKeydown);

		// Initialize styles right away
		updateStyles();

		return () => {
			clearInterval(intervalId);
			window.removeEventListener('keydown', handleKeydown);
			if (gui) {
				gui.destroy();
			}
		};
	});
</script>

<div class="construction">
	<img class="construction-normal" src="{base}/presentation/construction.gif" alt="Under Construction" />
	<img
		class="construction-long"
		src="{base}/presentation/construnction-long.gif"
		alt="Under Construction Long"
	/>
	<img class="construction-normal" src="{base}/presentation/construction.gif" alt="Under Construction" />
</div>

<section>
	<marquee width="80%" scrollamount="10"><h1>WELCOME!!!!!</h1></marquee>
	<img
		class="floating-gif"
		src="{base}/presentation/cry.gif"
		alt="Cry"
		style="max-width: 200px; width: 200px; height: auto; top: 10%; left: 5%;"
	/>
	<h6>title</h6>
	<h5>title</h5>
	<h4>title</h4>
	<h3>title</h3>
	<h2>title</h2>
	<h1>How can HTML make you cry?</h1>
	<h2>title</h2>
	<h3>title</h3>
	<h4>title</h4>
	<h5>title</h5>
	<h6>title</h6>
	<img
		class="floating-gif"
		src="{base}/presentation/cry2.gif"
		alt="Cry"
		style="max-width: 200px; width: 200px; height: auto; bottom: 10%; right: 5%;"
	/>
</section>

<hr />

<section>
	<img
		class="floating-gif"
		src="{base}/presentation/2P32SNDC3RQ2P4LYJ5IRV7GFYSI4KWPG.gif"
		alt="Icon 1"
		style="max-width: 150px; width: 150px; height: auto; top: 10%; left: 5%;"
	/>
	<img
		class="floating-gif"
		src="{base}/presentation/3HTX2OPCDSQFT5LXSYDEG2QP65NHX2PD.gif"
		alt="Icon 2"
		style="max-width: 150px; width: 150px; height: auto; bottom: 10%; left: 5%;"
	/>
	<img
		class="floating-gif"
		src="{base}/presentation/4XKOHORVHSZEXU6WOWENOLVOAZAOF7XB.gif"
		alt="Icon 3"
		style="max-width: 150px; width: 150px; height: auto; bottom: 10%; right: 5%;"
	/>
	<h2>Levi Villarreal</h2>
	<img
		src="{base}/presentation/byline.png"
		alt="Gothamist Byline"
		style="max-width: 600px; width: 600px;"
	/>
</section>

<hr />

<section>
	<img
		class="floating-gif"
		src="{base}/presentation/story.gif"
		alt="Story"
		style="max-width: 250px; width: 250px; height: auto; top: 10%; left: 5%;"
	/>
	<h2>Storytelling</h2>
	<ul>
		<li>Cave painting</li>
		<li>The printing press</li>
		<li>Cameras</li>
		<li>Computers</li>
	</ul>
	<img
		class="floating-gif"
		src="{base}/presentation/story2.gif"
		alt="Story"
		style="max-width: 250px; width: 250px; height: auto; bottom: 10%; right: 5%;"
	/>
</section>

<hr />

<section>
	<h2>Why choose this topic?</h2>
	<img
		src="{base}/presentation/question.gif"
		alt="???"
		style="border: none; max-width: 400px; width: 400px; margin-bottom: 20px;"
	/>
	<img
		src="{base}/presentation/cap.png"
		alt="Hat"
		style="max-width: 600px; width: 600px; height: auto;"
	/>
	<video src="{base}/presentation/computer.mov" controls loop style="width: 900px; height: auto;"></video>
	<ul>
		<li>Career</li>
		<li>Community</li>
		<li>Knowledge</li>
		<li>Friends</li>
		<li>+ ...</li>
	</ul>
	<img
		src="{base}/presentation/sotd.png"
		alt="Site of the Day"
		style="max-width: 600px; width: 600px; height: auto;"
	/>
</section>

<hr />

<section>
	<img
		class="floating-gif"
		src="{base}/presentation/grad_school_long.gif"
		alt="Grad School"
		style="max-width: 500px; width: 500px; height: auto; top: 5%; right: 5%;"
	/>
	<h2>Why did I join IMA?</h2>
	<ul>
		<li><a href="https://leviv.cool/dumpling/map">World Dumpling Index (with Dae!)</a></li>
		<li><a href="https://leviv.cool/stuy-town">StuyTown</a></li>
		<li><a href="https://leviv.cool/gill">Gill Simulator</a></li>
		<li><a href="https://leviv.cool/abortion-desert">Abortion Deserts (with Queenie!)</a></li>
	</ul>
	<img
		class="floating-gif"
		src="{base}/presentation/gradschool.gif"
		alt="School"
		style="max-width: 200px; width: 200px; height: auto; bottom: 5%; left: 5%;"
	/>
	<img
		class="floating-gif"
		src="{base}/presentation/school.gif"
		alt="School"
		style="max-width: 200px; width: 200px; height: auto; bottom: 5%; right: 5%;"
	/>
	<img
		class="floating-gif"
		src="{base}/presentation/gradschool2.gif"
		alt="School"
		style="max-width: 200px; width: 200px; height: auto; top: 10%; left: 5%;"
	/>
</section>

<hr />

<section>
	<div class="patchwork-container" style="background-image: url('{guideImages[bgIndex]}');">
		<div class="scatter-bullet">
			<h2>What makes a good story on the web?</h2>
			<ul>
				<li>Research</li>
				<li>Journalism</li>
				<li>Developers</li>
				<li>Personal</li>
				<li>+ ....</li>
			</ul>
		</div>
	</div>
</section>

<hr />

<section>
	<img
		class="floating-gif"
		src="{base}/presentation/story3.gif"
		alt="Story"
		style="max-width: 250px; width: 250px; height: auto; top: 10%; right: 5%;"
	/>
	<h2>10 Storytelling Devices</h2>
	<ul>
		<li>Crowdsourced Narratives</li>
		<li>Experimental Interfaces</li>
		<li>Simulations</li>
		<li>Interactive traditional data viz</li>
		<li>Scrollytelling</li>
		<li>Audio Storytelling</li>
		<li>Searchable databases</li>
		<li>Inserting yourself in the story</li>
		<li>Game-Based Narratives</li>
		<li>Virtual & Augmented Reality</li>
	</ul>
	<h2><a href="{base}/guide">10 digital storytelling devices</a></h2>
</section>

<hr />

<section>
	<h2>Projects</h2>
	<table>
		<thead>
			<tr>
				<th>Shanghai</th>
				<th>New York</th>
				<th>Berlin</th>
				<th>Miscellaneous</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><a href="{base}/scooter">Scooter Sprint</a></td>
				<td><a href="{base}/sleep">The Browser That Never Sleeps</a></td>
				<td><a href="{base}/translation">Translation</a></td>
				<td></td>
			</tr>
			<tr>
				<td><a href="{base}/jaywalking">Jaywalking</a></td>
				<td><a href="{base}/fig">$FIG</a></td>
				<td><a href="{base}/how-are-you">How Are You?</a></td>
				<td><a href="{base}/ima-boba">IMA Boba</a></td>
			</tr>
			<tr>
				<td><a href="{base}/body">Body Double</a></td>
				<td><a href="{base}/bpm">The summer I accidentally discovered Dariacore and Hyperpop</a></td>
				<td><a href="{base}/cold">Cold</a></td>
				<td></td>
			</tr>
		</tbody>
	</table>
</section>

<hr />

<section>
	<h2>Exhibition</h2>
	<img
		src="{base}/presentation/show.png"
		alt="Exhibition"
		style="max-width: 800px; width: 100%; height: auto; max-height: none;"
	/>
</section>

<hr />

<section>
	<h1>thx (✿◠‿◠)</h1>
	<h2>www.leviv.cool \(^-^)/</h2>

	<div class="banners">
		<img src="{base}/presentation/badge1.gif" alt="Badge 1" />
		<img src="{base}/presentation/badge2.gif" alt="Badge 2" />
		<img src="{base}/presentation/badge3.gif" alt="Badge 3" />
		<img src="{base}/presentation/badge4.gif" alt="Badge 4" />
		<img src="{base}/presentation/badge5.gif" alt="Badge 5" />
		<img src="{base}/presentation/badge6.gif" alt="Badge 6" />
		<img src="{base}/presentation/badge7.gif" alt="Badge 7" />
		<img src="{base}/presentation/badge8.gif" alt="Badge 8" />
		<img src="{base}/presentation/badge9.gif" alt="Badge 9" />
		<img src="{base}/presentation/badge10.gif" alt="Badge 10" />
		<img src="{base}/presentation/guestbook.gif" alt="Guestbook" />
	</div>
</section>

<style>
	:global(body) {
		/* Start with the pink bg2 as requested */
		background-color: #ffc0cb;
		/* Use deep purple text instead of lime green for readability on pink */
		color: #4b0082;
		font-family: 'Comic Sans MS', 'Times New Roman', serif;
		cursor: url('https://cur.cursors-4u.net/cursors/cur-2/cur116.cur'), auto;
		margin: 0;
		padding: 0;
		text-align: center;
	}

	h1 {
		font-size: 3.5rem;
		margin: 10px 0;
	}
	h2 {
		font-size: 2.8rem;
		margin: 10px 0;
	}
	h3 {
		font-size: 2.4rem;
		margin: 10px 0;
	}
	h4 {
		font-size: 2rem;
		margin: 8px 0;
	}
	h5 {
		font-size: 1.6rem;
		margin: 8px 0;
	}
	h6 {
		font-size: 1.2rem;
		margin: 8px 0;
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		color: #ffffff;
		text-shadow:
			2px 2px #ff1493,
			-1px -1px #000;
	}

	a {
		color: #0000ff;
		font-weight: bold;
	}

	a:visited {
		color: #8a2be2;
	}

	section {
		min-height: 80vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 20px;
		box-sizing: border-box;
		position: relative;
	}

	hr {
		width: 80%;
		border-style: groove;
		border-width: 8px;
		border-color: #ff69b4;
		margin: 40px auto;
	}

	img {
		max-width: 300px;
		max-height: 300px;
		border: 4px ridge #ff1493;
		margin: 10px;
	}

	/* Embossed Table */
	table {
		border-collapse: separate;
		margin: 20px 0;
		background: rgba(255, 255, 255, 0.8);
		border: 6px outset #ff69b4;
		box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.5);
	}

	th,
	td {
		border: 3px inset #ff69b4;
		padding: 15px;
		font-size: 1.2rem;
		font-weight: bold;
		color: #4b0082;
	}

	th {
		background: #ffb6c1;
	}

	/* Flashing Background layout */
	.patchwork-container {
		width: 100%;
		min-height: 500px;
		position: relative;
		margin: 20px 0;
		background-color: #000;
		background-size: cover;
		background-position: center;
		padding: 10px;
		border: 6px outset #ff69b4;
	}

	.scatter-bullet {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 10;
		background: rgba(255, 255, 255, 0.95);
		border: 6px outset #ff1493;
		padding: 30px;
		box-shadow: 10px 10px 0px rgba(0, 0, 0, 0.5);
	}

	ul {
		text-align: left;
		list-style-type: square;
		font-size: 1.5rem;
		font-weight: bold;
		margin: 0;
		padding-left: 30px;
	}

	.banners {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 50px;
	}

	.banners img {
		border: 2px outset #fff;
		margin: 0;
		width: 132px;
		height: 46px;
	}

	.construction {
		margin-top: 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
	}

	.construction img {
		border: none;
		margin: 0;
	}

	/* Specific sizing for the construction gifs */
	.construction-normal {
		width: 150px;
		height: auto;
	}

	.construction-long {
		max-width: 400px;
		height: auto;
	}
	.floating-gif {
		position: absolute;
		border: none !important;
		margin: 0 !important;
		z-index: 0;
	}
</style>
