"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { useTranslations } from "@/i18n/locale-provider";
import {
  PRINT_TECH_COMPARISON_CREDIT,
  PRINT_TECH_COMPARISON_IMAGE,
} from "@/lib/model/print-technology-media";
import { useModelStore } from "@/store/model-store";
import { useMapStore } from "@/store/map-store";
import type { PrinterType } from "@/types/maker";
import { cn } from "@/lib/utils";

const TECH_OPTIONS: PrinterType[] = ["fdm", "resin"];

interface TechPopoverProps {
  technology: PrinterType;
  open: boolean;
}

function TechPopover({ technology, open }: TechPopoverProps) {
  const { t } = useTranslations();
  const isFdm = technology === "fdm";

  if (!open) return null;

  return (
    <div
      role="tooltip"
      className="absolute left-1/2 z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-zinc-600 bg-zinc-800 p-3 shadow-xl sm:bottom-full sm:mb-2 sm:mt-0 top-full sm:top-auto"
    >
      <div className="relative overflow-hidden rounded-md">
        <Image
          src={PRINT_TECH_COMPARISON_IMAGE}
          alt={t("model.printTech.comparisonAlt")}
          width={288}
          height={160}
          className="h-auto w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 flex bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6 text-[10px] text-zinc-200">
          <span
            className={cn(
              "flex-1 text-left",
              !isFdm && "font-semibold text-brand"
            )}
          >
            {t("model.printTech.resinSide")}
          </span>
          <span
            className={cn(
              "flex-1 text-right",
              isFdm && "font-semibold text-brand"
            )}
          >
            {t("model.printTech.fdmSide")}
          </span>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <p
          className={cn(
            "text-xs font-semibold",
            isFdm ? "text-emerald-400" : "text-amber-400"
          )}
        >
          {isFdm ? t("model.printTech.fdmPrice") : t("model.printTech.resinPrice")}
        </p>
        <p className="text-xs leading-relaxed text-zinc-300">
          {isFdm ? t("model.printTech.fdmQuality") : t("model.printTech.resinQuality")}
        </p>
        <p className="text-[10px] text-zinc-500">
          {t("model.printTech.comparisonCaption")}
        </p>
        <a
          href={PRINT_TECH_COMPARISON_CREDIT.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-zinc-500 underline-offset-2 hover:text-zinc-400 hover:underline"
        >
          {t("model.printTech.photoCredit", {
            source: PRINT_TECH_COMPARISON_CREDIT.label,
          })}
        </a>
      </div>
    </div>
  );
}

interface TechOptionProps {
  technology: PrinterType;
  selected: boolean;
  onSelect: (technology: PrinterType) => void;
}

function TechOption({ technology, selected, onSelect }: TechOptionProps) {
  const { t } = useTranslations();
  const [hintOpen, setHintOpen] = useState(false);

  const label =
    technology === "fdm" ? t("printer.plastic") : t("printer.resinShort");

  return (
    <div
      className="relative flex-1"
      onMouseEnter={() => setHintOpen(true)}
      onMouseLeave={() => setHintOpen(false)}
    >
      <TechPopover technology={technology} open={hintOpen} />
      <button
        type="button"
        onClick={() => {
          onSelect(technology);
          setHintOpen(true);
        }}
        onBlur={() => setHintOpen(false)}
        aria-pressed={selected}
        className={cn(
          "flex min-h-10 w-full items-center justify-center rounded-md px-2 text-xs font-medium transition-colors sm:text-sm",
          selected
            ? "bg-brand text-brand-foreground shadow-sm"
            : "text-zinc-300 hover:bg-zinc-700/80 hover:text-zinc-100"
        )}
      >
        {label}
      </button>
    </div>
  );
}

export function PrintTechnologySwitcher() {
  const { t } = useTranslations();
  const model = useModelStore((state) => state.model);
  const setSelectedMaker = useModelStore((state) => state.setSelectedMaker);
  const printerType = useMapStore((state) => state.filters.printerType);
  const setPrinterType = useMapStore((state) => state.setPrinterType);
  const setMaterial = useMapStore((state) => state.setMaterial);

  const selected: PrinterType = printerType === "resin" ? "resin" : "fdm";

  const handleSelect = useCallback(
    (technology: PrinterType) => {
      setPrinterType(technology);
      setMaterial("all");
      setSelectedMaker(null);
    },
    [setMaterial, setPrinterType, setSelectedMaker]
  );

  useEffect(() => {
    if (model && printerType === "all") {
      setPrinterType("fdm");
    }
  }, [model, printerType, setPrinterType]);

  if (!model) return null;

  return (
    <div className="border-t border-zinc-700/80 bg-zinc-900 px-4 py-3">
      <p className="mb-2 text-xs font-medium text-zinc-400">
        {t("model.printTech.title")}
      </p>
      <div
        className="flex gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 p-1"
        role="group"
        aria-label={t("model.printTech.title")}
      >
        {TECH_OPTIONS.map((technology) => (
          <TechOption
            key={technology}
            technology={technology}
            selected={selected === technology}
            onSelect={handleSelect}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-zinc-500">{t("model.printTech.hint")}</p>
    </div>
  );
}
