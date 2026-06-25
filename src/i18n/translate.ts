import type { Locale } from "@/i18n/config";

type MessageValue = string | MessageTree;
type MessageTree = { [key: string]: MessageValue };

export function translate(
  messages: MessageTree,
  key: string,
  params?: Record<string, string | number>
): string {
  const parts = key.split(".");
  let current: MessageValue = messages;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return key;
    }
    current = current[part];
  }

  if (typeof current !== "string") {
    return key;
  }

  if (!params) {
    return current;
  }

  return current.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params[name] ?? `{${name}}`)
  );
}

export function getIntlLocale(locale: Locale): string {
  return locale === "cs" ? "cs-CZ" : "en-GB";
}
