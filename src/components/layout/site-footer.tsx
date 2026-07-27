"use client";

import Link from "next/link";
import { ChevronUp, Scale } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useTranslations } from "@/i18n/locale-provider";
import {
  LEGAL_PATHS,
  PLATFORM_OPERATOR,
} from "@/lib/legal/constants";
import { DonationPopup } from "@/components/support/donation-popup";
import { isSupportDonationsEnabled } from "@/lib/product/product-mode";
import { cn } from "@/lib/utils";

const LEGAL_LINKS = [
  { href: LEGAL_PATHS.terms, labelKey: "legal.terms" },
  { href: LEGAL_PATHS.privacy, labelKey: "legal.privacy" },
  { href: LEGAL_PATHS.complaints, labelKey: "legal.complaints" },
  { href: LEGAL_PATHS.cookies, labelKey: "legal.cookies" },
] as const;

/**
 * Юридический футер-приложение: одна тонкая строка + выпадающее меню вверх.
 * Не конкурирует с картой и блоком «Celková cena».
 */
export function SiteFooter() {
  const { t } = useTranslations();
  const pathname = usePathname();
  const year = new Date().getFullYear();
  const menuId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

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
    <footer
      ref={rootRef}
      className="relative z-40 shrink-0 border-t border-zinc-800 bg-zinc-950 text-zinc-400"
    >
      <div className="flex h-8 items-center justify-between gap-3 px-3 md:px-4">
        <p className="truncate text-[11px] text-zinc-500">
          <span className="font-medium text-zinc-300">
            {PLATFORM_OPERATOR.brandName}
          </span>
          <span className="hidden sm:inline">
            {" "}
            · © {year} {PLATFORM_OPERATOR.legalName}
          </span>
        </p>

        <div className="relative flex shrink-0 items-center gap-1">
          {isSupportDonationsEnabled() ? <DonationPopup /> : null}
          <div className="relative">
          <button
            type="button"
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors",
              open
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100"
            )}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <Scale className="h-3.5 w-3.5 opacity-80" aria-hidden />
            {t("legal.menuLabel")}
            <ChevronUp
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                open && "rotate-180"
              )}
              aria-hidden
            />
          </button>

          {open && (
            <div
              id={menuId}
              role="menu"
              aria-label={t("legal.footerNav")}
              className="absolute bottom-[calc(100%+6px)] right-0 w-[min(calc(100vw-1.5rem),20rem)] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40"
            >
              <div className="border-b border-zinc-800 px-3 py-2.5">
                <p className="text-xs font-semibold text-zinc-100">
                  {t("legal.operatorDetails")}
                </p>
                <div className="mt-1.5 space-y-0.5 text-[11px] leading-relaxed text-zinc-400">
                  <p>{PLATFORM_OPERATOR.legalName}</p>
                  <p>
                    {t("legal.ico")}: {PLATFORM_OPERATOR.ico}
                    {" · "}
                    {t("legal.notVatPayer")}
                  </p>
                  <p>
                    {PLATFORM_OPERATOR.addressLine},{" "}
                    {PLATFORM_OPERATOR.cityLine}
                  </p>
                  <p>
                    <a
                      href={`mailto:${PLATFORM_OPERATOR.email}`}
                      className="text-zinc-300 underline-offset-2 hover:underline"
                      role="menuitem"
                    >
                      {PLATFORM_OPERATOR.email}
                    </a>
                  </p>
                </div>
              </div>

              <nav className="flex flex-col p-1" aria-label={t("legal.footerNav")}>
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className="rounded-md px-2.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                    onClick={() => setOpen(false)}
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </nav>
            </div>
          )}
          </div>
        </div>
      </div>
    </footer>
  );
}
