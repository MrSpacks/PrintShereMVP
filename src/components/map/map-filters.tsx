"use client";

import { useMapStore } from "@/store/map-store";
import {
  FDM_MATERIAL_OPTIONS,
  PRINTER_TYPES,
  RESIN_MATERIAL_OPTIONS,
} from "@/lib/makers/capabilities";
import type { PrinterType } from "@/types/maker";
import { cn } from "@/lib/utils";

const DISTANCE_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "Any", value: null },
  { label: "2 km", value: 2 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
];

const RATING_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "Any", value: null },
  { label: "4.0+", value: 4.0 },
  { label: "4.5+", value: 4.5 },
];

const MATERIAL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All materials", value: "all" },
  ...FDM_MATERIAL_OPTIONS.map((material) => ({
    label: material,
    value: material,
  })),
  ...RESIN_MATERIAL_OPTIONS.map((material) => ({
    label: material,
    value: material,
  })),
];

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
      <span className="shrink-0">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
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

interface MapFiltersBarProps {
  className?: string;
}

export function MapFiltersBar({ className }: MapFiltersBarProps) {
  const filters = useMapStore((state) => state.filters);
  const setMaxDistanceKm = useMapStore((state) => state.setMaxDistanceKm);
  const setMinRating = useMapStore((state) => state.setMinRating);
  const setMaterial = useMapStore((state) => state.setMaterial);
  const setPrinterType = useMapStore((state) => state.setPrinterType);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur sm:gap-4 sm:px-4",
        className
      )}
    >
      <FilterSelect
        label="Distance"
        value={filters.maxDistanceKm?.toString() ?? "any"}
        onChange={(value) =>
          setMaxDistanceKm(value === "any" ? null : Number(value))
        }
        options={DISTANCE_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value?.toString() ?? "any",
        }))}
      />

      <FilterSelect
        label="Rating"
        value={filters.minRating?.toString() ?? "any"}
        onChange={(value) =>
          setMinRating(value === "any" ? null : Number(value))
        }
        options={RATING_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value?.toString() ?? "any",
        }))}
      />

      <FilterSelect
        label="Printer"
        value={filters.printerType}
        onChange={(value) => setPrinterType(value as PrinterType | "all")}
        options={[
          { label: "All types", value: "all" },
          ...PRINTER_TYPES.map((type) => ({
            label: type.label,
            value: type.id,
          })),
        ]}
      />

      <FilterSelect
        label="Materials"
        value={filters.material}
        onChange={setMaterial}
        options={MATERIAL_OPTIONS}
      />
    </div>
  );
}
