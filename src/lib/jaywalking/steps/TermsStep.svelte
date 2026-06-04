<script lang="ts">
	import Screen from '$lib/jaywalking/components/Screen.svelte';
	import Button from '$lib/jaywalking/components/Button.svelte';

	type Locale = string;
	type StringKey = string;

	export let locale: Locale;
	export let t: (activeLocale: Locale, key: StringKey | string) => string;
	export let termsData: { intro: string[]; sections: { title: string; body: string[] }[] };
	export let termsLabel: () => string;
	export let onBack: () => void;
	export let onAgree: () => void;
</script>

{#snippet subtitleSnippet()}
	<p class="timer">{t(locale, 'terms.timer')}: {termsLabel()}</p>
{/snippet}

{#snippet actionsSnippet()}
	<Button variant="ghost" onclick={onBack}>
		{t(locale, 'terms.back')}
	</Button>
	<Button variant="primary" onclick={onAgree}>
		{t(locale, 'terms.agree')}
	</Button>
{/snippet}

<Screen
	class="terms"
	title={t(locale, 'terms.title')}
	subtitle={subtitleSnippet}
	actions={actionsSnippet}
>
	<div class="terms-body">
		{#each termsData.intro as paragraph, i (i)}
			<p>{paragraph}</p>
		{/each}
		{#each termsData.sections as section (section.title)}
			<div class="section">
				<h3>{section.title}</h3>
				{#each section.body as paragraph, j (j)}
					<p>{paragraph}</p>
				{/each}
			</div>
		{/each}
	</div>
</Screen>

<style>
	.timer {
		margin: 0;
		font-weight: 600;
		color: #1c2d44;
	}

	.terms-body {
		max-height: 320px;
		overflow-y: auto;
		padding-right: 8px;
		display: grid;
		gap: 12px;
	}

	.terms-body p {
		margin: 0;
		color: #445266;
		line-height: 1.5;
	}

	.section {
		display: grid;
		gap: 8px;
		margin-top: 8px;
	}

	.section h3 {
		margin: 0;
		font-size: 1.1em;
		color: #1c2d44;
	}
</style>
