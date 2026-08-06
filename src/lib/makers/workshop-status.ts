import type { MakerStatus } from "@/types/maker";

/**
 * Статусы, которые мастер видит в дашборде.
 * Все 3 статуса из БД теперь доступны в UI.
 */
export const WORKSHOP_UI_STATUSES = ["available", "busy", "hidden"] as const;

export type WorkshopUiStatus = (typeof WORKSHOP_UI_STATUSES)[number];

/**
 * Статус из БД напрямую используется в UI.
 */
export function normalizeWorkshopUiStatus(status: MakerStatus): WorkshopUiStatus {
  return status;
}

/** Мастерская принимает новые заказы и видна как активная на карте. */
export function isWorkshopActive(status: MakerStatus): boolean {
  return status === "available";
}

/** Статусы, при которых новый заказ отклоняется на сервере. */
export function isWorkshopAcceptingOrders(status: MakerStatus): boolean {
  return status === "available";
}
