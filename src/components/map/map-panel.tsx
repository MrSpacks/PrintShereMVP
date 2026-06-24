"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import { MapFiltersBar } from "@/components/map/map-filters";
import { useMakers } from "@/hooks/use-makers";
import { filterMakers } from "@/lib/map/filter-makers";
import { getPrintCostCzk } from "@/lib/map/pricing";
import {
  buildOrderPayload,
  createOrder,
} from "@/lib/orders/create-order";
import { useMapStore } from "@/store/map-store";
import { useModelStore } from "@/store/model-store";
import type { Maker } from "@/types/maker";
import type { DeliveryChoice } from "@/types/delivery";
import { cn } from "@/lib/utils";

const Map = dynamic(
  () => import("@/components/map/Map").then((mod) => mod.Map),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
        Loading map…
      </div>
    ),
  }
);

interface MapPanelProps {
  className?: string;
}

/**
 * Правая панель: фильтры + Leaflet-карта, мейкеры из Neon.
 */
export function MapPanel({ className }: MapPanelProps) {
  const filters = useMapStore((state) => state.filters);
  const model = useModelStore((state) => state.model);
  const setSelectedMaker = useModelStore((state) => state.setSelectedMaker);

  const { makers, isLoading, error, refetch } = useMakers();
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const visibleMakers = useMemo(
    () => filterMakers(makers, filters),
    [makers, filters]
  );

  const isModelLoaded = model !== null;
  const modelWeight = model?.stats.weightGrams ?? 0;

  const handleOrder = useCallback(
    async (maker: Maker, delivery: DeliveryChoice) => {
      if (!model) return;

      setIsSubmittingOrder(true);
      setOrderMessage(null);

      try {
        const payload = buildOrderPayload(maker, model, delivery);
        const order = await createOrder(payload);

        setSelectedMaker({
          makerId: maker.id,
          makerName: maker.name,
          printCostCzk: getPrintCostCzk(maker, model.stats.weightGrams),
          deliveryMethod: delivery.method,
          deliveryPriceCzk: delivery.deliveryPriceCzk,
        });

        setOrderMessage(`Order #${order.id.slice(-6)} saved to database`);
      } catch (submitError) {
        const message =
          submitError instanceof Error
            ? submitError.message
            : "Failed to create order";
        setOrderMessage(message);
      } finally {
        setIsSubmittingOrder(false);
      }
    },
    [model, setSelectedMaker]
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-zinc-100", className)}>
      <MapFiltersBar />

      {error && (
        <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          <span>Could not load makers from database: {error}</span>
          <button
            type="button"
            onClick={refetch}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {orderMessage && (
        <div
          className={cn(
            "border-b px-4 py-2 text-xs",
            orderMessage.includes("saved")
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {orderMessage}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Loading makers…
          </div>
        ) : (
          <Map
            isModelLoaded={isModelLoaded}
            modelWeight={modelWeight}
            makers={visibleMakers}
            onOrder={handleOrder}
            isSubmittingOrder={isSubmittingOrder}
          />
        )}
      </div>
    </div>
  );
}
