import { computeRefundStats } from "@/lib/admin/compute-refund-stats";
import {
  COMPLETED_GMV_STATUSES,
  IN_PROGRESS_GMV_STATUSES,
  NET_GMV_STATUSES,
  REFUNDED_STATUSES,
} from "@/lib/admin/order-revenue-buckets";
import { prisma } from "@/lib/prisma";

import type { AdminPlatformStats } from "@/types/admin";
import type { OrderStatus as ApiOrderStatus } from "@/types/order";

function getStripeStats(): AdminPlatformStats["stripe"] {
  const connected = Boolean(process.env.STRIPE_SECRET_KEY);

  return {
    connected,
    paymentsCapturedCzk: 0,
    pendingPayoutsCzk: 0,
    escrowHeldCzk: 0,
  };
}

export async function computePlatformStats(): Promise<AdminPlatformStats> {
  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);

  const [
    totalOrders,
    activeOrders,
    completedOrders,
    disputedOrders,
    openDisputes,
    uniqueCustomers,
    makersWithOrders,
    ordersLast7Days,
    ordersLast30Days,
    statusGroups,
    gmvNet,
    gmvCompleted,
    gmvInProgress,
    platformFeesNet,
    platformFeesCompleted,
    makerEarningsCompleted,
    refundedOrders,
  ] = await prisma.$transaction([
    prisma.order.count(),
    prisma.order.count({
      where: {
        status: {
          notIn: [...COMPLETED_GMV_STATUSES, "cancelled", "refunded"],
        },
      },
    }),
    prisma.order.count({
      where: { status: { in: COMPLETED_GMV_STATUSES } },
    }),
    prisma.order.count({ where: { status: "disputed" } }),
    prisma.dispute.count({ where: { status: "open" } }),
    prisma.user.count({ where: { orders: { some: {} } } }),
    prisma.maker.count({ where: { orders: { some: {} } } }),
    prisma.order.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.order.count({ where: { createdAt: { gte: last30Days } } }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { customerTotalCzk: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: NET_GMV_STATUSES } },
      _sum: { customerTotalCzk: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: COMPLETED_GMV_STATUSES } },
      _sum: { customerTotalCzk: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: IN_PROGRESS_GMV_STATUSES } },
      _sum: { customerTotalCzk: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: NET_GMV_STATUSES } },
      _sum: { platformFeeCzk: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: COMPLETED_GMV_STATUSES } },
      _sum: { platformFeeCzk: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: COMPLETED_GMV_STATUSES } },
      _sum: { printCostCzk: true },
    }),
    prisma.order.findMany({
      where: { status: { in: REFUNDED_STATUSES } },
      select: {
        customerTotalCzk: true,
        platformFeeCzk: true,
        dispute: { select: { refundAmountCzk: true } },
      },
    }),
  ]);

  const refundStats = computeRefundStats(refundedOrders);
  const platformFeesCompletedCzk =
    platformFeesCompleted._sum.platformFeeCzk ?? 0;
  const netPlatformRevenueCzk = Math.max(
    0,
    platformFeesCompletedCzk - refundStats.stripeRefundFeesCzk
  );

  const byStatus = statusGroups.map((group) => ({
    status: group.status as ApiOrderStatus,
    count: group._count._all,
    totalCzk: group._sum.customerTotalCzk ?? 0,
  }));

  return {
    totalOrders,
    activeOrders,
    completedOrders,
    disputedOrders,
    openDisputes,
    uniqueCustomers,
    makersWithOrders,
    ordersLast7Days,
    ordersLast30Days,
    revenue: {
      gmvNetCzk: gmvNet._sum.customerTotalCzk ?? 0,
      gmvCompletedCzk: gmvCompleted._sum.customerTotalCzk ?? 0,
      gmvInProgressCzk: gmvInProgress._sum.customerTotalCzk ?? 0,
      platformFeesNetCzk: platformFeesNet._sum.platformFeeCzk ?? 0,
      platformFeesCompletedCzk,
      makerEarningsCompletedCzk:
        makerEarningsCompleted._sum.printCostCzk ?? 0,
      refundedToCustomersCzk: refundStats.refundedToCustomersCzk,
      refundedPlatformFeesCzk: refundStats.refundedPlatformFeesCzk,
      stripeRefundFeesCzk: refundStats.stripeRefundFeesCzk,
      netPlatformRevenueCzk,
    },
    byStatus,
    stripe: getStripeStats(),
  };
}
