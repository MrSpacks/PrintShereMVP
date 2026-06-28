"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { isAdminUser, isModeratorUser } from "@/types/user";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  adminOnly?: boolean;
  actions?: React.ReactNode;
}

export function AdminShell({
  title,
  subtitle,
  children,
  adminOnly = false,
  actions,
}: AdminShellProps) {
  const { user, isLoading } = useAuth();
  const { t } = useTranslations();
  const pathname = usePathname();

  const isAdmin = user ? isAdminUser(user) : false;
  const isModerator = user ? isModeratorUser(user) : false;
  const canAccess = user ? (adminOnly ? isAdmin : isAdmin) : false;

  const navItems = isAdmin
    ? [
        { href: "/admin", label: t("admin.navOverview") },
        { href: "/admin/orders", label: t("admin.navOrders") },
        { href: "/admin/users", label: t("admin.navUsers") },
        { href: "/moderation", label: t("admin.navDisputes") },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Shield className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">{t("admin.accessTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {isModerator && !isAdmin
            ? t("admin.moderatorNoAdminAccess")
            : t("admin.accessText")}
        </p>
        {isModerator && !isAdmin ? (
          <Button variant="brand" asChild>
            <Link href="/moderation">{t("auth.moderation")}</Link>
          </Button>
        ) : (
          <Button variant="brand" asChild>
            <Link href="/login">{t("auth.logIn")}</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <nav
        className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3"
        aria-label={t("admin.navLabel")}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-brand/10 text-brand"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {actions}
      </div>

      {children}
    </div>
  );
}

function formatMoney(value: number, t: (key: string) => string): string {
  return `${value.toLocaleString("cs-CZ")} ${t("common.czk")}`;
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}

export function AdminStatCard({
  label,
  value,
  hint,
  accent = false,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          accent ? "text-brand" : "text-foreground"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function formatAdminMoney(
  value: number,
  t: (key: string) => string
): string {
  return formatMoney(value, t);
}
