"use client";

import { useModelStore } from "@/store/model-store";
import { useTranslations } from "@/i18n/locale-provider";

export function PriceFooter() {
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
    <div className="flex items-center justify-between border-t border-zinc-700/80 bg-zinc-950 px-4 py-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {t("model.totalPrice")}
        </p>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
      <p
        className={
          selectedMaker
            ? "text-xl font-semibold text-brand"
            : "text-sm font-medium text-zinc-400"
        }
      >
        {label}
      </p>
    </div>
  );
}
