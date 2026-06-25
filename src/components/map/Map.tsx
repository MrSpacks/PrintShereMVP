"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { PRAGUE_CENTER } from "@/data/makers";
import { MOCK_ZASILKOVNA_POINTS } from "@/data/zasilkovna-points";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { getMakerMaterialLabels } from "@/lib/makers/map-maker";
import { getPrintCostCzk } from "@/lib/map/pricing";
import { fetchZasilkovnaQuote } from "@/lib/orders/create-order";
import { calculatePlatformFeeCzk } from "@/lib/orders/order-pricing";
import type { DeliveryChoice, DeliveryMethod } from "@/types/delivery";
import type { Maker } from "@/types/maker";

import styles from "./Map.module.css";

export interface MapProps {
  isModelLoaded: boolean;
  modelWeight: number;
  makers: Maker[];
  onOrder: (
    maker: Maker,
    delivery: DeliveryChoice
  ) => boolean | void | Promise<boolean | void>;
  isSubmittingOrder?: boolean;
}

function createPinIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: styles.pinRoot,
    html: `
      <div class="${styles.pinWrapper}">
        <div class="${styles.pinBubble}">
          <span>${label}</span>
        </div>
        <div class="${styles.pinTip}"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

interface MakerPopupContentProps {
  maker: Maker;
  isModelLoaded: boolean;
  modelWeight: number;
  onOrder: (
    maker: Maker,
    delivery: DeliveryChoice
  ) => boolean | void | Promise<boolean | void>;
  isSubmittingOrder: boolean;
}

function MakerPopupContent({
  maker,
  isModelLoaded,
  modelWeight,
  onOrder,
  isSubmittingOrder,
}: MakerPopupContentProps) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const map = useMap();
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

  const canOrder =
    Boolean(user) &&
    weightGrams !== null &&
    maker.status === "available" &&
    !isSubmittingOrder &&
    !isLoadingQuote &&
    (deliveryMethod === "pickup" ||
      (deliveryPriceCzk > 0 && zasilkovnaPointId.length > 0)) &&
    (makerPrintCzk === null ||
      maker.minOrderPriceCzk === 0 ||
      makerPrintCzk >= maker.minOrderPriceCzk);

  const materialLabels = getMakerMaterialLabels(maker);

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

    const succeeded = await onOrder(maker, delivery);
    if (succeeded) {
      map.closePopup();
    }
  };

  return (
    <div className={styles.popup}>
      <div className={styles.popupHeader}>
        <h3 className={styles.popupTitle}>{maker.name}</h3>
        <div className={styles.popupRating}>
          <span className={styles.popupStar} aria-hidden>
            ★
          </span>
          <span>{maker.rating.toFixed(1)}</span>
        </div>
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

        <p className={styles.popupAddress}>{maker.address}</p>

        <div className={styles.materials}>
          {maker.printerTypes.map((type) => (
            <span key={type} className={styles.materialTag}>
              {type === "fdm" ? t("printer.plastic") : t("printer.resinShort")}
            </span>
          ))}
          {materialLabels.map((label) => (
            <span key={label} className={styles.materialTag}>
              {label}
            </span>
          ))}
        </div>

        {weightGrams !== null && (
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
                <label htmlFor={`pickup-${maker.id}`} className={styles.pickupLabel}>
                  {t("map.pickupPoint")}
                </label>
                <select
                  id={`pickup-${maker.id}`}
                  value={zasilkovnaPointId}
                  onChange={(event) => setZasilkovnaPointId(event.target.value)}
                  className={styles.pickupSelect}
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

        {totalCzk !== null && (
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
              : styles.statusBusy
          }
        >
          {maker.status === "available" ? t("map.available") : t("map.busy")}
        </span>
      </div>

      <button
        type="button"
        className={styles.orderButton}
        disabled={!canOrder}
        onClick={() => void handleOrderClick()}
      >
        {isSubmittingOrder
          ? t("map.savingOrder")
          : isLoadingQuote
            ? t("map.calculatingDelivery")
            : !user
              ? t("map.loginToOrder")
            : !isModelLoaded || modelWeight <= 0
              ? t("map.uploadToOrder")
              : maker.status === "available"
                ? t("map.orderPrinting")
                : t("map.currentlyBusy")}
      </button>
    </div>
  );
}

export function Map({
  isModelLoaded,
  modelWeight,
  makers,
  onOrder,
  isSubmittingOrder = false,
}: MapProps) {
  const { t } = useTranslations();
  const weightGrams = isModelLoaded && modelWeight > 0 ? modelWeight : null;

  const getMakerPinIcon = useCallback(
    (maker: Maker) => {
      const pinLabel =
        weightGrams !== null
          ? (() => {
              const makerPrint = getPrintCostCzk(maker, weightGrams);
              const customerPrint =
                makerPrint + calculatePlatformFeeCzk(makerPrint);
              return `${customerPrint} ${t("common.czk")}`;
            })()
          : t("common.czkPerGram", { price: maker.pricePerGramCzk });

      return createPinIcon(pinLabel);
    },
    [weightGrams, t]
  );

  const center = useMemo(
    () => [PRAGUE_CENTER.latitude, PRAGUE_CENTER.longitude] as [number, number],
    []
  );

  return (
    <div className={styles.mapRoot}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className={styles.mapContainer}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {makers.map((maker) => (
          <Marker
            key={maker.id}
            position={[maker.latitude, maker.longitude]}
            icon={getMakerPinIcon(maker)}
          >
            <Popup closeButton>
              <MakerPopupContent
                maker={maker}
                isModelLoaded={isModelLoaded}
                modelWeight={modelWeight}
                onOrder={onOrder}
                isSubmittingOrder={isSubmittingOrder}
              />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
