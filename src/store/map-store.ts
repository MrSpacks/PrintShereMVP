import { create } from "zustand";

import type { MapFilters, PrinterType } from "@/types/maker";

interface MapStore {
  filters: MapFilters;

  setMaxDistanceKm: (km: number | null) => void;
  setMinRating: (rating: number | null) => void;
  setMaterial: (material: string | "all") => void;
  setPrinterType: (printerType: PrinterType | "all") => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: MapFilters = {
  maxDistanceKm: null,
  minRating: null,
  material: "all",
  printerType: "all",
};

export const useMapStore = create<MapStore>((set) => ({
  filters: DEFAULT_FILTERS,

  setMaxDistanceKm: (maxDistanceKm) =>
    set((state) => ({
      filters: { ...state.filters, maxDistanceKm },
    })),

  setMinRating: (minRating) =>
    set((state) => ({
      filters: { ...state.filters, minRating },
    })),

  setMaterial: (material) =>
    set((state) => ({
      filters: { ...state.filters, material },
    })),

  setPrinterType: (printerType) =>
    set((state) => ({
      filters: { ...state.filters, printerType },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
