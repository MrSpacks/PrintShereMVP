import { PRINTER_TYPES, FDM_MATERIAL_OPTIONS, RESIN_MATERIAL_OPTIONS } from "@/lib/makers/capabilities";
import type { PrinterType } from "@/types/maker";

export function getMaterialOptions(printerType: PrinterType): readonly string[] {
  return printerType === "fdm" ? FDM_MATERIAL_OPTIONS : RESIN_MATERIAL_OPTIONS;
}

export function getColorOptions(
  printerType: PrinterType,
  material: string
): readonly string[] {
  void material;
  return printerType === "fdm"
    ? ["Black", "White", "Gray", "Red", "Blue", "Green", "Yellow", "Orange", "Transparent"]
    : ["Black", "White", "Gray", "Clear", "Red", "Blue"];
}

export { PRINTER_TYPES };
