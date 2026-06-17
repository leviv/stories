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

	let container: HTMLElement;
	let scene: THREE.Scene,
		camera: THREE.PerspectiveCamera,
		renderer: THREE.WebGLRenderer,
		mixer: THREE.AnimationMixer,
		controls: OrbitControls;
	const timer = new THREE.Timer();
	const actions: Record<string, THREE.AnimationAction> = {};
	let activeAction: THREE.AnimationAction;
	let activeActionName = $state('');
	let model: THREE.Group | THREE.Object3D;
	let grid: THREE.GridHelper;

	// References for debugging
	let groundMaterial: THREE.MeshStandardMaterial;
	let hemiLightRef: THREE.HemisphereLight;
	let dirLightRef: THREE.DirectionalLight;

	let isLoaded = $state(false);
	let loadingProgress = $state(0);
	// Debug panel replaced with lil-gui; toggle with 'd' key

	const animModules = import.meta.glob('$lib/body/animations/*.fbx', {
		eager: true,
		query: '?url',
		import: 'default'
	});
	const animations = Object.entries(animModules).map(([path, url]) => {
		const name = path.split('/').pop()?.replace('.fbx', '') || 'Unknown';
		return { name, url: url as string };
	});

	let gui: any;

	onMount(() => {
		init();
		animate();

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				if (gui) {
					if (gui._hidden) {
						gui.show();
					} else {
						gui.hide();
					}
				}
			}
		};
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			if (renderer) {
				renderer.dispose();
			}
			if (container && renderer.domElement) {
				// eslint-disable-next-line svelte/no-dom-manipulating
				container.removeChild(renderer.domElement);
			}
			if (gui) {
				gui.destroy();
			}
			window.removeEventListener('resize', onWindowResize);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	function init() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0xefe8de);
		scene.fog = new THREE.Fog(0xefe8de, 5, 20);

		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
		camera.position.set(-3.73, 3.27, 6.93);

		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFShadowMap;
		// eslint-disable-next-line svelte/no-dom-manipulating
		container.appendChild(renderer.domElement);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(-1.43, 1.41, -0.15);
		controls.update();
		controls.enablePan = true;
		controls.enableDamping = true;
		controls.minDistance = 1;
		controls.maxDistance = 10;

		// Lights
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

		// Ground
		groundMaterial = new THREE.MeshStandardMaterial({
			color: 0xefe8de,
			depthWrite: false,
			roughness: 0.8,
			metalness: 0.2
		});
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), groundMaterial);
		// Initialize lil-gui after material and lights are ready
		gui = new GUI();
		// Setup lil-gui controls
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
		dirFolder.add(dirLightRef.position, 'x', -10, 10, 0.1);
		dirFolder.add(dirLightRef.position, 'y', -10, 10, 0.1);
		dirFolder.add(dirLightRef.position, 'z', -10, 10, 0.1);

		mesh.rotation.x = -Math.PI / 2;
		mesh.receiveShadow = true;
		scene.add(mesh);

		// Make grid larger so scrolling doesn't show edges easily
		grid = new THREE.GridHelper(40, 40, 0x94a3b8, 0xcbd5e1);
		grid.material.opacity = 0.5;
		grid.material.transparent = true;
		scene.add(grid);

		// Wall Settings
		const wallSettings = {
			woodColor: '#d29760', // Lighter wood
			mirrorColor: '#a0a0a0',
			width: 3,
			height: 3,
			depth: 3,
			thickness: 0.08,
			cols: 2,
			rows: 3
		};

		const wallsGroup = new THREE.Group();
		scene.add(wallsGroup);

		const woodMaterial = new THREE.MeshStandardMaterial({
			color: new THREE.Color(wallSettings.woodColor),
			roughness: 0.8,
			metalness: 0.1
		});

		function buildWalls() {
			// Clear and dispose old walls
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

			function createMirroredWallWithGrid(w: number, h: number) {
				const group = new THREE.Group();

				const mirrorGeo = new THREE.PlaneGeometry(w, h);
				const mirror = new Reflector(mirrorGeo, {
					clipBias: 0.003,
					textureWidth: 1024,
					textureHeight: 1024,
					color: new THREE.Color(wallSettings.mirrorColor)
				});
				group.add(mirror);

				const gridGroup = new THREE.Group();
				const startX = -w / 2;
				for (let i = 0; i <= cols; i++) {
					const x = startX + (i * w) / cols;
					const geo = new THREE.BoxGeometry(thickness, h, thickness);
					const mesh = new THREE.Mesh(geo, woodMaterial);
					mesh.position.set(x, 0, thickness / 2 + 0.01);
					mesh.castShadow = true;
					mesh.receiveShadow = true;
					gridGroup.add(mesh);
				}

				const startY = -h / 2;
				for (let j = 0; j <= rows; j++) {
					const y = startY + (j * h) / rows;
					const geo = new THREE.BoxGeometry(w, thickness, thickness);
					const mesh = new THREE.Mesh(geo, woodMaterial);
					mesh.position.set(0, y, thickness / 2 + 0.01);
					mesh.castShadow = true;
					mesh.receiveShadow = true;
					gridGroup.add(mesh);
				}

				group.add(gridGroup);
				return group;
			}

			// Back wall
			const backWall = createMirroredWallWithGrid(width, height);
			backWall.position.set(0, height / 2, -depth / 2);
			wallsGroup.add(backWall);

			// Left wall
			const leftWall = createMirroredWallWithGrid(depth, height);
			leftWall.position.set(-width / 2, height / 2, 0);
			leftWall.rotation.y = Math.PI / 2;
			wallsGroup.add(leftWall);

			// Right wall
			const rightWall = createMirroredWallWithGrid(depth, height);
			rightWall.position.set(width / 2, height / 2, 0);
			rightWall.rotation.y = -Math.PI / 2;
			wallsGroup.add(rightWall);
		}

		buildWalls();

		// Add walls to GUI
		const wallFolder = gui.addFolder('Walls');
		wallFolder
			.addColor(wallSettings, 'woodColor')
			.onChange(() => woodMaterial.color.set(wallSettings.woodColor));
		wallFolder.addColor(wallSettings, 'mirrorColor').onFinishChange(buildWalls);
		wallFolder.add(wallSettings, 'width', 1, 10, 0.1).onFinishChange(buildWalls);
		wallFolder.add(wallSettings, 'height', 1, 10, 0.1).onFinishChange(buildWalls);
		wallFolder.add(wallSettings, 'depth', 1, 10, 0.1).onFinishChange(buildWalls);
		wallFolder.add(wallSettings, 'thickness', 0.01, 0.5, 0.01).onFinishChange(buildWalls);
		wallFolder.add(wallSettings, 'cols', 1, 10, 1).onFinishChange(buildWalls);
		wallFolder.add(wallSettings, 'rows', 1, 10, 1).onFinishChange(buildWalls);

		const cameraFolder = gui.addFolder('Camera');
		const cameraDebug = {
			logPosition: () => {
				console.log(
					`Camera Position: { x: ${camera.position.x.toFixed(2)}, y: ${camera.position.y.toFixed(2)}, z: ${camera.position.z.toFixed(2)} }`
				);
				console.log(
					`Camera Target: { x: ${controls.target.x.toFixed(2)}, y: ${controls.target.y.toFixed(2)}, z: ${controls.target.z.toFixed(2)} }`
				);
			}
		};
		cameraFolder.add(cameraDebug, 'logPosition').name('Log Position to Console');

		// Global Tools
		const globalTools = {
			copyProperties: () => {
				const state = gui.save();
				navigator.clipboard.writeText(JSON.stringify(state, null, 2))
					.then(() => alert('Debug properties copied to clipboard!'))
					.catch((err) => console.error('Failed to copy properties: ', err));
			}
		};
		gui.add(globalTools, 'copyProperties').name('Copy All Properties');

		// Load Model
		const loader = new FBXLoader();

		const baseAnim = animations.find((a) => a.name === 'Walking') || animations[0];

		loader.load(
			baseAnim.url,
			(object: THREE.Group) => {
				model = object;
				model.scale.set(1, 1, 1);

				mixer = new THREE.AnimationMixer(model);

				const textureLoader = new THREE.TextureLoader();
				const diffuseMap = textureLoader.load(texDiffuseUrl);
				diffuseMap.colorSpace = THREE.SRGBColorSpace;
				const normalMap = textureLoader.load(texNormalUrl);
				const aoMap = textureLoader.load(texAoUrl);

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

				// Base animation
				if (object.animations.length > 0) {
					const walkAction = mixer.clipAction(object.animations[0]);
					actions[baseAnim.name] = walkAction;
					activeAction = walkAction;
					activeActionName = baseAnim.name;
					walkAction.play();
				}

				// Load other animations
				const otherAnimations = animations.filter((a) => a.name !== baseAnim.name);
				let loadedCount = 0;
				if (otherAnimations.length === 0) {
					isLoaded = true;
				} else {
					otherAnimations.forEach((anim) => {
						loader.load(anim.url, (animObject: THREE.Group) => {
							if (animObject.animations.length > 0) {
								const action = mixer.clipAction(animObject.animations[0]);
								actions[anim.name] = action;
							}
							loadedCount++;
							if (loadedCount === otherAnimations.length) {
								isLoaded = true;
							}
						});
					});
				}
			},
			(xhr: ProgressEvent) => {
				loadingProgress = (xhr.loaded / xhr.total) * 100;
			}
		);

		window.addEventListener('resize', onWindowResize);
	}

	function changeAnimation(name: string) {
		if (!actions[name] || activeActionName === name) {
			return;
		}
		const previousAction = activeAction;
		activeAction = actions[name];
		activeActionName = name;

		activeAction.reset().fadeIn(0.5).play();
		if (previousAction) {
			previousAction.fadeOut(0.5);
		}
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
		if (mixer) {
			mixer.update(delta);
		}
		if (controls) {
			controls.update();
		}

		// Pin model to origin to prevent it from walking away if it has root motion
		if (model) {
			model.position.set(0, 0, 0);
		}

		// Animate grid for a treadmill effect if walking
		if (grid && activeActionName === 'Walking') {
			// Adjust speed (e.g. 1.2 units per second). One grid square is 1 unit.
			grid.position.z += 1.2 * delta;
			if (grid.position.z > 1) {
				grid.position.z -= 1;
			}
		}

		if (renderer) {
			renderer.render(scene, camera);
		}
	}
</script>

<div class="page-container">
	<div bind:this={container} class="canvas-container"></div>
	<div class="overlay">
		<header>
			<h1 class="title">Levi's 3D Motion</h1>
			<p class="description">
				Explore an interactive infinite walking animation. Rotate the scene using your mouse and
				switch between motion captures using the controls below.
			</p>
		</header>

		{#if !isLoaded}
			<div class="loading">
				<div class="spinner"></div>
				<p>Loading Model... {Math.round(loadingProgress)}%</p>
			</div>
		{/if}

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
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		overflow: hidden;
		background-color: #efe8de;
	}

	.page-container {
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

	.description {
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.6;
		color: #64748b;
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
	}

	.controls.visible {
		opacity: 1;
		transform: translateY(0);
	}

	button {
		background: transparent;
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

	button:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	button.active {
		background: #1d4ed8;
		color: white;
		border-color: #1d4ed8;
	}

	@keyframes fadeDown {
		to {
			transform: translateY(0);
		}
	}
</style>
