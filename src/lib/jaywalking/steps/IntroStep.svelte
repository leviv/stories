<script lang="ts">
	import GlitchScreen from '../components/GlitchScreen.svelte';

	const { onStart }: { onStart: () => void } = $props();
</script>

<GlitchScreen 
	title="Can you survive Digital China? / 你能否在数字化中国生存下去?"
	buttonText="Start"
	onAction={onStart}
>
	{#snippet content()}
		<p>
			My first month in China has been plagued by navigating the vast and confusing world of
			AliPay and WeChat. Navigating dozens of login screens, identity verifcations, and captchas
			that may or may not work with American credentials.
		</p>
		<br />
		<p>How will you fare? Can you sign up for an account without doing anything wrong?</p>
	{/snippet}
</GlitchScreen>

