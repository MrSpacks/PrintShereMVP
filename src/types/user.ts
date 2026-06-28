/** Staff privilege layer — separate from customer/maker capabilities */
export type StaffRole = "moderator" | "admin";

/** Legacy role kept for session compatibility; new users stay customer */
export type UserRole = "customer" | "maker" | "moderator" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  staffRole: StaffRole | null;
  makerId: string | null;
  ownedMakerIds: string[];
  workshopCount: number;
  createdAt: string;
  blockedUntil: string | null;
  isBlocked: boolean;
}

export function isOwnWorkshop(
  user: { ownedMakerIds?: string[] },
  makerId: string
): boolean {
  return user.ownedMakerIds?.includes(makerId) ?? false;
}

export function hasMakerAccess(user: {
  makerId?: string | null;
  workshopCount?: number;
}): boolean {
  return (user.workshopCount ?? 0) > 0 || Boolean(user.makerId);
}

export function isAdminUser(user: { staffRole?: StaffRole | null; role?: string }): boolean {
  return user.staffRole === "admin" || user.role === "admin";
}

export function isModeratorUser(user: {
  staffRole?: StaffRole | null;
  role?: string;
}): boolean {
  return (
    user.staffRole === "moderator" ||
    user.staffRole === "admin" ||
    user.role === "moderator" ||
    user.role === "admin"
  );
}

/** @deprecated use isModeratorUser */
export function isModeratorRole(role: string): role is "moderator" | "admin" {
  return role === "moderator" || role === "admin";
}

/** @deprecated use isAdminUser */
export function isAdminRole(role: string): role is "admin" {
  return role === "admin";
}

/** Which slice of orders to show on /orders (not admin console) */
export type OrdersListView = "customer" | "maker";

export function canAccessOrdersListView(
  user: { makerId?: string | null; workshopCount?: number },
  view: OrdersListView
): boolean {
  if (view === "customer") return true;
  return hasMakerAccess(user);
}

export function parseOrdersListView(value: string | null): OrdersListView | null {
  if (value === "customer" || value === "maker") return value;
  return null;
}

/** @deprecated Prefer explicit `OrdersListView` on /orders; admin uses /admin/orders */
export function getOrdersViewRole(user: {
  role: UserRole;
  staffRole?: StaffRole | null;
  makerId: string | null;
  workshopCount?: number;
}): UserRole {
  if (isAdminUser(user)) return "admin";
  if (hasMakerAccess(user)) return "maker";
  return "customer";
}

export function getUserCapabilityLabels(user: User): string[] {
  const labels: string[] = ["customer"];
  if (hasMakerAccess(user)) labels.push("maker");
  if (user.staffRole === "moderator") labels.push("moderator");
  if (user.staffRole === "admin") labels.push("admin");
  return labels;
}
