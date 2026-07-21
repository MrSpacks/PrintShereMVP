"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { FilamentColorSwatch } from "@/components/maker/filament-color-picker";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { buildAuthPath } from "@/lib/auth/safe-redirect";
import { getMakerDistanceKm } from "@/lib/map/filter-makers";
import { getCustomerQuoteCzk, getPrintCostCzk } from "@/lib/map/pricing";
import { recalculateOrderMoney } from "@/lib/orders/order-pricing";
import {
  getMakerPricePerGramCzk,
  resolvePricingPrinterType,
} from "@/lib/makers/maker-pricing";
import { savePendingOrderCheckout } from "@/lib/orders/pending-order-checkout";
import { useMapStore } from "@/store/map-store";
import type { DeliveryChoice, DeliveryMethod } from "@/types/delivery";
import type { Maker } from "@/types/maker";
import type { UserLocation } from "@/types/map";
import { isOwnWorkshop } from "@/types/user";
import { cn } from "@/lib/utils";
import {
  areCheckoutConsentsComplete,
  CheckoutConsents,
  type CheckoutConsentsValue,
} from "@/components/legal/checkout-consents";

import styles from "./Map.module.css";

export interface MakerCheckoutPanelProps {
  maker: Maker;
  isModelLoaded: boolean;
  modelVolumeCm3: number;
  userLocation?: UserLocation | null;
  onOrder: (
    maker: Maker,
    delivery: DeliveryChoice,
    consents: CheckoutConsentsValue
  ) => boolean | void | Promise<boolean | void>;
  isSubmittingOrder: boolean;
  onOrderSuccess?: () => void;
  className?: string;
}

export function MakerCheckoutPanel({
  maker,
  isModelLoaded,
  modelVolumeCm3,
  userLocation,
  onOrder,
  isSubmittingOrder,
  onOrderSuccess,
  className,
}: MakerCheckoutPanelProps) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const printerTypeFilter = useMapStore((state) => state.filters.printerType);
  const activePrinterType = resolvePricingPrinterType(printerTypeFilter);
  const { weightGrams, customerPrintCzk } =
    isModelLoaded && modelVolumeCm3 > 0
      ? getCustomerQuoteCzk(maker, modelVolumeCm3, activePrinterType)
      : { weightGrams: null, customerPrintCzk: null };
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [consents, setConsents] = useState<CheckoutConsentsValue>({
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedCustomManufacture: false,
  });

  const rawPrintCzk =
    weightGrams !== null
      ? Math.round(
          weightGrams * getMakerPricePerGramCzk(maker, activePrinterType)
        )
      : null;
  const makerPrintCzk =
    weightGrams !== null
      ? getPrintCostCzk(maker, weightGrams, activePrinterType)
      : null;
  const minOrderApplied =
    rawPrintCzk !== null &&
    maker.minOrderPriceCzk > 0 &&
    rawPrintCzk < maker.minOrderPriceCzk;

  const deliveryPriceCzk =
    deliveryMethod === "delivery" && maker.offersDelivery
      ? maker.deliveryPriceCzk
      : 0;

  const orderMoney =
    makerPrintCzk !== null
      ? recalculateOrderMoney({
          printCostCzk: makerPrintCzk,
          deliveryPriceCzk,
        })
      : null;

  const priceLabel =
    orderMoney !== null
      ? `${orderMoney.printCostCzk + orderMoney.platformFeeCzk} ${t("common.czk")}`
      : customerPrintCzk !== null
        ? `${customerPrintCzk} ${t("common.czk")}`
        : t("common.czkPerGram", {
            price: getMakerPricePerGramCzk(maker, activePrinterType),
          });

  const totalCzk = orderMoney?.customerTotalCzk ?? null;

  const isOwn = user ? isOwnWorkshop(user, maker.id) : false;

  const orderReady =
    !isOwn &&
    weightGrams !== null &&
    maker.status === "available" &&
    !isSubmittingOrder &&
    areCheckoutConsentsComplete(consents) &&
    (deliveryMethod === "pickup" ||
      (maker.offersDelivery && maker.deliveryPriceCzk > 0));

  const canPlaceOrder = orderReady && Boolean(user);
  const canContinueToAuth = orderReady && !user;

  const distanceKm =
    userLocation !== null && userLocation !== undefined
      ? getMakerDistanceKm(maker, userLocation)
      : null;

  const materialTags = [
    {
      key: activePrinterType,
      label:
        activePrinterType === "fdm"
          ? t("printer.plastic")
          : t("printer.resinShort"),
      colorId: null as string | null,
    },
    ...maker.filaments
      .filter((filament) => filament.printerType === activePrinterType)
      .map((filament) => ({
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

  const handleOrderClick = async () => {
    if (!areCheckoutConsentsComplete(consents)) return;

    const delivery: DeliveryChoice = {
      method: deliveryMethod === "delivery" ? "delivery" : "pickup",
      deliveryPriceCzk,
    };

    if (!user) {
      savePendingOrderCheckout({
        makerId: maker.id,
        deliveryMethod: delivery.method,
        deliveryPriceCzk: delivery.deliveryPriceCzk,
        acceptedTerms: consents.acceptedTerms,
        acceptedPrivacy: consents.acceptedPrivacy,
        acceptedCustomManufacture: consents.acceptedCustomManufacture,
      });
      router.push(buildAuthPath("/login", "/"));
      return;
    }

    const succeeded = await onOrder(maker, delivery, consents);
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

        {minOrderApplied && makerPrintCzk !== null && (
            <p className={styles.deliveryHint}>
              {t("map.minOrderApplied", {
                min: maker.minOrderPriceCzk,
                raw: rawPrintCzk ?? 0,
              })}
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

            {maker.offersDelivery && maker.deliveryPriceCzk > 0 ? (
              <label className={styles.deliveryOption}>
                <input
                  type="radio"
                  name={`delivery-${maker.id}`}
                  checked={deliveryMethod === "delivery"}
                  onChange={() => setDeliveryMethod("delivery")}
                />
                <span>
                  {t("map.makerDelivery")} — {maker.deliveryPriceCzk}{" "}
                  {t("common.czk")}
                </span>
              </label>
            ) : (
              <p className={styles.deliveryHint}>{t("map.pickupOnly")}</p>
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

        {!isOwn && weightGrams !== null && (
          <CheckoutConsents value={consents} onChange={setConsents} />
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
            : !isModelLoaded || modelVolumeCm3 <= 0
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
