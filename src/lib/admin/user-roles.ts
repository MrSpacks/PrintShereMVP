import type { UserRole } from "@/types/user";
import type { StaffRole } from "@/types/user";

const STAFF_ROLES = new Set<StaffRole>(["moderator", "admin"]);

export function isAssignableStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.has(role as StaffRole);
}

export function validateStaffRoleAssignment(
  staffRole: StaffRole | null,
  hasWorkshops: boolean
): string | null {
  if (staffRole) return null;
  if (hasWorkshops) return null;
  return null;
}

/** @deprecated legacy single-role assignment */
export function isAssignableRole(role: string): role is UserRole {
  return (
    role === "customer" ||
    role === "maker" ||
    role === "moderator" ||
    role === "admin"
  );
}

export function validateRoleAssignment(
  targetRole: UserRole,
  hasWorkshops: boolean
): string | null {
  if (targetRole === "maker" && !hasWorkshops) {
    return "Maker capability requires at least one workshop";
  }
  return null;
}
