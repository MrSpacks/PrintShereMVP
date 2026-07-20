export type CookieConsentChoice = "accepted" | "rejected";

export interface CookieConsentState {
  choice: CookieConsentChoice;
  updatedAt: string;
  version: number;
}

export const COOKIE_CONSENT_STORAGE_KEY = "printshare_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentState;
    if (
      parsed.version !== COOKIE_CONSENT_VERSION ||
      (parsed.choice !== "accepted" && parsed.choice !== "rejected")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookieConsent(choice: CookieConsentChoice): CookieConsentState {
  const state: CookieConsentState = {
    choice,
    updatedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(state));
  return state;
}

/** Optional analytics may load only after explicit accept */
export function canLoadOptionalTracking(): boolean {
  return readCookieConsent()?.choice === "accepted";
}
