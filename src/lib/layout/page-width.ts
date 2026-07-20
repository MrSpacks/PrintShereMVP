/**
 * Ширина контентной колонки для страниц настроек, профиля, заказов и т.д.
 * Используется в `AppPage`, чтобы не дублировать tailwind-классы.
 */
export const APP_PAGE_WIDTH_CLASS = {
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  "2xl": "max-w-6xl",
} as const;

export type AppPageWidth = keyof typeof APP_PAGE_WIDTH_CLASS;

export function getAppPageWidthClass(width: AppPageWidth = "xl"): string {
  return APP_PAGE_WIDTH_CLASS[width];
}
