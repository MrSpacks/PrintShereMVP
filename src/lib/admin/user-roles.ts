import type { UserRole } from "@/types/user";

const ASSIGNABLE_ROLES = new Set<UserRole>([
  "customer",
  "moderator",
  "admin",
  "maker",
]);

export function isAssignableRole(role: string): role is UserRole {
  return ASSIGNABLE_ROLES.has(role as UserRole);
}

export function validateRoleAssignment(
  targetRole: UserRole,
  hasMakerId: boolean
): string | null {
  if (targetRole === "maker" && !hasMakerId) {
    return "Maker role requires a linked workshop account";
  }

  return null;
}
