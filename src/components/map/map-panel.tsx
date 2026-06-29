"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MapFiltersBar } from "@/components/map/map-filters";
import { MakerListPanel } from "@/components/map/maker-list-panel";
import { MakerCheckoutPanel } from "@/components/map/maker-checkout-panel";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useAuth } from "@/components/auth/auth-provider";
import { useMakers } from "@/hooks/use-makers";
import { isOwnWorkshop } from "@/types/user";
import { useUserLocation } from "@/hooks/use-user-location";
import { useTranslations } from "@/i18n/locale-provider";
import { filterMakers, sortMakersByDistance } from "@/lib/map/filter-makers";
import {
  buildOrderPayload,
  createOrder,
  uploadOrderModelFile,
} from "@/lib/orders/create-order";
import {
  clearPendingOrderCheckout,
  loadPendingOrderCheckout,
} from "@/lib/orders/pending-order-checkout";
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
  mobileMode?: boolean;
  mapActive?: boolean;
}

interface OrderFeedback {
  type: "success" | "error";
  title?: string;
  message: string;
  orderId?: string;
}

export function MapPanel({
  className,
  mobileMode = false,
  mapActive = true,
}: MapPanelProps) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const filters = useMapStore((state) => state.filters);
  const userLocation = useMapStore((state) => state.userLocation);
  const { requestLocation, locationStatus, isLocationSupported } =
    useUserLocation();
  const model = useModelStore((state) => state.model);
  const setSelectedMaker = useModelStore((state) => state.setSelectedMaker);

  const { makers, isLoading, error, refetch } = useMakers();
  const [orderFeedback, setOrderFeedback] = useState<OrderFeedback | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [selectedMaker, setSheetMaker] = useState<Maker | null>(null);
  const resumedCheckoutRef = useRef(false);

  useEffect(() => {
    if (isLocationSupported && locationStatus === "idle") {
      requestLocation();
    }
  }, [isLocationSupported, locationStatus, requestLocation]);

  const visibleMakers = useMemo(() => {
    const filtered = filterMakers(makers, filters, userLocation);
    if (!userLocation) return filtered;
    return sortMakersByDistance(filtered, userLocation);
  }, [makers, filters, userLocation]);

  const isModelLoaded = model !== null;
  const modelWeight = model?.stats.weightGrams ?? 0;

  const handleOrder = useCallback(
    async (maker: Maker, delivery: DeliveryChoice): Promise<boolean> => {
      if (!model) return false;
      if (user && isOwnWorkshop(user, maker.id)) return false;

      setIsSubmittingOrder(true);
      setOrderFeedback(null);

      try {
        const payload = buildOrderPayload(maker, model, delivery);
        const order = await createOrder(payload);

        if (model.sourceFile) {
          await uploadOrderModelFile(order.id, model.sourceFile, model.fileName);
        }

        setSelectedMaker({
          makerId: maker.id,
          makerName: maker.name,
          printCostCzk: order.customerPrintCzk ?? order.printCostCzk,
          deliveryMethod: delivery.method,
          deliveryPriceCzk: order.deliveryPriceCzk ?? 0,
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
    [model, setSelectedMaker, t, user]
  );

  useEffect(() => {
    if (resumedCheckoutRef.current || !user || isLoading) return;

    const pending = loadPendingOrderCheckout();
    if (!pending) return;

    if (!model) {
      clearPendingOrderCheckout();
      return;
    }

    const maker = makers.find((item) => item.id === pending.makerId);
    if (!maker) {
      clearPendingOrderCheckout();
      return;
    }

    resumedCheckoutRef.current = true;
    clearPendingOrderCheckout();

    const delivery: DeliveryChoice = {
      method: pending.deliveryMethod,
      deliveryPriceCzk: pending.deliveryPriceCzk,
      zasilkovnaPointId: pending.zasilkovnaPointId,
      zasilkovnaPointLabel: pending.zasilkovnaPointLabel,
    };

    if (mobileMode) {
      setSheetMaker(maker);
    }

    void handleOrder(maker, delivery);
  }, [user, model, makers, isLoading, handleOrder, mobileMode]);

  const handleMakerSelect = useCallback((maker: Maker) => {
    setSheetMaker(maker);
  }, []);

  const closeMakerSheet = useCallback(() => {
    setSheetMaker(null);
  }, []);

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-zinc-100", className)}>
      <MapFiltersBar mobileCompact={mobileMode} />

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

      <div
        className={cn(
          "relative min-h-0 flex-1",
          mobileMode && "min-h-[42vh]"
        )}
      >
        {isLoading ? (
          <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-zinc-500">
            {t("map.loadingMakers")}
          </div>
        ) : (
          <Map
            isModelLoaded={isModelLoaded}
            modelWeight={modelWeight}
            makers={visibleMakers}
            userLocation={userLocation}
            onOrder={handleOrder}
            isSubmittingOrder={isSubmittingOrder}
            mobilePicker={mobileMode}
            onMakerSelect={mobileMode ? handleMakerSelect : undefined}
            mapActive={mapActive}
          />
        )}
      </div>

      {mobileMode && !isLoading && (
        <MakerListPanel
          makers={visibleMakers}
          userLocation={userLocation}
          modelWeight={modelWeight}
          isModelLoaded={isModelLoaded}
          onSelectMaker={handleMakerSelect}
          className="pb-20"
        />
      )}

      {mobileMode && selectedMaker && (
        <BottomSheet
          open
          onClose={closeMakerSheet}
          title={selectedMaker.name}
        >
          <MakerCheckoutPanel
            maker={selectedMaker}
            isModelLoaded={isModelLoaded}
            modelWeight={modelWeight}
            userLocation={userLocation}
            onOrder={handleOrder}
            isSubmittingOrder={isSubmittingOrder}
            onOrderSuccess={closeMakerSheet}
          />
        </BottomSheet>
      )}
    </div>
  );
}
