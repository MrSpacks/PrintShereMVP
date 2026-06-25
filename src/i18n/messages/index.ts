import type { Locale } from "@/i18n/config";
import { csMessages, type Messages } from "@/i18n/messages/cs";
import { enMessages } from "@/i18n/messages/en";

export const messagesByLocale: Record<"cs" | "en", Messages> = {
  cs: csMessages,
  en: enMessages,
};

export type { Messages } from "@/i18n/messages/cs";

export function getMessages(locale: Locale) {
  return messagesByLocale[locale];
}
