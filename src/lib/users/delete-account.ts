import type { OrderStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isActiveOrderStatus } from "@/lib/orders/order-workflow";

export const ARCHIVE_USER_ID = "user-archive";

const TERMINAL_STATUSES: OrderStatus[] = [
  "completed",
  "cancelled",
  "refunded",
];

type Tx = Prisma.TransactionClient;

export async function refundActiveOrders(
  tx: Tx,
  where: Prisma.OrderWhereInput
): Promise<number> {
  const activeOrders = await tx.order.findMany({
    where: {
      ...where,
      status: { notIn: TERMINAL_STATUSES },
    },
    select: { id: true, status: true },
  });

  if (activeOrders.length === 0) return 0;

  await tx.order.updateMany({
    where: { id: { in: activeOrders.map((order) => order.id) } },
    data: { status: "refunded" },
  });

  return activeOrders.length;
}

export async function countActiveOrdersForMaker(makerId: string): Promise<number> {
  return prisma.order.count({
    where: {
      makerId,
      status: { notIn: TERMINAL_STATUSES },
    },
  });
}

export async function countBlockingOrdersForUserDeletion(
  userId: string
): Promise<number> {
  const ownedMakerIds = await prisma.maker.findMany({
    where: { ownerUserId: userId },
    select: { id: true },
  });
  const makerIds = ownedMakerIds.map((maker) => maker.id);

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerId: userId },
        makerIds.length > 0 ? { makerId: { in: makerIds } } : undefined,
      ].filter(Boolean) as Prisma.OrderWhereInput[],
    },
    select: { id: true, status: true },
  });

  return orders.filter((order) => isActiveOrderStatus(order.status)).length;
}

export async function deleteMakerWorkshop(
  tx: Tx,
  makerId: string,
  ownerUserId: string
): Promise<void> {
  // Refund any active orders first
  const refundedCount = await refundActiveOrders(tx, { makerId });
  console.log("[deleteMakerWorkshop] Refunded orders:", refundedCount);

  // Check if there are still any active orders (should be 0 after refund)
  const activeOrderCount = await tx.order.count({
    where: {
      makerId,
      status: { notIn: TERMINAL_STATUSES },
    },
  });

  console.log("[deleteMakerWorkshop] Active orders after refund:", activeOrderCount);

  if (activeOrderCount > 0) {
    const activeOrders = await tx.order.findMany({
      where: {
        makerId,
        status: { notIn: TERMINAL_STATUSES },
      },
      select: { id: true, status: true },
    });
    console.error("[deleteMakerWorkshop] Blocking orders:", activeOrders);
    throw new Error("WORKSHOP_HAS_ACTIVE_ORDERS");
  }

  // Detach all orders from this workshop (preserves order history)
  const ordersToDetach = await tx.$executeRaw`
    UPDATE "Order" SET "makerId" = NULL WHERE "makerId" = ${makerId}
  `;
  
  console.log("[deleteMakerWorkshop] Detached orders from workshop:", ordersToDetach);

  // Delete workshop data
  await tx.makerFilament.deleteMany({ where: { makerId } });
  await tx.makerPrinter.deleteMany({ where: { makerId } });
  await tx.maker.delete({ where: { id: makerId } });

  // Update user's active workshop if needed
  const user = await tx.user.findUnique({
    where: { id: ownerUserId },
    select: { makerId: true },
  });

  if (user?.makerId === makerId) {
    const nextMaker = await tx.maker.findFirst({
      where: { ownerUserId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    await tx.user.update({
      where: { id: ownerUserId },
      data: { makerId: nextMaker?.id ?? null },
    });
  }
}

export async function deleteUserAccount(userId: string): Promise<{
  refundedOrders: number;
}> {
  return prisma.$transaction(async (tx) => {
    const ownedMakers = await tx.maker.findMany({
      where: { ownerUserId: userId },
      select: { id: true },
    });

    const refundedAsCustomer = await refundActiveOrders(tx, {
      customerId: userId,
    });

    let refundedAsMaker = 0;
    for (const maker of ownedMakers) {
      refundedAsMaker += await refundActiveOrders(tx, { makerId: maker.id });
    }

    const blockingOrders = await tx.order.count({
      where: {
        OR: [
          { customerId: userId },
          ownedMakers.length > 0
            ? { makerId: { in: ownedMakers.map((maker) => maker.id) } }
            : undefined,
        ].filter(Boolean) as Prisma.OrderWhereInput[],
        status: { notIn: TERMINAL_STATUSES },
      },
    });

    if (blockingOrders > 0) {
      throw new Error("ACTIVE_ORDERS_REMAIN");
    }

    // Delete all owned workshops (orders are already detached via SET NULL)
    for (const maker of ownedMakers) {
      // Detach all orders from this workshop
      await tx.$executeRaw`
        UPDATE "Order" SET "makerId" = NULL WHERE "makerId" = ${maker.id}
      `;
      
      // Delete workshop data
      await tx.makerFilament.deleteMany({ where: { makerId: maker.id } });
      await tx.makerPrinter.deleteMany({ where: { makerId: maker.id } });
      await tx.maker.delete({ where: { id: maker.id } });
    }

    await tx.user.delete({ where: { id: userId } });

    return { refundedOrders: refundedAsCustomer + refundedAsMaker };
  });
}
