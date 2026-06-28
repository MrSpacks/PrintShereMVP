import type { Prisma } from "@prisma/client";

import type { UserRole } from "@/types/user";

const USER_ROLES = new Set<string>(["customer", "maker", "moderator", "admin"]);
const SORT_FIELDS = new Set<string>(["createdAt", "name", "email"]);

export const ADMIN_USERS_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_USERS_MAX_PAGE_SIZE = 100;

export interface AdminUsersQuery {
  q: string;
  role: UserRole | null;
  page: number;
  pageSize: number;
  sortField: "createdAt" | "name" | "email";
  sortOrder: "asc" | "desc";
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseUserRole(value: string | null): UserRole | null {
  if (!value || value === "all") return null;
  return USER_ROLES.has(value) ? (value as UserRole) : null;
}

export function parseAdminUsersQuery(
  searchParams: URLSearchParams
): AdminUsersQuery {
  const sortRaw = searchParams.get("sort") ?? "createdAt:desc";
  const [sortFieldRaw, sortOrderRaw] = sortRaw.split(":");

  const sortField = SORT_FIELDS.has(sortFieldRaw)
    ? (sortFieldRaw as AdminUsersQuery["sortField"])
    : "createdAt";
  const sortOrder = sortOrderRaw === "asc" ? "asc" : "desc";

  const pageSize = Math.min(
    parsePositiveInt(
      searchParams.get("limit"),
      ADMIN_USERS_DEFAULT_PAGE_SIZE
    ),
    ADMIN_USERS_MAX_PAGE_SIZE
  );

  return {
    q: (searchParams.get("q") ?? "").trim(),
    role: parseUserRole(searchParams.get("role")),
    page: parsePositiveInt(searchParams.get("page"), 1),
    pageSize,
    sortField,
    sortOrder,
  };
}

export function buildAdminUsersWhere(
  query: AdminUsersQuery
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.role === "moderator") {
    where.staffRole = "moderator";
  } else if (query.role === "admin") {
    where.staffRole = "admin";
  } else if (query.role === "maker") {
    where.ownedMakers = { some: {} };
  } else if (query.role === "customer") {
    where.staffRole = null;
    where.ownedMakers = { none: {} };
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function buildAdminUsersOrderBy(
  query: AdminUsersQuery
): Prisma.UserOrderByWithRelationInput {
  return { [query.sortField]: query.sortOrder };
}
