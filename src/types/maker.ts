export type PrinterType = "fdm" | "resin";

export type MakerStatus = "available" | "busy";

export interface MakerFilament {
  id: string;
  printerType: PrinterType;
  material: string;
  color: string;
}

export interface Maker {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  pricePerGramCzk: number;
  minOrderPriceCzk: number;
  printerTypes: PrinterType[];
  filaments: MakerFilament[];
  status: MakerStatus;
}

export interface MakerProfile extends Maker {
  updatedAt: string;
}

export interface MapFilters {
  maxDistanceKm: number | null;
  minRating: number | null;
  material: string | "all";
  printerType: PrinterType | "all";
}

export interface PinPriceDisplay {
  label: string;
  printCostCzk: number | null;
  weightGrams: number | null;
}

export interface UpdateMakerProfilePayload {
  name: string;
  address: string;
  pricePerGramCzk: number;
  minOrderPriceCzk: number;
  printerTypes: PrinterType[];
  status: MakerStatus;
}

export interface AddFilamentPayload {
  printerType: PrinterType;
  material: string;
  color: string;
}
