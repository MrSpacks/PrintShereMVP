import type { PrinterType } from "@/types/maker";

export interface PrinterModelOption {
  key: string;
  label: string;
}

export const PRINTER_MODEL_CATALOG: Record<PrinterType, PrinterModelOption[]> = {
  fdm: [
    { key: "prusa-mk4", label: "Prusa MK4" },
    { key: "prusa-mini", label: "Prusa MINI+" },
    { key: "bambu-x1c", label: "Bambu Lab X1 Carbon" },
    { key: "bambu-p1s", label: "Bambu Lab P1S" },
    { key: "creality-k1", label: "Creality K1" },
    { key: "voron-2.4", label: "Voron 2.4" },
    { key: "generic-fdm", label: "Other FDM printer" },
  ],
  resin: [
    { key: "elegoo-mars-5", label: "Elegoo Mars 5" },
    { key: "anycubic-photon", label: "Anycubic Photon Mono" },
    { key: "formlabs-form-3", label: "Formlabs Form 3" },
    { key: "generic-resin", label: "Other resin printer" },
  ],
};

export const CUSTOM_PRINTER_KEY = "custom";

export function isKnownPrinterModelKey(
  technology: PrinterType,
  modelKey: string
): boolean {
  return PRINTER_MODEL_CATALOG[technology].some((item) => item.key === modelKey);
}

export function resolvePrinterModelLabel(
  technology: PrinterType,
  modelKey: string | null | undefined,
  customLabel?: string
): { modelKey: string | null; modelLabel: string; isCustom: boolean } {
  if (modelKey === CUSTOM_PRINTER_KEY) {
    const label = customLabel?.trim() ?? "";
    if (label.length < 2) {
      throw new Error("Enter your printer model name");
    }
    return { modelKey: CUSTOM_PRINTER_KEY, modelLabel: label, isCustom: true };
  }

  if (modelKey && isKnownPrinterModelKey(technology, modelKey)) {
    const option = PRINTER_MODEL_CATALOG[technology].find(
      (item) => item.key === modelKey
    )!;
    const isGeneric = modelKey.startsWith("generic-");
    if (isGeneric && customLabel?.trim()) {
      return {
        modelKey,
        modelLabel: customLabel.trim(),
        isCustom: true,
      };
    }
    return { modelKey, modelLabel: option.label, isCustom: isGeneric };
  }

  throw new Error("Select a printer model");
}

export function derivePrinterTypes(
  printers: { technology: string }[]
): PrinterType[] {
  const types = new Set<PrinterType>();
  for (const printer of printers) {
    if (printer.technology === "fdm" || printer.technology === "resin") {
      types.add(printer.technology);
    }
  }
  return [...types];
}
