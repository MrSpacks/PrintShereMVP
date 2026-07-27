"use client";

import { useTranslations } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface DonationQrContentProps {
  className?: string;
  compact?: boolean;
}

/** QR + krátké vysvětlení dobrovolné podpory provozu */
export function DonationQrContent({
  className,
  compact = false,
}: DonationQrContentProps) {
  const { t } = useTranslations();

  return (
    <div className={cn("space-y-3", className)}>
      <p
        className={cn(
          "leading-relaxed text-muted-foreground",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {t("support.donationText")}
      </p>
      <p
        className={cn(
          "font-medium text-foreground",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {t("support.donationSuggested")}
      </p>
      <div
        className={cn(
          "flex flex-col items-center gap-3",
          !compact && "sm:flex-row sm:items-start sm:gap-4"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/support/donation-qr-csob.png"
          alt={t("support.donationQrAlt")}
          width={compact ? 180 : 220}
          height={compact ? 180 : 220}
          className="shrink-0 rounded-lg border border-border bg-white p-2"
        />
        <div
          className={cn(
            "space-y-2 text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          <p>{t("support.donationHowTo")}</p>
          <p className="text-[11px] leading-relaxed">{t("support.donationLegal")}</p>
        </div>
      </div>
    </div>
  );
}
