"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FilamentColorSwatch } from "@/components/maker/filament-color-picker";
import { useAuth } from "@/components/auth/auth-provider";
import { MOCK_ZASILKOVNA_POINTS } from "@/data/zasilkovna-points";
import { useTranslations } from "@/i18n/locale-provider";
import { buildAuthPath } from "@/lib/auth/safe-redirect";
import { getMakerDistanceKm } from "@/lib/map/filter-makers";
import { getPrintCostCzk } from "@/lib/map/pricing";
import { calculatePlatformFeeCzk } from "@/lib/orders/order-pricing";
import { fetchZasilkovnaQuote } from "@/lib/orders/create-order";
import { savePendingOrderCheckout } from "@/lib/orders/pending-order-checkout";
import type { DeliveryChoice, DeliveryMethod } from "@/types/delivery";
import type { Maker } from "@/types/maker";
import type { UserLocation } from "@/types/map";
import { isOwnWorkshop } from "@/types/user";
import { cn } from "@/lib/utils";

import styles from "./Map.module.css";

export interface MakerCheckoutPanelProps {
  maker: Maker;
  isModelLoaded: boolean;
  modelWeight: number;
  userLocation?: UserLocation | null;
  onOrder: (
    maker: Maker,
    delivery: DeliveryChoice
  ) => boolean | void | Promise<boolean | void>;
  isSubmittingOrder: boolean;
  onOrderSuccess?: () => void;
  className?: string;
}

export function MakerCheckoutPanel({
  maker,
  isModelLoaded,
  modelWeight,
  userLocation,
  onOrder,
  isSubmittingOrder,
  onOrderSuccess,
  className,
}: MakerCheckoutPanelProps) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const weightGrams = isModelLoaded && modelWeight > 0 ? modelWeight : null;
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [deliveryPriceCzk, setDeliveryPriceCzk] = useState(0);
  const [zasilkovnaPointId, setZasilkovnaPointId] = useState("");
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const makerPrintCzk =
    weightGrams !== null ? getPrintCostCzk(maker, weightGrams) : null;
  const platformFeeCzk =
    makerPrintCzk !== null ? calculatePlatformFeeCzk(makerPrintCzk) : 0;
  const customerPrintCzk =
    makerPrintCzk !== null ? makerPrintCzk + platformFeeCzk : null;

  const priceLabel =
    customerPrintCzk !== null
      ? `${customerPrintCzk} ${t("common.czk")}`
      : t("common.czkPerGram", { price: maker.pricePerGramCzk });

  const totalCzk =
    customerPrintCzk !== null ? customerPrintCzk + deliveryPriceCzk : null;

  useEffect(() => {
    if (deliveryMethod !== "zasilkovna" || weightGrams === null) {
      setDeliveryPriceCzk(0);
      setQuoteError(null);
      return;
    }

    let cancelled = false;

    async function loadQuote() {
      setIsLoadingQuote(true);
      setQuoteError(null);

      try {
        const price = await fetchZasilkovnaQuote(maker.id, weightGrams!);
        if (!cancelled) setDeliveryPriceCzk(price);
      } catch (error) {
        if (!cancelled) {
          setDeliveryPriceCzk(0);
          setQuoteError(
            error instanceof Error ? error.message : t("map.quoteFailed")
          );
        }
      } finally {
        if (!cancelled) setIsLoadingQuote(false);
      }
    }

    void loadQuote();

    return () => {
      cancelled = true;
    };
  }, [deliveryMethod, maker.id, weightGrams, t]);

  const isOwn = user ? isOwnWorkshop(user, maker.id) : false;

  const orderReady =
    !isOwn &&
    weightGrams !== null &&
    maker.status === "available" &&
    !isSubmittingOrder &&
    !isLoadingQuote &&
    (deliveryMethod === "pickup" ||
      (deliveryPriceCzk > 0 && zasilkovnaPointId.length > 0)) &&
    (makerPrintCzk === null ||
      maker.minOrderPriceCzk === 0 ||
      makerPrintCzk >= maker.minOrderPriceCzk);

  const canPlaceOrder = orderReady && Boolean(user);
  const canContinueToAuth = orderReady && !user;

  const distanceKm =
    userLocation !== null && userLocation !== undefined
      ? getMakerDistanceKm(maker, userLocation)
      : null;

  const materialTags = [
    ...maker.printerTypes.map((type) => ({
      key: type,
      label: type === "fdm" ? t("printer.plastic") : t("printer.resinShort"),
      colorId: null as string | null,
    })),
    ...maker.filaments.map((filament) => ({
      key: filament.id,
      label: `${filament.material} · ${filament.color}`,
      colorId: filament.color,
    })),
  ];
  const visibleTags = materialTags.slice(0, 4);
  const hiddenTagCount = materialTags.length - visibleTags.length;

  const distanceLabel =
    distanceKm !== null
      ? distanceKm < 1
        ? t("map.distanceMeters", {
            meters: Math.round(distanceKm * 1000),
          })
        : t("map.distanceKm", { km: distanceKm.toFixed(1) })
      : null;

  const selectedPoint = MOCK_ZASILKOVNA_POINTS.find(
    (point) => point.id === zasilkovnaPointId
  );

  const handleOrderClick = async () => {
    const delivery: DeliveryChoice = {
      method: deliveryMethod,
      deliveryPriceCzk:
        deliveryMethod === "zasilkovna" ? deliveryPriceCzk : 0,
      zasilkovnaPointId:
        deliveryMethod === "zasilkovna" ? zasilkovnaPointId : undefined,
      zasilkovnaPointLabel: selectedPoint?.label,
    };

    if (!user) {
      savePendingOrderCheckout({
        makerId: maker.id,
        deliveryMethod: delivery.method,
        deliveryPriceCzk: delivery.deliveryPriceCzk,
        zasilkovnaPointId: delivery.zasilkovnaPointId,
        zasilkovnaPointLabel: delivery.zasilkovnaPointLabel,
      });
      router.push(buildAuthPath("/login", "/"));
      return;
    }

    const succeeded = await onOrder(maker, delivery);
    if (succeeded) {
      onOrderSuccess?.();
    }
  };

  return (
    <div className={cn(styles.popup, className)}>
      <div className={styles.popupHeader}>
        <h3 className={styles.popupTitle}>
          <span className={styles.popupTitleText}>{maker.name}</span>
          <span className={styles.popupTitleRating}>
            <span className={styles.popupStar} aria-hidden>
              ★
            </span>
            {maker.rating.toFixed(1)}
          </span>
        </h3>
      </div>

      <div className={styles.popupBody}>
        <div className={styles.popupRow}>
          <span className={styles.popupLabel}>{t("map.printPrice")}</span>
          <span className={styles.popupValue}>{priceLabel}</span>
        </div>

        {maker.minOrderPriceCzk > 0 && (
          <div className={styles.popupRow}>
            <span className={styles.popupLabel}>{t("map.minOrder")}</span>
            <span className={styles.popupValue}>
              {maker.minOrderPriceCzk} {t("common.czk")}
            </span>
          </div>
        )}

        {makerPrintCzk !== null &&
          maker.minOrderPriceCzk > 0 &&
          makerPrintCzk < maker.minOrderPriceCzk && (
            <p className={styles.deliveryError}>
              {t("map.belowMinimum", { min: maker.minOrderPriceCzk })}
            </p>
          )}

        <p className={styles.popupAddress}>
          {maker.address}
          {distanceLabel && (
            <span className={styles.popupDistance}> · {distanceLabel}</span>
          )}
        </p>

        {isOwn && (
          <p className={styles.ownWorkshopBadge}>{t("map.ownWorkshop")}</p>
        )}

        <div className={styles.materials}>
          {visibleTags.map((tag) => (
            <span key={tag.key} className={styles.materialTag}>
              {tag.colorId ? (
                <FilamentColorSwatch
                  colorId={tag.colorId}
                  size="sm"
                  className={styles.materialTagSwatch}
                />
              ) : null}
              {tag.label}
            </span>
          ))}
          {hiddenTagCount > 0 && (
            <span className={styles.materialTagMuted}>+{hiddenTagCount}</span>
          )}
        </div>

        {weightGrams !== null && !isOwn && (
          <div className={styles.deliveryBlock}>
            <p className={styles.deliveryTitle}>{t("map.delivery")}</p>

            <label className={styles.deliveryOption}>
              <input
                type="radio"
                name={`delivery-${maker.id}`}
                checked={deliveryMethod === "pickup"}
                onChange={() => setDeliveryMethod("pickup")}
              />
              <span>{t("map.pickupFree")}</span>
            </label>

            <label className={styles.deliveryOption}>
              <input
                type="radio"
                name={`delivery-${maker.id}`}
                checked={deliveryMethod === "zasilkovna"}
                onChange={() => setDeliveryMethod("zasilkovna")}
              />
              <span>
                {t("map.zasilkovna")}
                {isLoadingQuote && ` — ${t("map.calculating")}`}
                {!isLoadingQuote &&
                  deliveryMethod === "zasilkovna" &&
                  deliveryPriceCzk > 0 &&
                  ` — ${deliveryPriceCzk} ${t("common.czk")}`}
              </span>
            </label>

            {quoteError && (
              <p className={styles.deliveryError}>{quoteError}</p>
            )}

            {deliveryMethod === "zasilkovna" && (
              <div className={styles.pickupPointSelect}>
                <select
                  id={`pickup-${maker.id}`}
                  value={zasilkovnaPointId}
                  onChange={(event) => setZasilkovnaPointId(event.target.value)}
                  className={styles.pickupSelect}
                  aria-label={t("map.pickupPoint")}
                >
                  <option value="">{t("map.selectPickupPoint")}</option>
                  {MOCK_ZASILKOVNA_POINTS.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {weightGrams !== null && totalCzk !== null && (
          <div className={styles.popupRow}>
            <span className={styles.popupLabel}>{t("map.total")}</span>
            <span className={styles.popupValue}>
              {totalCzk} {t("common.czk")}
            </span>
          </div>
        )}

        <span
          className={
            maker.status === "available"
              ? styles.statusAvailable
              : maker.status === "hidden"
                ? styles.statusHidden
                : styles.statusBusy
          }
        >
          {maker.status === "available"
            ? t("map.available")
            : maker.status === "hidden"
              ? t("map.paused")
              : t("map.busy")}
        </span>
      </div>

      <button
        type="button"
        className={styles.orderButton}
        disabled={!canPlaceOrder && !canContinueToAuth}
        onClick={() => void handleOrderClick()}
      >
        {isOwn
          ? t("map.ownWorkshop")
          : isSubmittingOrder
            ? t("map.savingOrder")
            : isLoadingQuote
              ? t("map.calculatingDelivery")
              : !isModelLoaded || modelWeight <= 0
                ? t("map.uploadToOrder")
                : !user && canContinueToAuth
                  ? t("map.loginToOrder")
                  : maker.status === "available"
                    ? t("map.orderPrinting")
                    : maker.status === "hidden"
                      ? t("map.paused")
                      : t("map.currentlyBusy")}
      </button>
    </div>
  );
}
