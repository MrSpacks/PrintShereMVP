import type { PrinterType } from "@/types/maker";
import {
  CUSTOM_PRINTER_KEY,
  resolvePrinterModelLabel,
} from "@/lib/makers/printer-catalog";

export interface WorkshopPrinterInput {
  technology: string;
  modelKey?: string;
  customModelLabel?: string;
}

export function parseWorkshopPrinters(
  printers: unknown
): WorkshopPrinterInput[] | null {
  if (!Array.isArray(printers) || printers.length === 0) return null;

  const parsed: WorkshopPrinterInput[] = [];

  for (const item of printers) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    if (typeof record.technology !== "string") return null;
    if (record.technology !== "fdm" && record.technology !== "resin") {
      return null;
    }
    parsed.push({
      technology: record.technology,
      modelKey:
        typeof record.modelKey === "string" ? record.modelKey : undefined,
      customModelLabel:
        typeof record.customModelLabel === "string"
          ? record.customModelLabel
          : undefined,
    });
  }

  return parsed;
}

export function validateWorkshopPrinters(printers: WorkshopPrinterInput[]): string | null {
  if (printers.length === 0) {
    return "Add at least one printer";
  }

  const technologies = new Set<PrinterType>();

  for (const printer of printers) {
    try {
      resolvePrinterModelLabel(
        printer.technology as PrinterType,
        printer.modelKey ?? CUSTOM_PRINTER_KEY,
        printer.customModelLabel
      );
      technologies.add(printer.technology as PrinterType);
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid printer";
    }
  }

  if (technologies.size === 0) {
    return "Select printer technology";
  }

  return null;
}

export function buildPrinterCreateRows(
  makerId: string,
  printers: WorkshopPrinterInput[]
) {
  return printers.map((printer) => {
    const resolved = resolvePrinterModelLabel(
      printer.technology as PrinterType,
      printer.modelKey ?? CUSTOM_PRINTER_KEY,
      printer.customModelLabel
    );

    return {
      makerId,
      technology: printer.technology,
      modelKey: resolved.modelKey,
      modelLabel: resolved.modelLabel,
      isCustom: resolved.isCustom,
    };
  });
}
