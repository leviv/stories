<script lang="ts">
  export let showShame = false;
  export let name = "";
  export let photoSrc: string | null = null;
  export let message = "";
  export let anonymousLabel = "Anonymous user";
  export let photoFallbackLabel = "No photo";
</script>

<aside class="sidebar" aria-live="polite">
  {#if showShame}
    <div class="shame-card">
      <div class="shame-photo">
        {#if photoSrc}
          <img src={photoSrc} alt={name ? `${name} photo` : "User photo"} />
        {:else}
          <span class="photo-fallback">{photoFallbackLabel}</span>
        {/if}
      </div>
      <div class="shame-name">{name || anonymousLabel}</div>
      <p class="shame-text">{message}</p>
    </div>
  {/if}
</aside>

<style>
  .sidebar {
    position: fixed;
    right: 0;
    top: 0;
    width: 120px;
    height: 100vh;
    background: #ff3b30;
    z-index: 5;
    overflow: hidden;
    display: grid;
    place-items: center;
    padding: 16px 10px;
  }

  .shame-card {
    width: 100%;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 16px;
    padding: 12px 10px;
    text-align: center;
    box-shadow: 0 10px 24px rgba(40, 10, 10, 0.2);
  }

  .shame-photo {
    width: 72px;
    height: 72px;
    margin: 0 auto 8px;
    border-radius: 50%;
    overflow: hidden;
    background: #fff;
    display: grid;
    place-items: center;
    border: 2px solid #ff3b30;
  }

  .shame-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .photo-fallback {
    font-size: 10px;
    color: #8a2b2b;
    font-weight: 600;
  }

  .shame-name {
    font-size: 12px;
    font-weight: 700;
    color: #8a1010;
    margin-bottom: 6px;
    word-break: break-word;
  }

  .shame-text {
    font-size: 11px;
    color: #6b1f1f;
    line-height: 1.3;
    margin: 0;
  }

  @media (max-width: 720px) {
    .sidebar {
      width: 100%;
      height: 64px;
      left: 0;
      right: 0;
      place-items: center;
      padding: 8px 12px;
    }

    .shame-card {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      width: min(520px, 100%);
      text-align: left;
    }

    .shame-photo {
      width: 44px;
      height: 44px;
      margin: 0;
    }

    .shame-text {
      font-size: 10px;
    }
  }
</style>
