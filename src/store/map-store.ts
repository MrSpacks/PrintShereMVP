import { create } from "zustand";

import type { MapFilters, PrinterType } from "@/types/maker";
import type { UserLocation, UserLocationStatus } from "@/types/map";

interface MapStore {
  filters: MapFilters;
  userLocation: UserLocation | null;
  locationStatus: UserLocationStatus;
  locationError: string | null;

  setMaxDistanceKm: (km: number | null) => void;
  setMinRating: (rating: number | null) => void;
  setMaterial: (material: string | "all") => void;
  setPrinterType: (printerType: PrinterType | "all") => void;
  setUserLocation: (location: UserLocation | null) => void;
  setLocationStatus: (status: UserLocationStatus) => void;
  setLocationError: (error: string | null) => void;
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
  userLocation: null,
  locationStatus: "idle",
  locationError: null,

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

  setUserLocation: (userLocation) => set({ userLocation }),

  setLocationStatus: (locationStatus) => set({ locationStatus }),

  setLocationError: (locationError) => set({ locationError }),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
