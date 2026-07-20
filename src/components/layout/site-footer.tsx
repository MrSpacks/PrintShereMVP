"use client";

import Link from "next/link";

import { useTranslations } from "@/i18n/locale-provider";
import {
  LEGAL_PATHS,
  PLATFORM_OPERATOR,
} from "@/lib/legal/constants";

export function SiteFooter() {
  const { t } = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 border-t border-border bg-zinc-950 px-4 py-3 text-zinc-400 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 text-xs leading-relaxed">
          <p className="font-medium text-zinc-200">
            {PLATFORM_OPERATOR.brandName}
          </p>
          <p>
            {PLATFORM_OPERATOR.legalName}
            {" · "}
            {t("legal.ico")}: {PLATFORM_OPERATOR.ico}
            {" · "}
            {t("legal.notVatPayer")}
          </p>
          <p>
            {t("legal.registeredOffice")}: {PLATFORM_OPERATOR.addressLine},{" "}
            {PLATFORM_OPERATOR.cityLine}
          </p>
          <p>
            <a
              href={`mailto:${PLATFORM_OPERATOR.email}`}
              className="underline-offset-2 hover:text-zinc-200 hover:underline"
            >
              {PLATFORM_OPERATOR.email}
            </a>
          </p>
          <p className="text-[11px] text-zinc-500">
            © {year} {PLATFORM_OPERATOR.legalName}
          </p>
        </div>

        <nav
          aria-label={t("legal.footerNav")}
          className="flex flex-wrap gap-x-4 gap-y-1 text-xs"
        >
          <Link
            href={LEGAL_PATHS.terms}
            className="underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            {t("legal.terms")}
          </Link>
          <Link
            href={LEGAL_PATHS.privacy}
            className="underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            {t("legal.privacy")}
          </Link>
          <Link
            href={LEGAL_PATHS.complaints}
            className="underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            {t("legal.complaints")}
          </Link>
          <Link
            href={LEGAL_PATHS.cookies}
            className="underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            {t("legal.cookies")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
