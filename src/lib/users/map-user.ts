import type { User as PrismaUser } from "@prisma/client";

import { isUserCurrentlyBlocked } from "@/lib/users/user-block";
import type { StaffRole, User, UserRole } from "@/types/user";

const USER_ROLES = new Set<string>(["customer", "maker", "moderator", "admin"]);
const STAFF_ROLES = new Set<string>(["moderator", "admin"]);

function toUserRole(role: string): UserRole {
  return USER_ROLES.has(role) ? (role as UserRole) : "customer";
}

function toStaffRole(role: string | null | undefined): StaffRole | null {
  if (!role || !STAFF_ROLES.has(role)) return null;
  return role as StaffRole;
}

/** Преобразует запись Prisma в доменный тип (без passwordHash) */
export function mapPrismaUser(
  record: PrismaUser & {
    _count?: { ownedMakers: number };
    ownedMakers?: { id: string }[];
  }
): User {
  const blockedUntil = record.blockedUntil?.toISOString() ?? null;
  const staffRole = toStaffRole(record.staffRole);
  const ownedMakerIds =
    record.ownedMakers?.map((maker) => maker.id) ??
    (record.makerId ? [record.makerId] : []);

  return {
    id: record.id,
    email: record.email,
    name: record.name,
    avatarUrl: record.avatarUrl,
    role: toUserRole(record.role),
    staffRole,
    makerId: record.makerId,
    ownedMakerIds,
    workshopCount: record._count?.ownedMakers ?? ownedMakerIds.length,
    createdAt: record.createdAt.toISOString(),
    blockedUntil,
    isBlocked: isUserCurrentlyBlocked(blockedUntil),
  };
}
