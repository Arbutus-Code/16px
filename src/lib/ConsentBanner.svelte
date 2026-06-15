<script lang="ts">
  const STORAGE_KEY = "analytics-consent";
  const BANNER_SHOWN_KEY = "consent-banner-shown";
  const UMAMI_DISABLED_KEY = "umami.disabled";

  let visible = $state(false);
  let animateIn = $state(false);

  function checkShouldShow() {
    const hasConsent = localStorage.getItem(STORAGE_KEY);
    const bannerShown = localStorage.getItem(BANNER_SHOWN_KEY);

    if (hasConsent === null && bannerShown !== "true") {
      setTimeout(() => {
        visible = true;
        requestAnimationFrame(() => {
          animateIn = true;
        });
      }, 1500);
    }
  }

  function hideBanner() {
    animateIn = false;
    setTimeout(() => {
      visible = false;
    }, 300);
  }

  function setConsent(enabled: boolean) {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    localStorage.setItem(BANNER_SHOWN_KEY, "true");
    hideBanner();

    window.dispatchEvent(
      new CustomEvent("analytics-consent-change", {
        detail: { enabled },
      }),
    );

    if (!enabled) {
      localStorage.setItem(UMAMI_DISABLED_KEY, "1");
    } else {
      localStorage.removeItem(UMAMI_DISABLED_KEY);
    }
  }

  $effect(() => {
    checkShouldShow();
  });
</script>

{#if visible}
  <div
    class="consent-banner"
    class:consent-banner--visible={animateIn}
    role="region"
    aria-label="Analytics consent"
  >
    <div class="consent-inner">
      <p class="consent-text">
        We use privacy-focused analytics to understand how visitors use this
        site.
        <a href="/privacy/" class="consent-link">Read our privacy policy</a>
      </p>
      <div class="consent-actions">
        <button
          type="button"
          class="consent-btn consent-btn--decline"
          onclick={() => setConsent(false)}
        >
          Decline
        </button>
        <button
          type="button"
          class="consent-btn consent-btn--accept"
          onclick={() => setConsent(true)}
        >
          Accept
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .consent-banner {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    z-index: 100;
    transform: translateY(100%);
    transition: transform 0.3s ease-out;
  }

  .consent-banner--visible {
    transform: translateY(0);
  }

  .consent-inner {
    border-top: 1px solid var(--color-border);
    background: rgba(10, 10, 15, 0.95);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
  }

  @media (min-width: 640px) {
    .consent-inner {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .consent-text {
    font-size: 0.8125rem;
    color: var(--color-text-dim);
    line-height: 1.5;
  }

  .consent-link {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }

  .consent-link:hover {
    color: var(--color-accent-hover);
  }

  .consent-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .consent-btn {
    padding: 0.4rem 1rem;
    font-size: 0.75rem;
    font-family: var(--font-mono);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 4px;
    cursor: pointer;
    transition:
      border-color 0.15s,
      color 0.15s,
      background-color 0.15s;
  }

  .consent-btn--decline {
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text-dim);
  }

  .consent-btn--decline:hover {
    border-color: var(--color-border-bright);
    color: var(--color-text);
  }

  .consent-btn--accept {
    border: 1px solid var(--color-accent);
    background: var(--color-accent);
    color: var(--color-bg);
  }

  .consent-btn--accept:hover {
    background: var(--color-accent-hover);
    border-color: var(--color-accent-hover);
  }
</style>
