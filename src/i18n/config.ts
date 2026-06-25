export const LOCALES = ["cs", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "cs";

export const LOCALE_STORAGE_KEY = "printshere-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  cs: "Čeština",
  en: "English",
};
