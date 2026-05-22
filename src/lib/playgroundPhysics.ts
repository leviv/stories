import planck from 'planck-js';

type PlaygroundOptions = {
	container: HTMLElement;
	items: HTMLElement[];
	boundary?: HTMLElement | null;
	boundaryOffset?: number;
};

export type PlaygroundController = {
	refresh: () => void;
	updatePointer: () => void;
	activate: () => void;
	destroy: () => void;
};

export function createPlayground({ container, items, boundary, boundaryOffset }: PlaygroundOptions): PlaygroundController {
	const scale = 30;
	let world: planck.World | null = null;
	let ground: planck.Body | null = null;
	let bodies: planck.Body[] = [];
	let animationId: number | null = null;
	let lastTime = 0;
	let active = false;
	let mouseJoint: planck.Joint | null = null;
	let activePointerId: number | null = null;
	let bounds = {
		left: 0,
		top: 0,
		width: 0,
		height: 0,
		containerHeight: 0,
		documentTop: 0,
		boundaryTop: 0
	};
	const pointer = { x: 0, y: 0, active: false };
	let itemSizes: Array<{ width: number; height: number }> = [];
	let itemOrder: number[] = [];

	const updateBounds = () => {
		const rect = container.getBoundingClientRect();
		const pageHeight = document.documentElement.scrollHeight;
		const documentTop = rect.top + window.scrollY;
		const boundaryRect = boundary?.getBoundingClientRect();
		const offset = boundaryOffset ?? 0;
		const boundaryTop = boundaryRect ? boundaryRect.top + window.scrollY - offset : pageHeight;
		const maxHeight = Math.max(rect.height, boundaryTop - documentTop);
		const worldHeight = Math.min(pageHeight - documentTop, maxHeight);
		bounds = {
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: worldHeight,
			containerHeight: rect.height,
			documentTop,
			boundaryTop
		};
	};

	const toWorld = (x: number, y: number) => planck.Vec2(x / scale, y / scale);
	const toPixels = (value: number) => value * scale;

	const syncDom = () => {
		if (!bounds.width || !bounds.height) return;
		bodies.forEach((body, index) => {
			const itemIndex = itemOrder[index] ?? index;
			const el = items[itemIndex];
			if (!el) return;
			const size = itemSizes[index];
			const halfW = (size?.width ?? el.offsetWidth) / 2;
			const halfH = (size?.height ?? el.offsetHeight) / 2;
			const minX = halfW;
			const maxX = bounds.width - halfW;
			const minY = halfH;
			const maxY = bounds.height - halfH;
			const position = body.getPosition();
			let x = toPixels(position.x);
			let y = toPixels(position.y);
			let nextX = x;
			let nextY = y;
			if (nextX < minX) nextX = minX;
			if (nextX > maxX) nextX = maxX;
			if (nextY < minY) nextY = minY;
			if (nextY > maxY) nextY = maxY;
			if (nextX !== x || nextY !== y) {
				body.setPosition(toWorld(nextX, nextY));
				x = nextX;
				y = nextY;
			}
			el.style.transform = `translate(${x}px, ${y}px) rotate(${body.getAngle()}rad) translate(-50%, -50%)`;
		});
	};

	const step = (time: number) => {
		if (!world) return;
		if (!lastTime) lastTime = time;
		const delta = Math.min((time - lastTime) / 1000, 1 / 30);
		lastTime = time;
		if (mouseJoint && pointer.active) {
			const target = toWorld(pointer.x, pointer.y);
			(mouseJoint as planck.MouseJoint).setTarget(target);
		}
		world.step(delta);
		syncDom();
		animationId = requestAnimationFrame(step);
	};

	const teardown = () => {
		if (animationId) cancelAnimationFrame(animationId);
		animationId = null;
		if (mouseJoint && world) {
			world.destroyJoint(mouseJoint);
		}
		mouseJoint = null;
		bodies = [];
		itemSizes = [];
		itemOrder = [];
		ground = null;
		world = null;
		lastTime = 0;
	};

	const activate = () => {
		if (active) return;
		active = true;
		if (world) {
			world.setGravity(planck.Vec2(0, 18));
		}
		lastTime = 0;
		if (!animationId) {
			animationId = requestAnimationFrame(step);
		}
	};

	const setup = () => {
		teardown();
		updateBounds();
		if (!bounds.width || !bounds.height) return;

		world = planck.World({ gravity: active ? planck.Vec2(0, 18) : planck.Vec2(0, 0) });
		ground = world.createBody();

		const wallThickness = 120;
		const width = bounds.width;
		const height = bounds.height;
		const layoutHeight = bounds.containerHeight;
		const halfWall = wallThickness / 2;

		const walls = [
			{ x: width / 2, y: height + halfWall, w: width, h: wallThickness },
			{ x: -halfWall, y: height / 2, w: wallThickness, h: height * 2 },
			{ x: width + halfWall, y: height / 2, w: wallThickness, h: height * 2 },
			{ x: width / 2, y: -halfWall, w: width, h: wallThickness }
		];

		walls.forEach((wall) => {
			const body = world!.createBody();
			body.createFixture(planck.Box(wall.w / 2 / scale, wall.h / 2 / scale), {
				restitution: 0.2,
				friction: 0.6
			});
			body.setPosition(toWorld(wall.x, wall.y));
		});

		const padding = 24;
		const colGap = 20;
		const rowGap = 10;
		const count = items.length;
		itemOrder = Array.from({ length: count }, (_, index) => index);
		itemSizes = itemOrder.map((index) => {
			const el = items[index];
			const rect = el.getBoundingClientRect();
			return {
				width: rect.width || 160,
				height: rect.height || 48
			};
		});

		const maxWidth = Math.max(...itemSizes.map((size) => size.width));
		const usableWidth = Math.max(1, width - padding * 2);
		const usableHeight = Math.max(1, layoutHeight - padding * 2);
		const columns = Math.max(1, Math.floor((usableWidth + colGap) / (maxWidth + colGap)));
		const otherCount = Math.max(0, count - 1);
		const rows = Math.ceil(otherCount / columns) + 1;
		const cellWidth = Math.max(1, (usableWidth - colGap * (columns - 1)) / columns);
		const cellHeight = Math.max(1, (usableHeight - rowGap * (rows - 1)) / rows);

		bodies = itemOrder.map((index, orderIndex) => {
			const size = itemSizes[orderIndex];
			const itemWidth = size?.width ?? 160;
			const itemHeight = size?.height ?? 48;
			const isFeatured = orderIndex === 0;
			const layoutIndex = isFeatured ? 0 : orderIndex - 1;
			const column = isFeatured ? Math.floor(columns / 2) : layoutIndex % columns;
			const row = isFeatured ? 0 : Math.floor(layoutIndex / columns) + 1;
			const targetX = isFeatured
				? width / 2
				: padding + column * (cellWidth + colGap) + cellWidth / 2;
			const targetY = padding + row * (cellHeight + rowGap) + cellHeight / 2;
			const minX = itemWidth / 2 + padding;
			const maxX = width - itemWidth / 2 - padding;
			const minY = itemHeight / 2 + padding;
			const maxY = height - itemHeight / 2 - padding;
			const positionX = Math.min(maxX, Math.max(minX, targetX));
			const positionY = Math.min(maxY, Math.max(minY, targetY));

			const body = world!.createDynamicBody({
				position: toWorld(positionX, positionY),
				linearDamping: 0.15,
				angularDamping: 0.2
			});

			body.createFixture(planck.Box(itemWidth / 2 / scale, itemHeight / 2 / scale), {
				density: 1,
				friction: 0.6,
				restitution: 0.2
			});

			return body;
		});

		syncDom();
		if (active) {
			animationId = requestAnimationFrame(step);
		}
	};

	const updatePointer = () => {
		updateBounds();
	};

	const getPointerPosition = (event: PointerEvent) => {
		pointer.x = event.clientX - bounds.left;
		pointer.y = event.clientY - bounds.top;
	};

	const handlePointerDown = (event: PointerEvent) => {
		const targetEl = event.target as HTMLElement | null;
		if (targetEl?.closest('.playground-reset')) return;
		if (!world || !ground) return;
		activate();
		if (activePointerId !== null) return;
		activePointerId = event.pointerId;
		container.setPointerCapture(activePointerId);
		updateBounds();
		getPointerPosition(event);
		pointer.active = true;

		const target = toWorld(pointer.x, pointer.y);
		const aabb = new planck.AABB(target, target);
		let pickedBody: planck.Body | null = null;
		world.queryAABB(aabb, (fixture) => {
			const body = fixture.getBody();
			if (body.isDynamic() && fixture.testPoint(target)) {
				pickedBody = body;
				return false;
			}
			return true;
		});

		if (pickedBody) {
			const bodyRef = pickedBody as planck.Body;
			const jointDef = {
				maxForce: 1500 * bodyRef.getMass(),
				frequencyHz: 6,
				dampingRatio: 0.7,
				bodyA: ground,
				bodyB: bodyRef,
				target
			};
			mouseJoint = world.createJoint(planck.MouseJoint(jointDef)) as planck.MouseJoint;
			bodyRef.setAwake(true);
		}
	};

	const handlePointerMove = (event: PointerEvent) => {
		if (activePointerId !== event.pointerId) return;
		getPointerPosition(event);
	};

	const handlePointerUp = (event: PointerEvent) => {
		if (activePointerId !== event.pointerId) return;
		activePointerId = null;
		pointer.active = false;
		if (mouseJoint && world) {
			world.destroyJoint(mouseJoint);
			mouseJoint = null;
		}
		container.releasePointerCapture(event.pointerId);
	};

	container.addEventListener('pointerdown', handlePointerDown);
	container.addEventListener('pointermove', handlePointerMove);
	container.addEventListener('pointerup', handlePointerUp);
	container.addEventListener('pointerleave', handlePointerUp);
	container.addEventListener('pointercancel', handlePointerUp);

	setup();

	return {
		refresh: setup,
		updatePointer,
		activate,
		destroy: () => {
			container.removeEventListener('pointerdown', handlePointerDown);
			container.removeEventListener('pointermove', handlePointerMove);
			container.removeEventListener('pointerup', handlePointerUp);
			container.removeEventListener('pointerleave', handlePointerUp);
			container.removeEventListener('pointercancel', handlePointerUp);
			teardown();
		}
	};
}
