"use client";

import { Heart, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { DonationQrContent } from "@/components/support/donation-qr-content";
import { useTranslations } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface DonationPopupProps {
  /** Třídy tlačítka ve footeru (tmavý styl) */
  triggerClassName?: string;
}

const POPUP_Z = 9999;

/** Tlačítko + popup s QR pro dobrovolnou podporu projektu */
export function DonationPopup({ triggerClassName }: DonationPopupProps) {
  const { t } = useTranslations();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100",
          triggerClassName
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("support.footerDonate")}
        onClick={() => setOpen(true)}
      >
        <Heart className="h-3.5 w-3.5 opacity-80" aria-hidden />
        <span className="hidden sm:inline">{t("support.footerDonateShort")}</span>
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 flex items-end justify-center p-3 sm:items-center sm:p-4"
              style={{ zIndex: POPUP_Z }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/50"
                aria-label={t("common.close")}
                onClick={() => setOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                  <h2 id={titleId} className="text-base font-semibold text-foreground">
                    {t("support.donationTitle")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                    aria-label={t("common.close")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[min(80vh,32rem)] overflow-y-auto px-4 py-4">
                  <DonationQrContent compact />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
