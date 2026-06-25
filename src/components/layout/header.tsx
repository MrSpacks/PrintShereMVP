"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

import { HeaderAuth } from "@/components/auth/header-auth";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MessageInbox } from "@/components/layout/message-inbox";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { key: "header.howItWorks", href: "/how-it-works" },
  { key: "header.support", href: "/support" },
] as const;

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { t } = useTranslations();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Printer className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">{t("header.brand")}</span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label={t("header.mainNav")}
        >
          {NAV_LINKS.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{t(link.key)}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <Button
            variant="brand"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <Link href="/become-maker">{t("header.becomeMaker")}</Link>
          </Button>

          <MessageInbox />
          <HeaderAuth />
        </div>
      </div>

      <nav
        className="flex items-center gap-1 overflow-x-auto border-t border-border/40 px-4 py-2 md:hidden"
        aria-label={t("header.mobileNav")}
      >
        {NAV_LINKS.map((link) => (
          <Button
            key={link.href}
            variant="ghost"
            size="sm"
            className="shrink-0"
            asChild
          >
            <Link href={link.href}>{t(link.key)}</Link>
          </Button>
        ))}
        <Button variant="brand" size="sm" className="shrink-0" asChild>
          <Link href="/become-maker">{t("header.becomeMaker")}</Link>
        </Button>
      </nav>
    </header>
  );
}
