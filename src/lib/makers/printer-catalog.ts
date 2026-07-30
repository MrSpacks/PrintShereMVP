import type { PrinterType } from "@/types/maker";

export interface PrinterModelOption {
  key: string;
  label: string;
}

export const PRINTER_MODEL_CATALOG: Record<PrinterType, PrinterModelOption[]> = {
  fdm: [
    // Prusa Research
    { key: "prusa-mk4", label: "Prusa MK4" },
    { key: "prusa-mk3s", label: "Prusa i3 MK3S+" },
    { key: "prusa-mini", label: "Prusa MINI+" },
    { key: "prusa-xl", label: "Prusa XL" },
    
    // Bambu Lab
    { key: "bambu-x1c", label: "Bambu Lab X1 Carbon" },
    { key: "bambu-x1", label: "Bambu Lab X1" },
    { key: "bambu-p1s", label: "Bambu Lab P1S" },
    { key: "bambu-p1p", label: "Bambu Lab P1P" },
    { key: "bambu-a1", label: "Bambu Lab A1" },
    { key: "bambu-a1-mini", label: "Bambu Lab A1 Mini" },
    
    // Creality
    { key: "creality-k1", label: "Creality K1" },
    { key: "creality-k1-max", label: "Creality K1 Max" },
    { key: "creality-k2-plus", label: "Creality K2 Plus" },
    { key: "ender-3-v3", label: "Creality Ender-3 V3" },
    { key: "ender-3-s1", label: "Creality Ender-3 S1" },
    { key: "ender-5-s1", label: "Creality Ender-5 S1" },
    { key: "cr-10-smart", label: "Creality CR-10 Smart" },
    
    // Anycubic
    { key: "anycubic-kobra-2", label: "Anycubic Kobra 2" },
    { key: "anycubic-kobra-plus", label: "Anycubic Kobra Plus" },
    { key: "anycubic-vyper", label: "Anycubic Vyper" },
    
    // Voron (DIY)
    { key: "voron-2.4", label: "Voron 2.4" },
    { key: "voron-trident", label: "Voron Trident" },
    { key: "voron-0.2", label: "Voron 0.2" },
    
    // Ultimaker
    { key: "ultimaker-s5", label: "Ultimaker S5" },
    { key: "ultimaker-s3", label: "Ultimaker S3" },
    { key: "ultimaker-2-plus", label: "Ultimaker 2+" },
    
    // FlashForge
    { key: "flashforge-adventurer-5m", label: "FlashForge Adventurer 5M" },
    { key: "flashforge-creator-pro-2", label: "FlashForge Creator Pro 2" },
    
    // Artillery
    { key: "artillery-sidewinder-x2", label: "Artillery Sidewinder X2" },
    { key: "artillery-genius-pro", label: "Artillery Genius Pro" },
    
    // Elegoo (FDM)
    { key: "elegoo-neptune-4", label: "Elegoo Neptune 4" },
    { key: "elegoo-neptune-3", label: "Elegoo Neptune 3" },
    
    // Raise3D
    { key: "raise3d-e2", label: "Raise3D E2" },
    { key: "raise3d-pro3", label: "Raise3D Pro3" },
    
    // Sovol
    { key: "sovol-sv06", label: "Sovol SV06" },
    { key: "sovol-sv07", label: "Sovol SV07" },
    
    // QIDI Tech
    { key: "qidi-x-max-3", label: "QIDI X-Max 3" },
    { key: "qidi-plus-4", label: "QIDI Plus 4" },
    
    { key: "generic-fdm", label: "Other FDM printer" },
  ],
  resin: [
    // Elegoo
    { key: "elegoo-mars-5", label: "Elegoo Mars 5" },
    { key: "elegoo-mars-4", label: "Elegoo Mars 4" },
    { key: "elegoo-saturn-3", label: "Elegoo Saturn 3" },
    { key: "elegoo-saturn-4", label: "Elegoo Saturn 4 Ultra" },
    { key: "elegoo-jupiter", label: "Elegoo Jupiter" },
    
    // Anycubic
    { key: "anycubic-photon-mono-2", label: "Anycubic Photon Mono 2" },
    { key: "anycubic-photon-m3", label: "Anycubic Photon M3" },
    { key: "anycubic-photon-ultra", label: "Anycubic Photon Ultra (DLP)" },
    
    // Phrozen
    { key: "phrozen-sonic-mighty-8k", label: "Phrozen Sonic Mighty 8K" },
    { key: "phrozen-sonic-mini-8k", label: "Phrozen Sonic Mini 8K" },
    { key: "phrozen-sonic-mega-8k", label: "Phrozen Sonic Mega 8K" },
    
    // Formlabs
    { key: "formlabs-form-3", label: "Formlabs Form 3" },
    { key: "formlabs-form-3l", label: "Formlabs Form 3L" },
    { key: "formlabs-form-4", label: "Formlabs Form 4" },
    
    // Creality (Resin)
    { key: "creality-halot-mage-pro", label: "Creality HALOT-MAGE Pro" },
    { key: "creality-halot-one", label: "Creality HALOT-ONE" },
    
    // Longer
    { key: "longer-orange-4k", label: "Longer Orange 4K" },
    
    // Peopoly
    { key: "peopoly-phenom", label: "Peopoly Phenom" },
    
    // Nova3D
    { key: "nova3d-whale-3", label: "Nova3D Whale 3" },
    
    // Uniformation
    { key: "uniformation-gktwo", label: "Uniformation GKtwo" },
    
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
