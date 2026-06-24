"use client";

import { useModelStore } from "@/store/model-store";

export function PriceFooter() {
  const selectedMaker = useModelStore((state) => state.selectedMaker);
  const model = useModelStore((state) => state.model);

  const deliveryPart =
    selectedMaker && selectedMaker.deliveryPriceCzk > 0
      ? selectedMaker.deliveryMethod === "zasilkovna"
        ? ` · Zásilkovna +${selectedMaker.deliveryPriceCzk} CZK`
        : ""
      : "";

  const totalCzk = selectedMaker
    ? selectedMaker.printCostCzk + selectedMaker.deliveryPriceCzk
    : null;

  const label = totalCzk !== null ? `${totalCzk} CZK` : "Calculate on map";

  const subtitle = selectedMaker
    ? `${selectedMaker.makerName}${deliveryPart}`
    : model
      ? `Based on ${model.stats.weightGrams}g — pick a maker on the map`
      : "Upload a model to see pricing";

  return (
    <div className="flex items-center justify-between border-t border-zinc-700/80 bg-zinc-950 px-4 py-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Total Price
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
