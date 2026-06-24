import { create } from "zustand";

import type { ModelData } from "@/types/model";

import type { DeliveryMethod } from "@/types/delivery";

interface SelectedMakerPrice {
  makerId: string;
  makerName: string;
  printCostCzk: number;
  deliveryMethod: DeliveryMethod | null;
  deliveryPriceCzk: number;
}

interface ModelStore {
  model: ModelData | null;
  isParsing: boolean;
  parseError: string | null;
  selectedMaker: SelectedMakerPrice | null;

  setModel: (model: ModelData) => void;
  setParsing: (isParsing: boolean) => void;
  setParseError: (error: string | null) => void;
  clearModel: () => void;
  setSelectedMaker: (maker: SelectedMakerPrice | null) => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  model: null,
  isParsing: false,
  parseError: null,
  selectedMaker: null,

  setModel: (model) => {
    const previous = get().model;
    if (previous?.objectUrl) {
      URL.revokeObjectURL(previous.objectUrl);
    }
    set({ model, parseError: null, selectedMaker: null });
  },

  setParsing: (isParsing) => set({ isParsing }),

  setParseError: (parseError) => set({ parseError }),

  clearModel: () => {
    const previous = get().model;
    if (previous?.objectUrl) {
      URL.revokeObjectURL(previous.objectUrl);
    }
    set({ model: null, parseError: null, selectedMaker: null });
  },

  setSelectedMaker: (selectedMaker) => set({ selectedMaker }),
}));
