"use client";

import { ChevronRight, Star } from "lucide-react";

import { useTranslations } from "@/i18n/locale-provider";
import { getMakerDistanceKm } from "@/lib/map/filter-makers";
import { getPrintCostCzk } from "@/lib/map/pricing";
import { calculatePlatformFeeCzk } from "@/lib/orders/order-pricing";
import type { Maker } from "@/types/maker";
import type { UserLocation } from "@/types/map";
import { cn } from "@/lib/utils";

interface MakerListPanelProps {
  makers: Maker[];
  userLocation?: UserLocation | null;
  modelWeight: number;
  isModelLoaded: boolean;
  onSelectMaker: (maker: Maker) => void;
  className?: string;
}

export function MakerListPanel({
  makers,
  userLocation,
  modelWeight,
  isModelLoaded,
  onSelectMaker,
  className,
}: MakerListPanelProps) {
  const { t } = useTranslations();
  const weightGrams = isModelLoaded && modelWeight > 0 ? modelWeight : null;

  if (makers.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "border-t border-zinc-200 bg-white lg:hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-sm font-semibold text-zinc-900">
          {t("mobile.nearbyMakers")}
        </h3>
        <span className="text-xs text-zinc-500">{makers.length}</span>
      </div>

      <ul className="max-h-36 space-y-1 overflow-y-auto px-2 pb-2">
        {makers.slice(0, 8).map((maker) => {
          const distanceKm = userLocation
            ? getMakerDistanceKm(maker, userLocation)
            : null;
          const distanceLabel =
            distanceKm !== null
              ? distanceKm < 1
                ? t("map.distanceMeters", {
                    meters: Math.round(distanceKm * 1000),
                  })
                : t("map.distanceKm", { km: distanceKm.toFixed(1) })
              : null;

          const priceLabel =
            weightGrams !== null
              ? (() => {
                  const print = getPrintCostCzk(maker, weightGrams);
                  const total = print + calculatePlatformFeeCzk(print);
                  return `${total} ${t("common.czk")}`;
                })()
              : t("common.czkPerGram", { price: maker.pricePerGramCzk });

          return (
            <li key={maker.id}>
              <button
                type="button"
                onClick={() => onSelectMaker(maker)}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-zinc-900">
                      {maker.name}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-zinc-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {maker.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-zinc-500">
                    {distanceLabel ?? maker.address}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-bold text-brand">{priceLabel}</span>
                  <ChevronRight className="h-4 w-4 text-zinc-400" aria-hidden />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
