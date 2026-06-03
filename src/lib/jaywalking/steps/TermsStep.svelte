<script lang="ts">
	import Screen from '$lib/jaywalking/components/Screen.svelte';
	import Button from '$lib/jaywalking/components/Button.svelte';

	type Locale = string;
	type StringKey = string;

	export let locale: Locale;
	export let t: (activeLocale: Locale, key: StringKey | string) => string;
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
		<p>{t(locale, 'terms.body.1')}</p>
		<p>{t(locale, 'terms.body.2')}</p>
		<p>{t(locale, 'terms.body.3')}</p>
		<p>{t(locale, 'terms.body.4')}</p>
		<p>{t(locale, 'terms.body.5')}</p>
		<p>{t(locale, 'terms.body.6')}</p>
		<p>{t(locale, 'terms.body.7')}</p>
		<p>{t(locale, 'terms.body.8')}</p>
		<p>{t(locale, 'terms.body.9')}</p>
		<p>{t(locale, 'terms.body.10')}</p>
		<p>{t(locale, 'terms.body.11')}</p>
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
</style>
