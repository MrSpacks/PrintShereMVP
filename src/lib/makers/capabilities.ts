/** Типы принтеров мейкера */
export const PRINTER_TYPES = [
  { id: "fdm", label: "Plastic (FDM)" },
  { id: "resin", label: "Resin (SLA/DLP)" },
] as const;

export type PrinterTypeId = (typeof PRINTER_TYPES)[number]["id"];

export const FDM_MATERIAL_OPTIONS = [
  "PLA",
  "PETG",
  "ABS",
  "TPU",
  "NYLON",
  "ASA",
] as const;

export const RESIN_MATERIAL_OPTIONS = [
  "Standard Resin",
  "Tough Resin",
  "Flexible Resin",
  "Water-Washable",
] as const;

export const DEFAULT_NEW_MAKER_RATING = 5;
