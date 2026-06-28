"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-provider";
import {
  CUSTOM_PRINTER_KEY,
  PRINTER_MODEL_CATALOG,
} from "@/lib/makers/printer-catalog";
import type { PrinterType, WorkshopPrinterInput } from "@/types/maker";

interface PrinterPickerProps {
  printers: WorkshopPrinterInput[];
  onChange: (printers: WorkshopPrinterInput[]) => void;
}

function emptyPrinter(): WorkshopPrinterInput {
  return {
    technology: "fdm",
    modelKey: PRINTER_MODEL_CATALOG.fdm[0]?.key ?? CUSTOM_PRINTER_KEY,
  };
}

export function PrinterPicker({ printers, onChange }: PrinterPickerProps) {
  const { t } = useTranslations();
  const rows = printers.length > 0 ? printers : [emptyPrinter()];
  const [customLabels, setCustomLabels] = useState<Record<number, string>>({});

  const updateRow = (index: number, patch: Partial<WorkshopPrinterInput>) => {
    const next = rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row
    );
    onChange(next);
  };

  const addRow = () => {
    onChange([...rows, emptyPrinter()]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const catalog = PRINTER_MODEL_CATALOG[row.technology];
        const isCustom =
          row.modelKey === CUSTOM_PRINTER_KEY ||
          row.modelKey?.startsWith("generic-");

        return (
          <div
            key={index}
            className="rounded-lg border border-border bg-muted/20 p-3 space-y-3"
          >
            <div className="flex flex-wrap gap-2">
              {(["fdm", "resin"] as PrinterType[]).map((technology) => (
                <button
                  key={technology}
                  type="button"
                  onClick={() =>
                    updateRow(index, {
                      technology,
                      modelKey: PRINTER_MODEL_CATALOG[technology][0]?.key,
                      customModelLabel: undefined,
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    row.technology === technology
                      ? "border-brand bg-brand text-white"
                      : "border-input bg-background"
                  }`}
                >
                  {t(`printer.${technology}`)}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("workshop.printerModel")}
                </label>
                <select
                  value={row.modelKey ?? ""}
                  onChange={(event) =>
                    updateRow(index, {
                      modelKey: event.target.value,
                      customModelLabel: undefined,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {catalog.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                  <option value={CUSTOM_PRINTER_KEY}>
                    {t("workshop.customPrinter")}
                  </option>
                </select>
              </div>

              {rows.length > 1 && (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {(row.modelKey === CUSTOM_PRINTER_KEY || isCustom) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("workshop.customPrinterLabel")}
                </label>
                <input
                  value={row.customModelLabel ?? customLabels[index] ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCustomLabels((current) => ({ ...current, [index]: value }));
                    updateRow(index, { customModelLabel: value });
                  }}
                  placeholder={t("workshop.customPrinterPlaceholder")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
        <Plus className="h-4 w-4" />
        {t("workshop.addPrinter")}
      </Button>
    </div>
  );
}

export function usePrinterPickerState(initial: WorkshopPrinterInput[] = []) {
  return useMemo(() => initial, [initial]);
}
