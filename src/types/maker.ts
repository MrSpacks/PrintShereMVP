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
  reviewsCount?: number;
  pricePerGramFdmCzk: number;
  pricePerGramResinCzk: number;
  minOrderPriceCzk: number;
  /** Maker offers shipping at a fixed price they set */
  offersDelivery: boolean;
  /** Fixed shipping price in CZK (used when offersDelivery) */
  deliveryPriceCzk: number;
  printerTypes: PrinterType[];
  printers: MakerPrinter[];
  filaments: MakerFilament[];
  status: MakerStatus;
  /** IČO — without it, annual occasional-income limit applies */
  companyId: string | null;
}

export interface MakerProfile extends Maker {
  updatedAt: string;
  /** YTD print income counting toward occasional-income limit (null if IČO set) */
  yearToDatePrintIncomeCzk?: number;
  occasionalIncomeLimitCzk?: number;
  occasionalIncomeRemainingCzk?: number | null;
}

export interface MakerWorkshopSummary {
  id: string;
  name: string;
  address: string;
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
  pricePerGramFdmCzk: number;
  pricePerGramResinCzk: number;
  minOrderPriceCzk: number;
  offersDelivery: boolean;
  deliveryPriceCzk: number;
  printerTypes: PrinterType[];
  status: MakerStatus;
  /** Empty string or omit to clear; 8 digits to set */
  companyId?: string | null;
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
