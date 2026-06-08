<script lang="ts">
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

<div class="screen terms">
	<div class="screen-card">
		<h1>{t(locale, 'terms.title')}</h1>
		{@render subtitleSnippet()}

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

		<div class="screen-actions">
			{@render actionsSnippet()}
		</div>
	</div>
</div>

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

	.screen {
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.screen-card {
		width: min(720px, 92vw);
		background: #fff;
		border-radius: 20px;
		box-shadow: 0 20px 50px rgba(12, 30, 70, 0.18);
		padding: 28px;
		display: grid;
		gap: 16px;
	}

	.screen-card > h1 {
		margin: 0;
		font-size: 28px;
		color: #4c8c35;
	}

	.screen-card > p {
		margin: 0;
		color: #4c8c35;
		line-height: 1.5;
	}

	.screen-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	@media (max-width: 720px) {
		.screen {
			padding: 96px 16px 120px;
		}
	}
</style>
