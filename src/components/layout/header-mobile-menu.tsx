"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Scale,
  Shield,
  User,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { usePendingOrdersCount } from "@/hooks/use-pending-orders-count";
import { useTranslations } from "@/i18n/locale-provider";
import {
  hasMakerAccess,
  isAdminUser,
  isModeratorUser,
} from "@/types/user";
import { cn } from "@/lib/utils";

const PUBLIC_LINKS = [
  { key: "header.howItWorks", href: "/how-it-works" },
  { key: "header.support", href: "/support" },
  { key: "header.becomeMaker", href: "/become-maker", variant: "brand" as const },
] as const;

export function HeaderMobileMenu() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslations();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isMaker = user ? hasMakerAccess(user) : false;
  const isAdmin = user ? isAdminUser(user) : false;
  const isModerator = user ? isModeratorUser(user) : false;
  const { count: pendingOrdersCount } = usePendingOrdersCount(Boolean(isMaker));

  const close = () => setOpen(false);

  const navLinkClass = (href: string) =>
    cn(
      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
      pathname === href
        ? "bg-brand/10 text-brand"
        : "text-foreground hover:bg-muted"
    );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 md:hidden"
        onClick={() => setOpen(true)}
        aria-label={t("header.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <BottomSheet
        open={open}
        onClose={close}
        title={t("header.mobileNav")}
        hideAbove={null}
        placement="top"
      >
        <nav className="flex flex-col gap-1 p-3" aria-label={t("header.mobileNav")}>
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={cn(
                navLinkClass(link.href),
                "variant" in link &&
                  link.variant === "brand" &&
                  "bg-brand text-brand-foreground hover:bg-brand/90"
              )}
            >
              {t(link.key)}
            </Link>
          ))}

          <div className="my-2 border-t border-border" />

          {!user ? (
            <>
              <Link href="/login" onClick={close} className={navLinkClass("/login")}>
                {t("auth.logIn")}
              </Link>
              <Link href="/signup" onClick={close} className={navLinkClass("/signup")}>
                {t("auth.signUp")}
              </Link>
            </>
          ) : (
            <>
              {isMaker && (
                <Link
                  href="/dashboard"
                  onClick={close}
                  className={navLinkClass("/dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("auth.dashboard")}
                </Link>
              )}

              <Link href="/orders" onClick={close} className={navLinkClass("/orders")}>
                <Package className="h-4 w-4" />
                {t("auth.orders")}
                {isMaker && pendingOrdersCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-brand-foreground">
                    {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                  </span>
                )}
              </Link>

              <Link href="/profile" onClick={close} className={navLinkClass("/profile")}>
                <User className="h-4 w-4" />
                {t("profile.title")}
              </Link>

              {isAdmin && (
                <Link href="/admin" onClick={close} className={navLinkClass("/admin")}>
                  <Shield className="h-4 w-4" />
                  {t("auth.admin")}
                </Link>
              )}

              {isModerator && (
                <Link
                  href="/moderation"
                  onClick={close}
                  className={navLinkClass("/moderation")}
                >
                  <Scale className="h-4 w-4" />
                  {t("auth.moderation")}
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  close();
                  void logout();
                }}
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                {t("auth.logOut")}
              </button>
            </>
          )}
        </nav>
      </BottomSheet>
    </>
  );
}
