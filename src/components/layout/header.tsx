"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeaderAuth } from "@/components/auth/header-auth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Find Makers", href: "#find-makers" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Support", href: "#support" },
] as const;

interface HeaderProps {
  className?: string;
}

/**
 * Глобальная шапка приложения.
 * Содержит навигацию, CTA для мейкеров и кнопки авторизации.
 */
export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        {/* Логотип */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <Printer className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">Print Local P2P</span>
        </Link>

        {/* Центральная навигация — desktop */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Действия справа */}
        <div className="flex items-center gap-2">
          <Button
            variant="brand"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <Link href="/become-maker">Become a Maker</Link>
          </Button>

          <HeaderAuth />
        </div>
      </div>

      {/* Мобильная навигация */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-t border-border/40 px-4 py-2 md:hidden"
        aria-label="Mobile navigation"
      >
        {NAV_LINKS.map((link) => (
          <Button
            key={link.href}
            variant="ghost"
            size="sm"
            className="shrink-0"
            asChild
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
        <Button variant="brand" size="sm" className="shrink-0" asChild>
          <Link href="/become-maker">Become a Maker</Link>
        </Button>
      </nav>
    </header>
  );
}
