<script lang="ts">
	import Screen from "$lib/jaywalking/components/Screen.svelte";
	import Button from "$lib/jaywalking/components/Button.svelte";

	type Locale = string;
	type StringKey = string;

	export let locale: Locale;
	export let t: (activeLocale: Locale, key: StringKey | string) => string;
	export let onStart: () => void;
</script>

<Screen 
	class="intro" 
	title={t(locale, "intro.title")} 
	subtitle={t(locale, "intro.body")}
>
	<Button variant="primary" onclick={onStart}>
		{t(locale, "intro.start")}
	</Button>
</Screen>
