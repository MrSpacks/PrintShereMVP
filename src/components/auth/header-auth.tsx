"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { LogOut, LayoutDashboard, Package, Scale, Shield, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { usePendingOrdersCount } from "@/hooks/use-pending-orders-count";
import { useTranslations } from "@/i18n/locale-provider";
import { hasMakerAccess, isModeratorRole, type UserRole } from "@/types/user";
import { cn } from "@/lib/utils";

export function HeaderAuth() {
  const { user, isLoading, logout } = useAuth();
  const { t } = useTranslations();
  const isMaker = user ? hasMakerAccess(user) : false;
  const isModerator = user ? isModeratorRole(user.role) : false;
  const isAdmin = user?.role === "admin";
  const { count: pendingOrdersCount, refetch: refetchPendingCount } =
    usePendingOrdersCount(Boolean(isMaker));
  const pathname = usePathname();

  useEffect(() => {
    if (isMaker && pathname === "/orders") {
      refetchPendingCount();
    }
  }, [isMaker, pathname, refetchPendingCount]);

  if (isLoading) {
    return (
      <div className="h-8 w-24 animate-pulse rounded-md bg-muted" aria-hidden />
    );
  }

  if (!user) {
    return (
      <>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">{t("auth.logIn")}</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/signup">{t("auth.signUp")}</Link>
        </Button>
      </>
    );
  }

  const roleLabel = t(`roles.${user.role as UserRole}`);

  return (
    <>
      {isMaker && (
        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/dashboard" className="gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
            {t("auth.dashboard")}
          </Link>
        </Button>
      )}

      {isAdmin && (
        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/admin" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            {t("auth.admin")}
          </Link>
        </Button>
      )}

      {isModerator && (
        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/moderation" className="gap-1.5">
            <Scale className="h-3.5 w-3.5" aria-hidden />
            {t("auth.moderation")}
          </Link>
        </Button>
      )}

      <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
        <Link
          href="/orders"
          className={cn(
            "relative gap-1.5",
            isMaker && pendingOrdersCount > 0 && "pr-1"
          )}
          aria-label={
            isMaker && pendingOrdersCount > 0
              ? `${t("auth.orders")} (${pendingOrdersCount})`
              : t("auth.orders")
          }
        >
          <Package className="h-3.5 w-3.5" aria-hidden />
          {t("auth.orders")}
          {isMaker && pendingOrdersCount > 0 && (
            <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-brand-foreground">
              {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
            </span>
          )}
        </Link>
      </Button>

      <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
        <Link href="/profile" className="gap-2">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <User className="h-3.5 w-3.5" aria-hidden />
          )}
          <span className="max-w-[120px] truncate font-medium text-foreground">
            {user.name}
          </span>
        </Link>
      </Button>

      <span className="hidden rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground sm:inline">
        {roleLabel}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => void logout()}
        className="gap-1.5"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        {t("auth.logOut")}
      </Button>
    </>
  );
}
