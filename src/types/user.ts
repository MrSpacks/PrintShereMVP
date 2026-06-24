/** Роль пользователя в маркетплейсе */
export type UserRole = "customer" | "maker" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  makerId: string | null;
  createdAt: string;
}
