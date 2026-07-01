"use client";

import { useCallback, useEffect, useMemo } from "react";
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
import { MakerCheckoutPanel } from "@/components/map/maker-checkout-panel";
import { MapInvalidator } from "@/components/map/map-invalidator";
import { MapTouchSettings } from "@/components/map/map-touch-settings";
import { useAuth } from "@/components/auth/auth-provider";
import { useTranslations } from "@/i18n/locale-provider";
import { getPrintCostCzk } from "@/lib/map/pricing";
import { calculatePlatformFeeCzk } from "@/lib/orders/order-pricing";
import {
  getMakerPricePerGramCzk,
  resolvePricingPrinterType,
} from "@/lib/makers/maker-pricing";
import { useMapStore } from "@/store/map-store";
import type { DeliveryChoice } from "@/types/delivery";
import type { Maker } from "@/types/maker";
import type { UserLocation } from "@/types/map";
import { isOwnWorkshop } from "@/types/user";

import styles from "./Map.module.css";

export interface MapProps {
  isModelLoaded: boolean;
  modelWeight: number;
  makers: Maker[];
  userLocation?: UserLocation | null;
  onOrder: (
    maker: Maker,
    delivery: DeliveryChoice
  ) => boolean | void | Promise<boolean | void>;
  isSubmittingOrder?: boolean;
  /** Mobile: open bottom sheet instead of Leaflet popup */
  mobilePicker?: boolean;
  onMakerSelect?: (maker: Maker) => void;
  /** Re-run Leaflet invalidateSize when the map becomes visible */
  mapActive?: boolean;
}

function createUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: styles.userLocationRoot,
    html: `<div class="${styles.userLocationDot}" aria-hidden="true"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function MapViewport({
  center,
  userLocation,
}: {
  center: [number, number];
  userLocation?: UserLocation | null;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, userLocation ? 13 : map.getZoom(), { animate: true });
  }, [center, map, userLocation]);

  return null;
}

function createPinIcon(
  priceLabel: string,
  rating: number,
  deliveryTitle: string,
  variant: "default" | "hidden" | "busy" | "own" = "default"
): L.DivIcon {
  const ratingClass =
    rating >= 4.5
      ? styles.pinRatingHigh
      : rating >= 4.0
        ? styles.pinRatingMid
        : styles.pinRatingLow;

  const bubbleClass =
    variant === "own"
      ? styles.pinBubbleOwn
      : variant === "hidden"
        ? styles.pinBubbleHidden
        : variant === "busy"
          ? `${styles.pinBubble} ${styles.pinBubbleBusy}`
          : styles.pinBubble;

  const tipClass =
    variant === "hidden"
      ? styles.pinTipHidden
      : variant === "own"
        ? styles.pinTipOwn
        : variant === "busy"
          ? styles.pinTipBusy
          : styles.pinTip;

  const metaIcon =
    variant === "default"
      ? `<span class="${styles.deliveryIcon}" title="${deliveryTitle}" aria-hidden="true">🚗</span>`
      : "";

  return L.divIcon({
    className: styles.pinRoot,
    html: `
      <div class="${styles.pinWrapper}">
        <div class="${bubbleClass}">
          <span class="${styles.pinPrice}">${priceLabel}</span>
          <span class="${styles.pinMeta}">
            <span class="${styles.pinRating} ${ratingClass}">★ ${rating.toFixed(1)}</span>
            ${metaIcon}
          </span>
        </div>
        <div class="${tipClass}"></div>
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
  userLocation?: UserLocation | null;
  onOrder: (
    maker: Maker,
    delivery: DeliveryChoice
  ) => boolean | void | Promise<boolean | void>;
  isSubmittingOrder: boolean;
}

function MakerPopupContent(props: MakerPopupContentProps) {
  const map = useMap();

  return (
    <MakerCheckoutPanel
      {...props}
      onOrderSuccess={() => map.closePopup()}
    />
  );
}

export function Map({
  isModelLoaded,
  modelWeight,
  makers,
  userLocation = null,
  onOrder,
  isSubmittingOrder = false,
  mobilePicker = false,
  onMakerSelect,
  mapActive = true,
}: MapProps) {
  const { t } = useTranslations();
  const { user } = useAuth();
  const printerTypeFilter = useMapStore((state) => state.filters.printerType);
  const activePrinterType = resolvePricingPrinterType(printerTypeFilter);
  const weightGrams = isModelLoaded && modelWeight > 0 ? modelWeight : null;

  const getMakerPinIcon = useCallback(
    (maker: Maker) => {
      const isOwn = user ? isOwnWorkshop(user, maker.id) : false;
      const isHidden = maker.status === "hidden";
      const isBusy = maker.status === "busy";
      const pricePerGram = getMakerPricePerGramCzk(maker, activePrinterType);
      const pinLabel = isOwn
        ? t("map.ownWorkshopShort")
        : isHidden
          ? t("map.paused")
          : isBusy
            ? t("map.busyShort")
            : weightGrams !== null
              ? (() => {
                  const makerPrint = getPrintCostCzk(
                    maker,
                    weightGrams,
                    activePrinterType
                  );
                  const customerPrint =
                    makerPrint + calculatePlatformFeeCzk(makerPrint);
                  return `${customerPrint} ${t("common.czk")}`;
                })()
              : t("common.czkPerGram", { price: pricePerGram });

      const variant = isOwn
        ? "own"
        : isHidden
          ? "hidden"
          : isBusy
            ? "busy"
            : "default";

      return createPinIcon(
        pinLabel,
        maker.rating,
        t("map.deliveryAvailable"),
        variant
      );
    },
    [activePrinterType, weightGrams, t, user]
  );

  const center = useMemo(
    () =>
      userLocation
        ? ([userLocation.latitude, userLocation.longitude] as [number, number])
        : ([PRAGUE_CENTER.latitude, PRAGUE_CENTER.longitude] as [number, number]),
    [userLocation]
  );

  const userLocationIcon = useMemo(() => createUserLocationIcon(), []);

  return (
    <div className={styles.mapRoot}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className={styles.mapContainer}
      >
        <MapViewport center={center} userLocation={userLocation} />
        <MapTouchSettings />
        <MapInvalidator active={mapActive} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userLocationIcon}
            zIndexOffset={1000}
          />
        )}

        {makers.map((maker) => (
          <Marker
            key={maker.id}
            position={[maker.latitude, maker.longitude]}
            icon={getMakerPinIcon(maker)}
            eventHandlers={
              mobilePicker && onMakerSelect
                ? {
                    click: () => onMakerSelect(maker),
                  }
                : undefined
            }
          >
            {!mobilePicker && (
              <Popup closeButton>
                <MakerPopupContent
                  maker={maker}
                  isModelLoaded={isModelLoaded}
                  modelWeight={modelWeight}
                  userLocation={userLocation}
                  onOrder={onOrder}
                  isSubmittingOrder={isSubmittingOrder}
                />
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
