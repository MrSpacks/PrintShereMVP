import type { User, UserRole } from "@/types/user";

export interface ProfileResponse {
  user: User;
  address: string;
  hasPassword: boolean;
  linkedProviders: string[];
}

export interface PublicUserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  makerId: string | null;
  createdAt: string;
  blockedUntil: string | null;
  isBlocked: boolean;
  address: string | null;
  orderCount: number;
  canManage: boolean;
}
