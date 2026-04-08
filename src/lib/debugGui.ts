import GUI from 'lil-gui';

export function createDebugGui(params: Record<string, unknown>, drawAll: () => void): () => void {
	const gui = new GUI({ title: 'Line Settings' });
	gui.domElement.style.display = 'none';

	gui.add(params, 'roughness', 0, 5, 0.1).onChange(drawAll);
	gui
		.add(params, 'fillStyle', [
			'hachure',
			'solid',
			'zigzag',
			'cross-hatch',
			'dots',
			'dashed',
			'zigzag-line'
		])
		.onChange(drawAll);
	gui.add(params, 'bowing', 0, 10, 0.5).onChange(drawAll);
	gui.add(params, 'fillWeight', 0.5, 8, 0.5).onChange(drawAll);
	gui.add(params, 'hachureGap', 1, 15, 0.5).onChange(drawAll);

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'd') {
			const el = gui.domElement;
			el.style.display = el.style.display === 'none' ? '' : 'none';
		}
	}

	window.addEventListener('keydown', onKeyDown);

	return () => {
		window.removeEventListener('keydown', onKeyDown);
		gui.destroy();
	};
}
