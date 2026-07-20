"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { LEGAL_PATHS } from "@/lib/legal/constants";
import {
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentChoice,
} from "@/lib/legal/cookie-consent";

export function CookieBanner() {
  const { t } = useTranslations();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookieConsent() === null);
  }, []);

  const choose = (choice: CookieConsentChoice) => {
    writeCookieConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed inset-x-0 bottom-0 z-[10000] border-t border-zinc-700 bg-zinc-950/95 p-4 shadow-lg backdrop-blur-sm md:p-5"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <h2
            id="cookie-banner-title"
            className="text-sm font-semibold text-zinc-100"
          >
            {t("cookies.title")}
          </h2>
          <p id="cookie-banner-desc" className="mt-1 text-xs leading-relaxed text-zinc-400">
            {t("cookies.body")}{" "}
            <Link
              href={LEGAL_PATHS.cookies}
              className="underline underline-offset-2 hover:text-zinc-200"
            >
              {t("legal.cookies")}
            </Link>
            {" · "}
            <Link
              href={LEGAL_PATHS.privacy}
              className="underline underline-offset-2 hover:text-zinc-200"
            >
              {t("legal.privacy")}
            </Link>
          </p>
        </div>

        {/* Equal visual weight — no dark patterns */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 border-zinc-600 bg-transparent text-zinc-100 hover:bg-zinc-800 sm:flex-none sm:min-w-[140px]"
            onClick={() => choose("rejected")}
          >
            {t("cookies.reject")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 border-zinc-600 bg-transparent text-zinc-100 hover:bg-zinc-800 sm:flex-none sm:min-w-[140px]"
            onClick={() => choose("accepted")}
          >
            {t("cookies.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
