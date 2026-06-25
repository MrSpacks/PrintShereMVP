/** Роль пользователя в маркетплейсе */
export type UserRole = "customer" | "maker" | "moderator" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  makerId: string | null;
  createdAt: string;
}

export function hasMakerAccess(user: { makerId: string | null }): boolean {
  return Boolean(user.makerId);
}

export function isAdminRole(role: string): role is "admin" {
  return role === "admin";
}

export function isModeratorRole(role: string): role is "moderator" | "admin" {
  return role === "moderator" || role === "admin";
}

export function getOrdersViewRole(user: {
  role: UserRole;
  makerId: string | null;
}): UserRole {
  if (isAdminRole(user.role)) return "admin";
  if (hasMakerAccess(user)) return "maker";
  return user.role === "moderator" ? "customer" : user.role;
}
