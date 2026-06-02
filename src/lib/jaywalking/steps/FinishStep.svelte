<script lang="ts">
	import Screen from "$lib/jaywalking/components/Screen.svelte";
	import Button from "$lib/jaywalking/components/Button.svelte";

	type Locale = string;
	type StringKey = string;

	export let locale: Locale;
	export let t: (activeLocale: Locale, key: StringKey | string) => string;
	export let onRestart: () => void;
</script>

<Screen 
	class="finish" 
	title={t(locale, "finish.title")} 
	subtitle={t(locale, "finish.body")}
>
	<Button variant="primary" onclick={onRestart}>
		{t(locale, "finish.restart")}
	</Button>
</Screen>
