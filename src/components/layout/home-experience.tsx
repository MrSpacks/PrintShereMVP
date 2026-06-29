"use client";

import { useState } from "react";

import { SplitScreenLayout } from "@/components/layout/split-screen-layout";
import { MapPanel } from "@/components/map/map-panel";
import { ModelPanel } from "@/components/model/model-panel";
import { MobileStickyPriceBar } from "@/components/model/mobile-sticky-price-bar";
import { Button } from "@/components/ui/button";
import { useIsLg } from "@/hooks/use-is-lg";
import { useTranslations } from "@/i18n/locale-provider";
import { useModelStore } from "@/store/model-store";
import { cn } from "@/lib/utils";

type MobileStep = "model" | "map";

export function HomeExperience() {
  const isLg = useIsLg();
  const { t } = useTranslations();
  const model = useModelStore((state) => state.model);
  const [mobileStep, setMobileStep] = useState<MobileStep>("model");

  if (isLg) {
    return (
      <SplitScreenLayout
        leftPanel={<ModelPanel />}
        rightPanel={<MapPanel />}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 py-2">
        {(["model", "map"] as const).map((step) => {
          const isActive = mobileStep === step;
          const label =
            step === "model" ? t("mobile.stepModel") : t("mobile.stepMap");

          return (
            <button
              key={step}
              type="button"
              onClick={() => setMobileStep(step)}
              className={cn(
                "flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {mobileStep === "model" ? (
          <div className="absolute inset-0 flex min-h-0 flex-col">
            <ModelPanel className="min-h-0 flex-1" hidePriceFooter />
            <div className="shrink-0 border-t border-border bg-background p-3">
              <Button
                type="button"
                variant="brand"
                className="h-11 w-full"
                disabled={!model}
                onClick={() => setMobileStep("map")}
              >
                {model
                  ? t("mobile.continueToMap")
                  : t("mobile.uploadModelFirst")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden">
            <MapPanel
              mobileMode
              mapActive
              className="min-h-0 flex-1 overflow-hidden"
            />
            <MobileStickyPriceBar onBackToModel={() => setMobileStep("model")} />
          </div>
        )}
      </div>
    </div>
  );
}
