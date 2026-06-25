"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { MapFiltersBar } from "@/components/map/map-filters";
import { useAuth } from "@/components/auth/auth-provider";
import { useMakers } from "@/hooks/use-makers";
import { useTranslations } from "@/i18n/locale-provider";
import { filterMakers } from "@/lib/map/filter-makers";
import {
  buildOrderPayload,
  createOrder,
  uploadOrderModelFile,
} from "@/lib/orders/create-order";
import { useMapStore } from "@/store/map-store";
import { useModelStore } from "@/store/model-store";
import type { Maker } from "@/types/maker";
import type { DeliveryChoice } from "@/types/delivery";
import { cn } from "@/lib/utils";

function MapLoading() {
  const { t } = useTranslations();
  return (
    <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
      {t("map.loading")}
    </div>
  );
}

const Map = dynamic(
  () => import("@/components/map/Map").then((mod) => mod.Map),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
);

interface MapPanelProps {
  className?: string;
}

interface OrderFeedback {
  type: "success" | "error";
  title?: string;
  message: string;
  orderId?: string;
}

export function MapPanel({ className }: MapPanelProps) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const filters = useMapStore((state) => state.filters);
  const model = useModelStore((state) => state.model);
  const setSelectedMaker = useModelStore((state) => state.setSelectedMaker);

  const { makers, isLoading, error, refetch } = useMakers();
  const [orderFeedback, setOrderFeedback] = useState<OrderFeedback | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const visibleMakers = useMemo(
    () => filterMakers(makers, filters),
    [makers, filters]
  );

  const isModelLoaded = model !== null;
  const modelWeight = model?.stats.weightGrams ?? 0;

  const handleOrder = useCallback(
    async (maker: Maker, delivery: DeliveryChoice): Promise<boolean> => {
      if (!model) return false;

      setIsSubmittingOrder(true);
      setOrderFeedback(null);

      try {
        const payload = buildOrderPayload(maker, model, delivery);
        const order = await createOrder(payload);

        if (model.sourceFile) {
          await uploadOrderModelFile(order.id, model.sourceFile);
        }

        setSelectedMaker({
          makerId: maker.id,
          makerName: maker.name,
          printCostCzk: order.customerPrintCzk,
          deliveryMethod: delivery.method,
          deliveryPriceCzk: order.deliveryPriceCzk,
        });

        setOrderFeedback({
          type: "success",
          title: t("map.orderSuccessTitle"),
          message: t("map.orderSuccess", { maker: maker.name }),
          orderId: order.id,
        });

        return true;
      } catch (submitError) {
        const message =
          submitError instanceof Error
            ? submitError.message
            : t("map.orderFailed");
        setOrderFeedback({ type: "error", message });
        return false;
      } finally {
        setIsSubmittingOrder(false);
      }
    },
    [model, setSelectedMaker, t]
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-zinc-100", className)}>
      <MapFiltersBar />

      {error && (
        <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          <span>{t("map.loadError", { error })}</span>
          <button
            type="button"
            onClick={refetch}
            className="font-semibold underline"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      {orderFeedback && (
        <div
          className={cn(
            "border-b px-4 py-3 text-sm",
            orderFeedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-700"
          )}
          role="status"
        >
          {orderFeedback.title && (
            <p className="font-semibold">{orderFeedback.title}</p>
          )}
          <p className={orderFeedback.title ? "mt-0.5 text-xs leading-relaxed" : ""}>
            {orderFeedback.message}
          </p>
          {orderFeedback.orderId && (
            <Link
              href={`/orders/${orderFeedback.orderId}`}
              className="mt-2 inline-block text-xs font-semibold text-emerald-900 underline"
            >
              {t("map.orderViewDetail")}
            </Link>
          )}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            {t("map.loadingMakers")}
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
