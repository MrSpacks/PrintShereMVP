"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  LogOut,
  LayoutDashboard,
  Package,
  Scale,
  Shield,
  User,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { usePendingOrdersCount } from "@/hooks/use-pending-orders-count";
import { useTranslations } from "@/i18n/locale-provider";
import { isModerationNavVisible } from "@/lib/product/product-mode";
import { hasMakerAccess, isAdminUser, isModeratorUser } from "@/types/user";
import { cn } from "@/lib/utils";

function ProfileMenu({
  name,
  avatarUrl,
  onLogout,
}: {
  name: string;
  avatarUrl: string | null | undefined;
  onLogout: () => void;
}) {
  const { t } = useTranslations();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <User className="h-3.5 w-3.5" aria-hidden />
        )}
        <span className="max-w-[120px] truncate font-medium text-foreground">
          {name}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-48 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
        >
          <Link
            href="/profile"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <User className="h-4 w-4" aria-hidden />
            {t("profile.title")}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t("auth.logOut")}
          </button>
        </div>
      )}
    </div>
  );
}

export function HeaderAuth() {
  const { user, isLoading, logout } = useAuth();
  const { t } = useTranslations();
  const isMaker = user ? hasMakerAccess(user) : false;
  const isAdmin = user ? isAdminUser(user) : false;
  const isModerator = user ? isModeratorUser(user) : false;
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

      {isModerator && isModerationNavVisible() && (
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

      <ProfileMenu
        name={user.name}
        avatarUrl={user.avatarUrl}
        onLogout={() => void logout()}
      />
    </>
  );
}
