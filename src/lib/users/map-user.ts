import type { User as PrismaUser } from "@prisma/client";

import type { User, UserRole } from "@/types/user";

const USER_ROLES = new Set<string>(["customer", "maker", "moderator", "admin"]);

function toUserRole(role: string): UserRole {
  return USER_ROLES.has(role) ? (role as UserRole) : "customer";
}

/** Преобразует запись Prisma в доменный тип (без passwordHash) */
export function mapPrismaUser(record: PrismaUser): User {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    avatarUrl: record.avatarUrl,
    role: toUserRole(record.role),
    makerId: record.makerId,
    createdAt: record.createdAt.toISOString(),
  };
}
