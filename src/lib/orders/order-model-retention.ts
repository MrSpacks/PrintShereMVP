import type { OrderStatus } from "@/types/order";

/** Сколько дней хранить модель после завершения обработки заказа */
export const MODEL_RETENTION_DAYS = 30;

/**
 * Статусы, после которых модель ещё нужна мейкеру/клиенту,
 * но уже можно поставить срок автоудаления.
 */
export const MODEL_RETENTION_SCHEDULE_STATUSES: OrderStatus[] = [
  "delivered",
  "completed",
  "refunded",
];

/** Дата, после которой cron удалит файл модели из хранилища */
export function computeModelRetainUntil(from: Date = new Date()): Date {
  const until = new Date(from);
  until.setUTCDate(until.getUTCDate() + MODEL_RETENTION_DAYS);
  return until;
}

export function shouldScheduleModelRetention(status: OrderStatus): boolean {
  return MODEL_RETENTION_SCHEDULE_STATUSES.includes(status);
}

/** Файл ещё доступен для скачивания (не удалён и срок не истёк) */
export function isModelFileAvailable(order: {
  fileUrl: string | null;
  fileDeletedAt: Date | null;
  modelRetainUntil: Date | null;
}): boolean {
  if (!order.fileUrl || order.fileDeletedAt) return false;
  if (!order.modelRetainUntil) return true;
  return order.modelRetainUntil.getTime() > Date.now();
}

/** Показывать предупреждение о скором удалении модели */
export function shouldShowModelRetentionNotice(order: {
  fileUrl: string | null;
  fileDeletedAt: Date | null;
  modelRetainUntil: Date | null;
}): boolean {
  return (
    Boolean(order.fileUrl) &&
    !order.fileDeletedAt &&
    order.modelRetainUntil !== null
  );
}
