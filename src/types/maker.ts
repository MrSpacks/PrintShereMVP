export type PrinterType = "fdm" | "resin";

export type MakerStatus = "available" | "busy" | "hidden";

export interface MakerPrinter {
  id: string;
  technology: PrinterType;
  modelKey: string | null;
  modelLabel: string;
  isCustom: boolean;
}

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
  printers: MakerPrinter[];
  filaments: MakerFilament[];
  status: MakerStatus;
}

export interface MakerProfile extends Maker {
  updatedAt: string;
}

export interface MakerWorkshopSummary {
  id: string;
  name: string;
  status: MakerStatus;
  isActive: boolean;
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

export interface WorkshopPrinterInput {
  technology: PrinterType;
  modelKey: string;
  customModelLabel?: string;
}

export interface CreateWorkshopPayload {
  workshopName: string;
  address: string;
  printers: WorkshopPrinterInput[];
}

export interface AddFilamentPayload {
  printerType: PrinterType;
  material: string;
  color: string;
}
