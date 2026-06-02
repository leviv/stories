<script lang="ts">
	import IconButton from "$lib/jaywalking/components/IconButton.svelte";
	import IconGrid from "$lib/jaywalking/components/IconGrid.svelte";
	import type { IconItem } from "$lib/jaywalking/iconData";

	type Locale = "zh" | "en";
	type StringKey = string;

	export let localTime: string;
	export let locale: Locale;
	export let t: (activeLocale: Locale, key: StringKey | string) => string;
	export let openGate: () => void;
	export let quickActions: Array<{ id: string; src: string; labelKey: StringKey; dot?: boolean }>;
	export let tabs: StringKey[];
	export let iconItems: IconItem[];
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

<style>
	.page {
		position: relative;
		min-height: 100vh;
		padding: 24px 140px 120px 24px;
		overflow-x: hidden;
	}

	.page::before {
		content: "";
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.8), transparent 55%),
			linear-gradient(180deg, #e5f0ff 0%, #eef2f8 40%, #f6f8fb 100%);
		z-index: -1;
	}

	.hero {
		padding: 18px 18px 22px;
		border-radius: 26px;
		background: linear-gradient(180deg, #1f6bff 0%, #2f94ff 55%, rgba(255, 255, 255, 0.8) 100%);
		box-shadow: 0 18px 40px rgba(16, 64, 160, 0.2);
		color: #fff;
	}

	.status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
		font-weight: 600;
	}

	.time {
		font-size: 20px;
		letter-spacing: 0.5px;
	}

	.city {
		border: none;
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
		padding: 6px 12px;
		border-radius: 999px;
		font-size: 14px;
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
	}

	.chev {
		font-size: 12px;
		line-height: 1;
	}

	.search-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 10px;
		align-items: center;
	}

	.search-box {
		background: #fff;
		border-radius: 999px;
		padding: 6px 10px;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 8px;
		color: #3b4b62;
		box-shadow: 0 8px 20px rgba(9, 40, 110, 0.2);
	}

	.search-icon {
		width: 16px;
		height: 16px;
		border: 2px solid #9aa6b2;
		border-radius: 50%;
		position: relative;
		display: inline-block;
		font-size: 0;
	}

	.search-icon::after {
		content: "";
		position: absolute;
		width: 8px;
		height: 2px;
		background: #9aa6b2;
		right: -6px;
		bottom: -3px;
		transform: rotate(45deg);
		border-radius: 999px;
	}

	.search-box input {
		border: none;
		outline: none;
		font-size: 13px;
		background: transparent;
		color: #344055;
	}

	.search-btn {
		border: none;
		background: linear-gradient(135deg, #1d6dff, #3bb3ff);
		color: #fff;
		padding: 6px 12px;
		border-radius: 999px;
		font-weight: 600;
		cursor: pointer;
	}

	.ai-btn {
		border: none;
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
		padding: 10px 14px;
		border-radius: 18px;
		font-weight: 600;
		cursor: pointer;
	}

	.quick-actions {
		margin-top: 18px;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	.banner {
		margin-top: 18px;
		height: 140px;
		border-radius: 22px;
		background-size: cover;
		background-position: center;
		position: relative;
		overflow: hidden;
	}

	.banner::after {
		content: "";
		position: absolute;
		inset: 0;
		background: linear-gradient(120deg, rgba(15, 35, 80, 0.1), rgba(10, 20, 40, 0.5));
	}

	.banner-content {
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 6px;
		padding: 16px;
		font-family: "ZCOOL XiaoWei", serif;
	}

	.banner-tag {
		font-size: 22px;
		font-weight: 700;
	}

	.banner-sub {
		font-size: 14px;
		letter-spacing: 1px;
	}

	.card {
		margin-top: 18px;
		background: #fff;
		border-radius: 24px;
		box-shadow: 0 14px 30px rgba(20, 40, 80, 0.12);
		padding: 12px 16px;
	}

	.tabs {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 6px;
		align-items: center;
	}

	.tab {
		border: none;
		background: transparent;
		padding: 8px 0;
		font-weight: 600;
		color: #536178;
		cursor: pointer;
	}

	.tab:first-child {
		color: #0b1b33;
		position: relative;
	}

	.tab:first-child::after {
		content: "";
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: 0;
		width: 18px;
		height: 3px;
		border-radius: 999px;
		background: #1f6bff;
	}

	.grid-card {
		padding: 10px 16px 18px;
	}

	.notice {
		display: flex;
		align-items: center;
		gap: 12px;
		border: none;
		width: 100%;
		cursor: pointer;
		font-size: 14px;
		color: #425065;
		background: #fff;
	}

	.notice-dot {
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: #ff3b30;
	}

	.welcome {
		padding: 18px;
	}

	.welcome-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 14px;
	}

	.welcome h2 {
		margin: 0;
		font-size: 20px;
	}

	.pill {
		border: none;
		background: #f0f4ff;
		color: #2f5cff;
		padding: 6px 12px;
		border-radius: 999px;
		font-weight: 600;
		cursor: pointer;
	}

	.promo-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}

	.promo {
		border: none;
		text-align: left;
		padding: 16px;
		border-radius: 18px;
		color: #1d2b3c;
		cursor: pointer;
		display: grid;
		gap: 8px;
		min-height: 120px;
	}

	.promo strong {
		font-size: 20px;
	}

	.promo-one {
		background: linear-gradient(135deg, #f7c9ff, #c2c3ff);
	}

	.promo-two {
		background: linear-gradient(135deg, #9fe8ff, #b5f7ff);
	}

	.bottom-nav {
		position: fixed;
		left: 24px;
		right: 140px;
		bottom: 16px;
		background: #ffffff;
		border-radius: 22px;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		padding: 10px 14px;
		box-shadow: 0 18px 40px rgba(20, 40, 80, 0.2);
	}

	.bottom-nav button {
		border: none;
		background: transparent;
		color: #4b5a70;
		font-weight: 600;
		cursor: pointer;
	}

	@media (max-width: 720px) {
		.page {
			padding: 96px 16px 120px;
		}

		.bottom-nav {
			left: 16px;
			right: 16px;
		}
	}

	@media (max-width: 540px) {
		.tabs {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			row-gap: 8px;
		}

		.promo-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
