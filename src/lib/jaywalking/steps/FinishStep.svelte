<script lang="ts">
	export let onRestart: () => void;
</script>

<div class="screen finish">
	<div class="screen-card">
		<h1>All set</h1>
		<p>Thanks for completing the flow. You are ready to continue.</p>
		<button class="primary" type="button" onclick={onRestart}>
			Restart
		</button>
	</div>
</div>
