import type { PrinterType } from "@/types/maker";

import {
  getFilamentColorIds,
  isValidFilamentColor,
} from "@/lib/makers/filament-colors";
import { PRINTER_TYPES, FDM_MATERIAL_OPTIONS, RESIN_MATERIAL_OPTIONS } from "@/lib/makers/capabilities";

export function getMaterialOptions(printerType: PrinterType): readonly string[] {
  return printerType === "fdm" ? FDM_MATERIAL_OPTIONS : RESIN_MATERIAL_OPTIONS;
}

export function getColorOptions(
  printerType: PrinterType,
  material: string
): readonly string[] {
  void material;
  return getFilamentColorIds(printerType);
}

export { isValidFilamentColor, PRINTER_TYPES };
