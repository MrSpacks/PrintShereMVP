import type { OrderStatus, Prisma } from "@prisma/client";

const ORDER_STATUSES = new Set<string>([
  "pending",
  "awaiting_customer",
  "awaiting_payment",
  "paid",
  "printing",
  "shipped",
  "delivered",
  "completed",
  "disputed",
  "refunded",
  "cancelled",
]);

export const ADMIN_ORDERS_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_ORDERS_MAX_PAGE_SIZE = 100;

export interface AdminOrdersQuery {
  q: string;
  status: OrderStatus | null;
  page: number;
  pageSize: number;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOrderStatus(value: string | null): OrderStatus | null {
  if (!value || value === "all") return null;
  return ORDER_STATUSES.has(value) ? (value as OrderStatus) : null;
}

export function parseAdminOrdersQuery(
  searchParams: URLSearchParams
): AdminOrdersQuery {
  const pageSize = Math.min(
    parsePositiveInt(
      searchParams.get("limit"),
      ADMIN_ORDERS_DEFAULT_PAGE_SIZE
    ),
    ADMIN_ORDERS_MAX_PAGE_SIZE
  );

  return {
    q: (searchParams.get("q") ?? "").trim(),
    status: parseOrderStatus(searchParams.get("status")),
    page: parsePositiveInt(searchParams.get("page"), 1),
    pageSize,
  };
}

export function buildAdminOrdersWhere(
  query: AdminOrdersQuery
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.q) {
    where.OR = [
      { id: { contains: query.q, mode: "insensitive" } },
      { fileName: { contains: query.q, mode: "insensitive" } },
      { maker: { name: { contains: query.q, mode: "insensitive" } } },
      {
        customer: {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  return where;
}
