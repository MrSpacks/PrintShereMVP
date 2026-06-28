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
  await refundActiveOrders(tx, { makerId });

  const orderCount = await tx.order.count({ where: { makerId } });
  if (orderCount > 0) {
    throw new Error("WORKSHOP_HAS_ORDERS");
  }

  await tx.makerFilament.deleteMany({ where: { makerId } });
  await tx.makerPrinter.deleteMany({ where: { makerId } });
  await tx.maker.delete({ where: { id: makerId } });

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

    for (const maker of ownedMakers) {
      await tx.maker.update({
        where: { id: maker.id },
        data: {
          ownerUserId: ARCHIVE_USER_ID,
          status: "hidden",
        },
      });
    }

    await tx.user.delete({ where: { id: userId } });

    return { refundedOrders: refundedAsCustomer + refundedAsMaker };
  });
}
