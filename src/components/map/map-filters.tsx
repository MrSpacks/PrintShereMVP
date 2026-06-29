"use client";

import { MapPin, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useUserLocation } from "@/hooks/use-user-location";
import { useMapStore } from "@/store/map-store";
import {
  FDM_MATERIAL_OPTIONS,
  PRINTER_TYPES,
  RESIN_MATERIAL_OPTIONS,
} from "@/lib/makers/capabilities";
import { useTranslations } from "@/i18n/locale-provider";
import type { PrinterType } from "@/types/maker";
import { cn } from "@/lib/utils";

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="flex min-h-11 flex-col gap-1.5 text-sm font-medium text-zinc-700 sm:flex-row sm:items-center sm:gap-2 sm:text-xs sm:text-zinc-600">
      <span className="shrink-0">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30 sm:h-8 sm:w-auto sm:px-2 sm:text-xs"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface MapFiltersFormProps {
  className?: string;
}

export function MapFiltersForm({ className }: MapFiltersFormProps) {
  const { t } = useTranslations();
  const filters = useMapStore((state) => state.filters);
  const setMaxDistanceKm = useMapStore((state) => state.setMaxDistanceKm);
  const setMinRating = useMapStore((state) => state.setMinRating);
  const setMaterial = useMapStore((state) => state.setMaterial);
  const setPrinterType = useMapStore((state) => state.setPrinterType);
  const {
    userLocation,
    locationStatus,
    locationError,
    requestLocation,
    clearLocation,
    isLocationSupported,
  } = useUserLocation();

  const handleDistanceChange = (value: string) => {
    const nextDistance = value === "any" ? null : Number(value);
    setMaxDistanceKm(nextDistance);

    if (nextDistance !== null && !userLocation && isLocationSupported) {
      requestLocation();
    }
  };

  const locationButtonLabel =
    locationStatus === "loading"
      ? t("map.locationLoading")
      : locationStatus === "granted"
        ? t("map.locationActive")
        : locationStatus === "denied"
          ? t("map.locationDenied")
          : t("map.useMyLocation");

  const locationHint =
    locationStatus === "denied"
      ? t("map.locationDeniedHint")
      : locationStatus === "error"
        ? t(`map.locationError.${locationError ?? "unknown"}`)
        : locationStatus === "granted"
          ? t("map.locationActiveHint")
          : t("map.locationHint");

  const distanceOptions = [
    { label: t("filters.any"), value: "any" },
    { label: "2 km", value: "2" },
    { label: "5 km", value: "5" },
    { label: "10 km", value: "10" },
  ];

  const ratingOptions = [
    { label: t("filters.any"), value: "any" },
    { label: "4.0+", value: "4" },
    { label: "4.5+", value: "4.5" },
  ];

  const materialOptions = [
    { label: t("filters.allMaterials"), value: "all" },
    ...FDM_MATERIAL_OPTIONS.map((material) => ({
      label: material,
      value: material,
    })),
    ...RESIN_MATERIAL_OPTIONS.map((material) => ({
      label: material,
      value: material,
    })),
  ];

  const printerOptions = [
    { label: t("filters.allTypes"), value: "all" },
    ...PRINTER_TYPES.map((type) => ({
      label: t(`printer.${type.id}`),
      value: type.id,
    })),
  ];

  return (
    <div className={cn("flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-0", className)}>
      <button
        type="button"
        onClick={() =>
          locationStatus === "granted" ? clearLocation() : requestLocation()
        }
        disabled={!isLocationSupported || locationStatus === "loading"}
        className={cn(
          "inline-flex h-11 min-h-11 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:h-8 sm:px-2.5 sm:text-xs",
          locationStatus === "granted"
            ? "border-brand bg-brand/10 text-brand"
            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        )}
        title={locationHint}
      >
        <MapPin className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden />
        <span>{locationButtonLabel}</span>
      </button>

      <FilterSelect
        label={t("filters.distance")}
        value={filters.maxDistanceKm?.toString() ?? "any"}
        onChange={handleDistanceChange}
        options={distanceOptions}
      />

      <FilterSelect
        label={t("filters.rating")}
        value={filters.minRating?.toString() ?? "any"}
        onChange={(value) =>
          setMinRating(value === "any" ? null : Number(value))
        }
        options={ratingOptions}
      />

      <FilterSelect
        label={t("filters.printer")}
        value={filters.printerType}
        onChange={(value) => setPrinterType(value as PrinterType | "all")}
        options={printerOptions}
      />

      <FilterSelect
        label={t("filters.materials")}
        value={filters.material}
        onChange={setMaterial}
        options={materialOptions}
      />
    </div>
  );
}

interface MapFiltersBarProps {
  className?: string;
  mobileCompact?: boolean;
}

export function MapFiltersBar({
  className,
  mobileCompact = false,
}: MapFiltersBarProps) {
  const { t } = useTranslations();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    locationStatus,
    requestLocation,
    clearLocation,
    isLocationSupported,
  } = useUserLocation();

  const locationButtonLabel =
    locationStatus === "loading"
      ? t("map.locationLoading")
      : locationStatus === "granted"
        ? t("map.locationActive")
        : locationStatus === "denied"
          ? t("map.locationDenied")
          : t("map.useMyLocation");

  if (mobileCompact) {
    return (
      <>
        <div
          className={cn(
            "flex items-center gap-2 border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur",
            className
          )}
        >
          <button
            type="button"
            onClick={() =>
              locationStatus === "granted" ? clearLocation() : requestLocation()
            }
            disabled={!isLocationSupported || locationStatus === "loading"}
            className={cn(
              "inline-flex h-11 min-w-11 flex-1 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              locationStatus === "granted"
                ? "border-brand bg-brand/10 text-brand"
                : "border-zinc-200 bg-white text-zinc-700"
            )}
          >
            <MapPin className="h-4 w-4" aria-hidden />
            <span className="truncate">{locationButtonLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            <span>{t("mobile.filters")}</span>
          </button>
        </div>

        <BottomSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title={t("mobile.filters")}
        >
          <MapFiltersForm />
        </BottomSheet>
      </>
    );
  }

  return (
    <div
      className={cn(
        "hidden border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur lg:flex lg:flex-wrap lg:items-center lg:gap-3 lg:px-4",
        className
      )}
    >
      <MapFiltersForm />
    </div>
  );
}
