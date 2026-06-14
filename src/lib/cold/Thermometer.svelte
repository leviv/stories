<script lang="ts">
	const {
		storyStep,
		maxSteps
	}: {
		storyStep: number;
		maxSteps: number;
	} = $props();

	// Use the same image step logic as the background to ensure thermometer stays in sync
	const currentImageStep = $derived(storyStep > 0 ? Math.ceil(storyStep / 2) : 0);
	const totalImageSteps = $derived(Math.ceil((maxSteps - 1) / 2));

	// Step 0 is 100% (Normal). Step 1 drops to 0% (Most cold). Then it warms up to 100% at the end.
	const percentage = $derived(
		currentImageStep === 0 
			? 100 
			: Math.min(100, (100 / Math.max(1, totalImageSteps - 1)) * (currentImageStep - 1))
	);
</script>

<div class="thermometer-container">
	<div class="labels">
		<span class="label normal">normal</span>
		<span class="label cold">very cold</span>
	</div>
	<div class="bar-bg">
		<div class="bar-fill" style="height: {percentage}%;"></div>
	</div>
</div>

<style>
	.thermometer-container {
		position: fixed;
		right: 30px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: stretch;
		gap: 15px;
		height: 300px;
		z-index: 20;
	}

	.labels {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		text-align: right;
		color: white;
		font-size: 0.8rem;
		text-transform: uppercase;
		font-weight: 500;
		letter-spacing: 0.05em;
		padding: 2px 0;
	}

	.label {
		position: relative;
	}

	.label::after {
		content: '';
		position: absolute;
		right: -10px;
		top: 50%;
		width: 5px;
		height: 1px;
		background: white;
	}

	.bar-bg {
		width: 8px;
		background: rgba(255, 255, 255, 0.2);
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		border: 1px solid rgba(255, 255, 255, 0.5);
	}

	.bar-fill {
		width: 100%;
		background: #ff0000;
		transition: height 1.5s ease-in-out;
	}
</style>
