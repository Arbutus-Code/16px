const CONSENT_KEY = "analytics-consent";
const BANNER_SHOWN_KEY = "consent-banner-shown";
// Umami reads this key directly to disable tracking.
const UMAMI_DISABLED_KEY = "umami.disabled";

/** Whether anonymous analytics collection is allowed. Defaults to true. */
export function getAnalyticsConsent(): boolean {
  if (localStorage.getItem(UMAMI_DISABLED_KEY) === "1") return false;
  const stored = localStorage.getItem(CONSENT_KEY);
  return stored === null ? true : stored === "true";
}

/** Persists the analytics choice and notifies listeners on this page. */
export function setAnalyticsConsent(enabled: boolean) {
  localStorage.setItem(CONSENT_KEY, String(enabled));
  if (enabled) {
    localStorage.removeItem(UMAMI_DISABLED_KEY);
  } else {
    localStorage.setItem(UMAMI_DISABLED_KEY, "1");
  }
  window.dispatchEvent(
    new CustomEvent("analytics-consent-change", { detail: { enabled } }),
  );
}

/** Whether the consent banner still needs to be shown. */
export function shouldShowConsentBanner(): boolean {
  return (
    localStorage.getItem(CONSENT_KEY) === null &&
    localStorage.getItem(BANNER_SHOWN_KEY) !== "true"
  );
}

export function markConsentBannerShown() {
  localStorage.setItem(BANNER_SHOWN_KEY, "true");
}
