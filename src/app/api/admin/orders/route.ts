import { NextResponse } from "next/server";

import {
  buildAdminOrdersWhere,
  parseAdminOrdersQuery,
} from "@/lib/admin/list-orders";
import {
  adminUnauthorized,
  requireAdminUser,
} from "@/lib/admin/require-admin";
import { prisma } from "@/lib/prisma";
import type { AdminOrderSummary } from "@/types/admin";
import type { OrderStatus } from "@/types/order";

export async function GET(request: Request) {
  try {
    const user = await requireAdminUser();
    if (!user) return adminUnauthorized();

    const query = parseAdminOrdersQuery(new URL(request.url).searchParams);
    const where = buildAdminOrdersWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [total, records] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
        include: {
          maker: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, email: true } },
          dispute: { select: { status: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
    const page = total === 0 ? 1 : Math.min(query.page, totalPages);

    const orders: AdminOrderSummary[] = records.map((order) => ({
      id: order.id,
      fileName: order.fileName,
      status: order.status as OrderStatus,
      customerId: order.customerId,
      customerName: order.customer?.name ?? null,
      customerEmail: order.customer?.email ?? null,
      makerId: order.makerId,
      makerName: order.maker.name,
      customerTotalCzk: order.customerTotalCzk,
      platformFeeCzk: order.platformFeeCzk,
      printCostCzk: order.printCostCzk,
      deliveryPriceCzk: order.deliveryPriceCzk,
      createdAt: order.createdAt.toISOString(),
      hasDispute: Boolean(order.dispute),
      disputeOpen: order.dispute?.status === "open",
    }));

    return NextResponse.json({
      orders,
      total,
      page,
      pageSize: query.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("[GET /api/admin/orders]", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
