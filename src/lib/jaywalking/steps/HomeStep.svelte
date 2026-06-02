<script lang="ts">
	import IconButton from "$lib/jaywalking/components/IconButton.svelte";
	import IconGrid from "$lib/jaywalking/components/IconGrid.svelte";

	type Locale = string;
	type StringKey = string;

	export let localTime: string;
	export let locale: Locale;
	export let t: (activeLocale: Locale, key: StringKey | string) => string;
	export let openGate: () => void;
	export let quickActions: Array<{ id: string; src: string; labelKey: StringKey; dot?: boolean }>;
	export let tabs: StringKey[];
	export let iconItems: Array<Record<string, unknown>>;
	export let bannerImg: string;
</script>

<div class="page">
	<header class="hero">
		<div class="status-row">
			<span class="time">{localTime}</span>
			<button class="city" type="button" onclick={openGate}>
				<span>{t(locale, "city")}</span>
				<span class="chev">v</span>
			</button>
		</div>

		<div class="search-row">
			<div
				class="search-box"
				role="button"
				tabindex="0"
				onclick={openGate}
				onkeydown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						openGate();
					}
				}}
			>
				<span class="search-icon">o</span>
				<input
					type="text"
					placeholder={t(locale, "searchPlaceholder")}
					readonly
					onfocus={openGate}
				/>
				<button class="search-btn" type="button" onclick={openGate}>
					{t(locale, "searchButton")}
				</button>
			</div>
			<button class="ai-btn" type="button" onclick={openGate}>
				{t(locale, "ai")}
			</button>
		</div>

		<div class="quick-actions">
			{#each quickActions as action (action.id)}
				<IconButton
					src={action.src}
					label={t(locale, action.labelKey)}
					size="sm"
					showDot={action.dot}
					onClick={openGate}
				/>
			{/each}
		</div>

		<div class="banner" style={`background-image: url(${bannerImg});`}>
			<div class="banner-content">
				<span class="banner-tag">{t(locale, "banner.tag")}</span>
				<span class="banner-sub">{t(locale, "banner.sub")}</span>
			</div>
		</div>
	</header>

	<section class="card tabs">
		{#each tabs as tab (tab)}
			<button class="tab" type="button" onclick={openGate}>
				{t(locale, tab)}
			</button>
		{/each}
	</section>

	<section class="card grid-card">
		<IconGrid items={iconItems} locale={locale} getLabel={t} onSelect={openGate} />
	</section>

	<button class="card notice" type="button" onclick={openGate}>
		<span class="notice-dot" aria-hidden="true"></span>
		<span>{t(locale, "notice")}</span>
	</button>

	<section class="card welcome">
		<div class="welcome-head">
			<h2>{t(locale, "welcome")}</h2>
			<button class="pill" type="button" onclick={openGate}>
				{t(locale, "section.explore")}
			</button>
		</div>
		<div class="promo-grid">
			<button class="promo promo-one" type="button" onclick={openGate}>
				<span>{t(locale, "promo.one.subtitle")}</span>
				<strong>{t(locale, "promo.one.title")}</strong>
			</button>
			<button class="promo promo-two" type="button" onclick={openGate}>
				<span>{t(locale, "promo.two.subtitle")}</span>
				<strong>{t(locale, "promo.two.title")}</strong>
			</button>
		</div>
	</section>

	<nav class="bottom-nav">
		<button type="button" onclick={openGate}>
			{t(locale, "bottom.home")}
		</button>
		<button type="button" onclick={openGate}>
			{t(locale, "bottom.video")}
		</button>
		<button type="button" onclick={openGate}>
			{t(locale, "bottom.message")}
		</button>
		<button type="button" onclick={openGate}>
			{t(locale, "bottom.account")}
		</button>
	</nav>
</div>
