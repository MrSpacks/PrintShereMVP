import type { User as PrismaUser } from "@prisma/client";

import { mapPrismaUser } from "@/lib/users/map-user";
import type { PublicUserProfile } from "@/types/profile";

export function mapPublicUserProfile(
  record: PrismaUser,
  orderCount: number,
  canManage: boolean
): PublicUserProfile {
  const user = mapPrismaUser(record);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    makerId: user.makerId,
    createdAt: user.createdAt,
    blockedUntil: user.blockedUntil,
    isBlocked: user.isBlocked,
    address: record.address,
    orderCount,
    canManage,
  };
}
