"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { PRAGUE_CENTER } from "@/data/makers";
import { getMakerMaterialLabels } from "@/lib/makers/map-maker";
import { getPinPriceDisplay, getPrintCostCzk } from "@/lib/map/pricing";
import { fetchZasilkovnaQuote } from "@/lib/orders/create-order";
import type { DeliveryChoice, DeliveryMethod } from "@/types/delivery";
import type { Maker } from "@/types/maker";

import styles from "./Map.module.css";

export interface MapProps {
  isModelLoaded: boolean;
  modelWeight: number;
  makers: Maker[];
  onOrder: (maker: Maker, delivery: DeliveryChoice) => void | Promise<void>;
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
  onOrder: (maker: Maker, delivery: DeliveryChoice) => void | Promise<void>;
  isSubmittingOrder: boolean;
}

function MakerPopupContent({
  maker,
  isModelLoaded,
  modelWeight,
  onOrder,
  isSubmittingOrder,
}: MakerPopupContentProps) {
  const weightGrams = isModelLoaded && modelWeight > 0 ? modelWeight : null;
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("pickup");
  const [deliveryPriceCzk, setDeliveryPriceCzk] = useState(0);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const printCostCzk =
    weightGrams !== null ? getPrintCostCzk(maker, weightGrams) : null;

  const priceLabel =
    printCostCzk !== null
      ? `${printCostCzk} CZK`
      : `${maker.pricePerGramCzk} CZK/g`;

  const totalCzk =
    printCostCzk !== null ? printCostCzk + deliveryPriceCzk : null;

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
            error instanceof Error ? error.message : "Quote failed"
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
  }, [deliveryMethod, maker.id, weightGrams]);

  const canOrder =
    weightGrams !== null &&
    maker.status === "available" &&
    !isSubmittingOrder &&
    !isLoadingQuote &&
    (deliveryMethod === "pickup" || deliveryPriceCzk > 0) &&
    (printCostCzk === null ||
      maker.minOrderPriceCzk === 0 ||
      printCostCzk >= maker.minOrderPriceCzk);

  const materialLabels = getMakerMaterialLabels(maker);

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
          <span className={styles.popupLabel}>Print price</span>
          <span className={styles.popupValue}>{priceLabel}</span>
        </div>

        {maker.minOrderPriceCzk > 0 && (
          <div className={styles.popupRow}>
            <span className={styles.popupLabel}>Min. order</span>
            <span className={styles.popupValue}>
              {maker.minOrderPriceCzk} CZK
            </span>
          </div>
        )}

        {printCostCzk !== null &&
          maker.minOrderPriceCzk > 0 &&
          printCostCzk < maker.minOrderPriceCzk && (
            <p className={styles.deliveryError}>
              Print cost is below this maker&apos;s minimum ({maker.minOrderPriceCzk}{" "}
              CZK)
            </p>
          )}

        <p className={styles.popupAddress}>{maker.address}</p>

        <div className={styles.materials}>
          {maker.printerTypes.map((type) => (
            <span key={type} className={styles.materialTag}>
              {type === "fdm" ? "Plastic" : "Resin"}
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
            <p className={styles.deliveryTitle}>Delivery</p>

            <label className={styles.deliveryOption}>
              <input
                type="radio"
                name={`delivery-${maker.id}`}
                checked={deliveryMethod === "pickup"}
                onChange={() => setDeliveryMethod("pickup")}
              />
              <span>Pickup at workshop — Free</span>
            </label>

            <label className={styles.deliveryOption}>
              <input
                type="radio"
                name={`delivery-${maker.id}`}
                checked={deliveryMethod === "zasilkovna"}
                onChange={() => setDeliveryMethod("zasilkovna")}
              />
              <span>
                Zásilkovna parcel
                {isLoadingQuote && " — calculating…"}
                {!isLoadingQuote &&
                  deliveryMethod === "zasilkovna" &&
                  deliveryPriceCzk > 0 &&
                  ` — ${deliveryPriceCzk} CZK`}
              </span>
            </label>

            {quoteError && (
              <p className={styles.deliveryError}>{quoteError}</p>
            )}
          </div>
        )}

        {totalCzk !== null && (
          <div className={styles.popupRow}>
            <span className={styles.popupLabel}>Total</span>
            <span className={styles.popupValue}>{totalCzk} CZK</span>
          </div>
        )}

        <span
          className={
            maker.status === "available"
              ? styles.statusAvailable
              : styles.statusBusy
          }
        >
          {maker.status === "available" ? "Available" : "Busy"}
        </span>
      </div>

      <button
        type="button"
        className={styles.orderButton}
        disabled={!canOrder}
        onClick={() =>
          onOrder(maker, {
            method: deliveryMethod,
            deliveryPriceCzk:
              deliveryMethod === "zasilkovna" ? deliveryPriceCzk : 0,
          })
        }
      >
        {isSubmittingOrder
          ? "Saving order…"
          : isLoadingQuote
            ? "Calculating delivery…"
            : !isModelLoaded || modelWeight <= 0
              ? "Upload a model to order"
              : maker.status === "available"
                ? "Order Printing"
                : "Currently busy"}
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
  const weightGrams = isModelLoaded && modelWeight > 0 ? modelWeight : null;

  const getMakerPinIcon = useCallback(
    (maker: Maker) => {
      const price = getPinPriceDisplay(maker, weightGrams);
      const pinLabel =
        weightGrams !== null
          ? `${price.printCostCzk} CZK`
          : price.label;

      return createPinIcon(pinLabel);
    },
    [weightGrams]
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
