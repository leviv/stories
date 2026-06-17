<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
	import GUI from 'lil-gui';

	import texDiffuseUrl from '$lib/body/textures/b004bb556864066a1b6d95a97f81ed79.jpg?url';
	import texNormalUrl from '$lib/body/textures/e8cbc5f4c2c436d588c0756f2dd0fc76.jpg?url';
	import texAoUrl from '$lib/body/textures/ecfca79bde43a98af23c2af43a444f7d.jpg?url';
	import baseModelUrl from '$lib/body/BaseModel.fbx?url';
	import story from '$lib/body/story.json';

	const animModules = import.meta.glob('$lib/body/animations/*.fbx', {
		eager: true,
		query: '?url',
		import: 'default'
	});
	const animations = Object.entries(animModules).map(([path, url]) => ({
		name: path.split('/').pop()?.replace('.fbx', '') || 'Unknown',
		url: url as string
	}));

	const walkingIndex = animations.findIndex((a) => a.name === 'Walking');
	if (walkingIndex > 0) {
		const walkingAnim = animations.splice(walkingIndex, 1)[0];
		animations.unshift(walkingAnim);
	}

	let container: HTMLElement;
	let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
	let mixer: THREE.AnimationMixer, controls: OrbitControls;
	let model: THREE.Group | THREE.Object3D;
	let grid: THREE.GridHelper;
	let gui: GUI;

	const timer = new THREE.Timer();
	const actions: Record<string, THREE.AnimationAction> = {};

	let activeAction: THREE.AnimationAction | undefined;
	let activeActionName = $state('');
	let isLoaded = $state(false);
	let loadingProgress = $state(0);

	let isCloseView = $state(false);
	let currentStoryIndex = $state(0);

	const mainCameraPos = new THREE.Vector3(-3.73, 3.27, 6.93);
	const mainControlsTarget = new THREE.Vector3(-1.43, 1.41, -0.15);
	const closeCameraPos = new THREE.Vector3(0, 1.3, 3.2);
	const closeControlsTarget = new THREE.Vector3(0, 1.0, 0);

	// Environment & Debug References
	let groundMaterial: THREE.MeshStandardMaterial;
	let hemiLightRef: THREE.HemisphereLight;
	let dirLightRef: THREE.DirectionalLight;
	let wallsGroup: THREE.Group;
	let woodMaterial: THREE.MeshStandardMaterial;

	const wallSettings = {
		woodColor: '#d29760',
		mirrorColor: '#a0a0a0',
		width: 3,
		height: 3,
		depth: 3,
		thickness: 0.08,
		cols: 2,
		rows: 3
	};

	onMount(() => {
		initScene();
		setupEnvironment();
		buildWalls();
		setupGUI();
		loadModels();

		requestAnimationFrame(animate);

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === 'd' && gui) {
				if (gui._hidden) {
					gui.show();
				} else {
					gui.hide();
				}
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('resize', onWindowResize);

		return () => {
			renderer?.dispose();
			if (container && renderer?.domElement) {
				// eslint-disable-next-line svelte/no-dom-manipulating
				container.removeChild(renderer.domElement);
			}
			gui?.destroy();
			window.removeEventListener('resize', onWindowResize);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function toggleCloseView() {
		isCloseView = !isCloseView;
	}

	function updateAnimationForStory() {
		if (animations.length > 0) {
			changeAnimation(animations[currentStoryIndex % animations.length].name);
		}
	}

	function nextStory() {
		if (currentStoryIndex < story.length - 1) {
			currentStoryIndex++;
			updateAnimationForStory();
		}
	}

	function prevStory() {
		if (currentStoryIndex > 0) {
			currentStoryIndex--;
			updateAnimationForStory();
		}
	}

	function resetStory() {
		currentStoryIndex = 0;
		updateAnimationForStory();
	}

	function initScene() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0xefe8de);
		scene.fog = new THREE.Fog(0xefe8de, 5, 20);

		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
		camera.position.copy(mainCameraPos);

		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFShadowMap;
		// eslint-disable-next-line svelte/no-dom-manipulating
		container.appendChild(renderer.domElement);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.target.copy(mainControlsTarget);
		controls.enablePan = true;
		controls.enableDamping = true;
		controls.minDistance = 1;
		controls.maxDistance = 10;
		controls.update();
	}

	function setupEnvironment() {
		hemiLightRef = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
		hemiLightRef.position.set(0, 5, 0);
		scene.add(hemiLightRef);

		dirLightRef = new THREE.DirectionalLight(0xffffff, 2.4);
		dirLightRef.position.set(-1.3, 4.3, 2.4);
		dirLightRef.castShadow = true;
		dirLightRef.shadow.camera.top = 2;
		dirLightRef.shadow.camera.bottom = -2;
		dirLightRef.shadow.camera.left = -2;
		dirLightRef.shadow.camera.right = 2;
		scene.add(dirLightRef);

		groundMaterial = new THREE.MeshStandardMaterial({
			color: 0xefe8de,
			depthWrite: false,
			roughness: 0.8,
			metalness: 0.2
		});
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), groundMaterial);
		mesh.rotation.x = -Math.PI / 2;
		mesh.receiveShadow = true;
		scene.add(mesh);

		grid = new THREE.GridHelper(40, 40, 0x94a3b8, 0xcbd5e1);
		grid.material.opacity = 0.5;
		grid.material.transparent = true;
		scene.add(grid);

		wallsGroup = new THREE.Group();
		scene.add(wallsGroup);

		woodMaterial = new THREE.MeshStandardMaterial({
			color: new THREE.Color(wallSettings.woodColor),
			roughness: 0.8,
			metalness: 0.1
		});
	}

	function buildWalls() {
		while (wallsGroup.children.length > 0) {
			const child = wallsGroup.children[0];
			wallsGroup.remove(child);
			child.traverse((c: any) => {
				if (c.geometry) {
					c.geometry.dispose();
				}
				if (c.material && !Array.isArray(c.material) && c.material !== woodMaterial) {
					c.material.dispose();
				}
				if (c.dispose) {
					c.dispose();
				} // Reflector dispose
			});
		}

		const { width, height, depth, thickness, cols, rows } = wallSettings;

		const createMirroredWallWithGrid = (w: number, h: number) => {
			const group = new THREE.Group();
			const mirror = new Reflector(new THREE.PlaneGeometry(w, h), {
				clipBias: 0.003,
				textureWidth: 512,
				textureHeight: 512,
				color: new THREE.Color(wallSettings.mirrorColor)
			});
			group.add(mirror);

			const gridGroup = new THREE.Group();
			for (let i = 0; i <= cols; i++) {
				const mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, h, thickness), woodMaterial);
				mesh.position.set(-w / 2 + (i * w) / cols, 0, thickness / 2 + 0.01);
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				gridGroup.add(mesh);
			}
			for (let j = 0; j <= rows; j++) {
				const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, thickness, thickness), woodMaterial);
				mesh.position.set(0, -h / 2 + (j * h) / rows, thickness / 2 + 0.01);
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				gridGroup.add(mesh);
			}
			group.add(gridGroup);
			return group;
		};

		const backWall = createMirroredWallWithGrid(width, height);
		backWall.position.set(0, height / 2, -depth / 2);
		wallsGroup.add(backWall);

		const leftWall = createMirroredWallWithGrid(depth, height);
		leftWall.position.set(-width / 2, height / 2, 0);
		leftWall.rotation.y = Math.PI / 2;
		wallsGroup.add(leftWall);

		const rightWall = createMirroredWallWithGrid(depth, height);
		rightWall.position.set(width / 2, height / 2, 0);
		rightWall.rotation.y = -Math.PI / 2;
		wallsGroup.add(rightWall);
	}

	function setupGUI() {
		gui = new GUI();
		gui.hide();

		const materialFolder = gui.addFolder('Material');
		materialFolder.addColor(groundMaterial, 'color').name('Color');
		materialFolder.add(groundMaterial, 'roughness', 0, 1, 0.01);
		materialFolder.add(groundMaterial, 'metalness', 0, 1, 0.01);

		const hemiFolder = gui.addFolder('Hemisphere Light');
		hemiFolder.add(hemiLightRef, 'intensity', 0, 5, 0.1);
		hemiFolder.addColor(hemiLightRef, 'color');

		const dirFolder = gui.addFolder('Directional Light');
		dirFolder.add(dirLightRef, 'intensity', 0, 5, 0.1);
		dirFolder.addColor(dirLightRef, 'color');
		['x', 'y', 'z'].forEach((axis) => dirFolder.add(dirLightRef.position, axis, -10, 10, 0.1));

		const wallFolder = gui.addFolder('Walls');
		wallFolder
			.addColor(wallSettings, 'woodColor')
			.onChange(() => woodMaterial.color.set(wallSettings.woodColor));
		wallFolder.addColor(wallSettings, 'mirrorColor').onFinishChange(buildWalls);
		['width', 'height', 'depth'].forEach((prop) =>
			wallFolder
				.add(wallSettings, prop as 'width' | 'height' | 'depth', 1, 10, 0.1)
				.onFinishChange(buildWalls)
		);
		wallFolder.add(wallSettings, 'thickness', 0.01, 0.5, 0.01).onFinishChange(buildWalls);
		['cols', 'rows'].forEach((prop) =>
			wallFolder.add(wallSettings, prop as 'cols' | 'rows', 1, 10, 1).onFinishChange(buildWalls)
		);

		gui
			.addFolder('Camera')
			.add(
				{
					logPosition: () =>
						console.log(
							`Camera: x: ${camera.position.x.toFixed(2)}, y: ${camera.position.y.toFixed(2)}, z: ${camera.position.z.toFixed(2)}\nTarget: x: ${controls.target.x.toFixed(2)}, y: ${controls.target.y.toFixed(2)}, z: ${controls.target.z.toFixed(2)}`
						)
				},
				'logPosition'
			)
			.name('Log Position');

		gui
			.add(
				{
					copyProperties: () =>
						navigator.clipboard
							.writeText(JSON.stringify(gui.save(), null, 2))
							.then(() => alert('Properties copied!'))
				},
				'copyProperties'
			)
			.name('Copy All Properties');
	}

	async function loadModels() {
		const loader = new FBXLoader();

		try {
			model = await new Promise<THREE.Group>((resolve, reject) => {
				loader.load(
					baseModelUrl,
					resolve,
					(xhr: ProgressEvent) => {
						loadingProgress = (xhr.loaded / xhr.total) * 100;
					},
					reject
				);
			});

			mixer = new THREE.AnimationMixer(model);

			const textureLoader = new THREE.TextureLoader();
			const [diffuseMap, normalMap, aoMap] = await Promise.all([
				textureLoader.loadAsync(texDiffuseUrl),
				textureLoader.loadAsync(texNormalUrl),
				textureLoader.loadAsync(texAoUrl)
			]);
			diffuseMap.colorSpace = THREE.SRGBColorSpace;

			model.traverse((child: any) => {
				if (child.isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
					child.material = new THREE.MeshStandardMaterial({
						map: diffuseMap,
						normalMap,
						aoMap,
						roughness: 0.6,
						metalness: 0.1
					});
				}
			});

			scene.add(model);

			const animPromises = animations.map(async (anim) => {
				try {
					const animObject = await new Promise<THREE.Group>((res, rej) =>
						loader.load(anim.url, res, undefined, rej)
					);
					if (animObject.animations.length > 0) {
						actions[anim.name] = mixer.clipAction(animObject.animations[0]);
					}
				} catch (e) {
					console.error(`Failed to load animation ${anim.name}:`, e);
				}
			});

			await Promise.all(animPromises);

			if (animations.length > 0) {
				changeAnimation(animations[0].name);
			}

			isLoaded = true;
		} catch (error) {
			console.error('Error loading models:', error);
		}
	}

	function changeAnimation(name: string) {
		if (!actions[name] || activeActionName === name) {
			return;
		}

		const previousAction = activeAction;
		activeAction = actions[name];
		activeActionName = name;

		activeAction.reset().fadeIn(0.5).play();
		previousAction?.fadeOut(0.5);
	}

	function onWindowResize() {
		if (!camera || !renderer) {
			return;
		}
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function animate() {
		requestAnimationFrame(animate);
		timer.update();
		const delta = timer.getDelta();

		mixer?.update(delta);

		// Interpolate camera and controls to their target positions based on mode
		const targetCameraPos = isCloseView ? closeCameraPos : mainCameraPos;
		const targetControlsFocus = isCloseView ? closeControlsTarget : mainControlsTarget;

		if (camera && controls) {
			camera.position.lerp(targetCameraPos, 0.05);
			controls.target.lerp(targetControlsFocus, 0.05);
			controls.update();
		}

		if (model) {
			model.position.set(0, 0, 0);
		}

		if (grid && activeActionName === 'Walking') {
			grid.position.z = (grid.position.z + 1.2 * delta) % 1;
		}

		renderer?.render(scene, camera);
	}
</script>

<div class="page-container">
	<div bind:this={container} class="canvas-container"></div>
	<div class="overlay">
		<header>
			<h1 class="title">Body Double</h1>
			{#if !isCloseView}
				<div class="story-container">
					<p class="description">
						{story[currentStoryIndex]}
					</p>
					<div class="story-controls">
						<button disabled={currentStoryIndex === 0} onclick={prevStory}>Previous</button>
						{#if currentStoryIndex === story.length - 1}
							<button class="primary-btn" onclick={resetStory}>Reset</button>
						{:else}
							<button onclick={nextStory}>Next</button>
						{/if}
					</div>
				</div>
			{/if}
		</header>

		{#if !isLoaded}
			<div class="loading">
				<div class="spinner"></div>
				<p>Loading Model... {Math.round(loadingProgress)}%</p>
			</div>
		{/if}

		{#if isCloseView}
			<div class="controls" class:visible={isLoaded}>
				{#each animations as anim (anim.name)}
					<button
						class:active={activeActionName === anim.name}
						onclick={() => changeAnimation(anim.name)}
					>
						{anim.name}
					</button>
				{/each}
			</div>

			<button class="action-btn back-btn" onclick={toggleCloseView}>Back to Story</button>
		{:else}
			<button class="action-btn get-closer-btn" onclick={toggleCloseView}>Get Closer</button>
		{/if}
	</div>
</div>

<style>
	.page-container {
		background-color: #efe8de;
		overflow: hidden;
		position: relative;
		width: 100vw;
		height: 100vh;
		font-family:
			'Space Grotesk',
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
	}

	.canvas-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 3rem;
		box-sizing: border-box;
	}

	header {
		max-width: 450px;
		padding: 1rem 0;
		color: #1e293b;
		transform: translateY(-20px);
		animation: fadeDown 0.8s ease-out forwards;
	}

	.title {
		margin: 0 0 1rem 0;
		font-size: 2.5rem;
		font-weight: 600;
		font-family: 'Playfair Display', 'Times New Roman', serif;
		color: #1d4ed8;
	}

	.story-container {
		margin-top: 1rem;
		animation: fadeDown 0.4s ease-out forwards;
	}

	.description {
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.6;
		color: #64748b;
	}

	.story-controls {
		margin-top: 1rem;
		display: flex;
		gap: 0.5rem;
		pointer-events: auto;
	}

	.loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #1e293b;
		font-size: 1.1rem;
		font-weight: 500;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 2px solid rgba(29, 78, 216, 0.2);
		border-top-color: #1d4ed8;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.controls {
		display: flex;
		gap: 1rem;
		pointer-events: auto;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease-out;
		flex-wrap: wrap;
		max-width: 80%;
	}

	.controls.visible {
		opacity: 1;
		transform: translateY(0);
	}

	button {
		background: white;
		border: 1px solid #cbd5e1;
		color: #1e293b;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s ease;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button:hover:not(:disabled) {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	button.active {
		background: #1d4ed8;
		color: white;
		border-color: #1d4ed8;
	}

	button.active:hover:not(:disabled) {
		background: #1e40af;
		border-color: #1e40af;
	}

	.primary-btn {
		background: #1d4ed8;
		color: white;
		border-color: #1d4ed8;
	}

	.primary-btn:hover:not(:disabled) {
		background: #1e40af;
		border-color: #1e40af;
	}

	.action-btn {
		position: absolute;
		pointer-events: auto;
	}

	.get-closer-btn {
		bottom: 3rem;
		right: 3rem;
		background: #1d4ed8;
		color: white;
		border-color: #1d4ed8;
	}

	.get-closer-btn:hover:not(:disabled) {
		background: #1e40af;
		border-color: #1e40af;
	}

	.back-btn {
		bottom: 3rem;
		right: 3rem;
		background: white;
		color: #1e293b;
		border-color: #cbd5e1;
	}

	@keyframes fadeDown {
		to {
			transform: translateY(0);
		}
	}
</style>
