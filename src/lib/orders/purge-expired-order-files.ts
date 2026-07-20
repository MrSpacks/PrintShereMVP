import { deleteOrderModelFile } from "@/lib/orders/order-file-storage";
import { prisma } from "@/lib/prisma";

export interface PurgeExpiredOrderFilesResult {
  purged: number;
  errors: string[];
}

/**
 * Удаляет файлы моделей, у которых истёк modelRetainUntil.
 * Записи заказов сохраняются, очищается только fileUrl.
 */
export async function purgeExpiredOrderFiles(): Promise<PurgeExpiredOrderFilesResult> {
  const now = new Date();
  const orders = await prisma.order.findMany({
    where: {
      fileUrl: { not: null },
      fileDeletedAt: null,
      modelRetainUntil: { lte: now },
    },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
    },
    take: 100,
  });

  let purged = 0;
  const errors: string[] = [];

  for (const order of orders) {
    if (!order.fileUrl) continue;

    try {
      await deleteOrderModelFile(order.id, order.fileName, order.fileUrl);
      await prisma.order.update({
        where: { id: order.id },
        data: {
          fileUrl: null,
          fileDeletedAt: now,
        },
      });
      purged += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown purge error";
      errors.push(`${order.id}: ${message}`);
    }
  }

  return { purged, errors };
}
