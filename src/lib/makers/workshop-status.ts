import type { MakerStatus } from "@/types/maker";

/**
 * Статусы, которые мастер видит в дашборде.
 * В БД по-прежнему хранятся available | busy | hidden,
 * но в UI оставляем только «работаю» и «не работаю».
 */
export const WORKSHOP_UI_STATUSES = ["available", "hidden"] as const;

export type WorkshopUiStatus = (typeof WORKSHOP_UI_STATUSES)[number];

/**
 * Приводит статус из БД к одному из двух значений UI.
 * `busy` и `hidden` считаются «не работаю» — пин на карте неактивен.
 */
export function normalizeWorkshopUiStatus(status: MakerStatus): WorkshopUiStatus {
  return status === "available" ? "available" : "hidden";
}

/** Мастерская принимает новые заказы и видна как активная на карте. */
export function isWorkshopActive(status: MakerStatus): boolean {
  return status === "available";
}

/** Статусы, при которых новый заказ отклоняется на сервере. */
export function isWorkshopAcceptingOrders(status: MakerStatus): boolean {
  return status === "available";
}
