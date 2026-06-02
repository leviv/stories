<script lang="ts">
	export let firstName: string;
	export let lastName: string;
	export let photoStep: "left" | "right" | "done";
	export let leftPhoto: string | null;
	export let rightPhoto: string | null;
	export let cameraError: string;
	export let videoEl: HTMLVideoElement | null;
	export let onBack: () => void;
	export let onContinue: () => void;
	export let onCapture: () => void;
	export let onReset: () => void;
	export let onRetry: () => void;
</script>

<div class="screen identity">
	<div class="screen-card">
		<h1>Identity Check</h1>
		<p>Enter your name, then take a photo looking left and right.</p>
		<div class="field-row">
			<label>
				<span>First name</span>
				<input type="text" bind:value={firstName} placeholder="First" />
			</label>
			<label>
				<span>Last name</span>
				<input type="text" bind:value={lastName} placeholder="Last" />
			</label>
		</div>

		<div class="camera-card">
			<div class="camera-preview">
				{#if photoStep === "done" && rightPhoto}
					<img src={rightPhoto} alt="Right look" />
				{:else if photoStep === "right" && leftPhoto}
					<img src={leftPhoto} alt="Left look" />
				{:else}
					<video bind:this={videoEl} playsinline muted></video>
				{/if}
			</div>
			<div class="camera-actions">
				<p class="prompt">
					{#if photoStep === "left"}
						Look left, then take your photo.
					{:else if photoStep === "right"}
						Look right, then take your photo.
					{:else}
						Photo capture complete.
					{/if}
				</p>
				{#if cameraError}
					<p class="error">{cameraError}</p>
					<button class="secondary" type="button" onclick={onRetry}>
						Try again
					</button>
				{:else}
					<button
						class="primary"
						type="button"
						onclick={onCapture}
						disabled={photoStep === "done"}
					>
						Take photo
					</button>
				{/if}
				<button class="ghost" type="button" onclick={onReset}>
					Reset photos
				</button>
			</div>
		</div>

		<div class="screen-actions">
			<button class="ghost" type="button" onclick={onBack}>
				Back
			</button>
			<button
				class="primary"
				type="button"
				onclick={onContinue}
				disabled={!firstName || !lastName || photoStep !== "done"}
			>
				Continue
			</button>
		</div>
	</div>
</div>
