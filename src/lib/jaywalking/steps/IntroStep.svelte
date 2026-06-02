<script lang="ts">
	export let onStart: () => void;
</script>

<div class="screen intro">
	<div class="screen-card">
		<h1>Welcome to Jaywalking+</h1>
		<p>
			A short guided tour. You will review the app, confirm your identity, and
			finish a quick agreement.
		</p>
		<button class="primary" type="button" onclick={onStart}>
			Start
		</button>
	</div>
</div>
