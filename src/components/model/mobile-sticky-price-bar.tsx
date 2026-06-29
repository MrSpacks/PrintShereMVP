"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import { useModelStore } from "@/store/model-store";
import { cn } from "@/lib/utils";

interface MobileStickyPriceBarProps {
  onBackToModel?: () => void;
  className?: string;
}

export function MobileStickyPriceBar({
  onBackToModel,
  className,
}: MobileStickyPriceBarProps) {
  const { t } = useTranslations();
  const selectedMaker = useModelStore((state) => state.selectedMaker);
  const model = useModelStore((state) => state.model);

  const deliveryPart =
    selectedMaker && selectedMaker.deliveryPriceCzk > 0
      ? selectedMaker.deliveryMethod === "zasilkovna"
        ? t("model.zasilkovnaExtra", {
            price: selectedMaker.deliveryPriceCzk,
          })
        : ""
      : "";

  const totalCzk = selectedMaker
    ? selectedMaker.printCostCzk + selectedMaker.deliveryPriceCzk
    : null;

  const label =
    totalCzk !== null
      ? `${totalCzk} ${t("common.czk")}`
      : t("common.calculateOnMap");

  const subtitle = selectedMaker
    ? `${selectedMaker.makerName}${deliveryPart}`
    : model
      ? t("model.pickMaker", { weight: model.stats.weightGrams })
      : t("model.uploadForPricing");

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[1500] border-t border-zinc-700/80 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {onBackToModel && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 border-zinc-600 bg-zinc-900 text-zinc-300"
            onClick={onBackToModel}
            aria-label={t("mobile.backToModel")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {t("model.totalPrice")}
          </p>
          <p className="truncate text-xs text-zinc-500">{subtitle}</p>
        </div>
        <p
          className={cn(
            "shrink-0 font-semibold",
            selectedMaker ? "text-xl text-brand" : "text-sm text-zinc-400"
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
