"use client";

import { isAdsEnabled } from "@/lib/product/product-mode";
import { cn } from "@/lib/utils";

export type AdSlotId = "home_sidebar" | "orders_list" | "map_footer";

interface AdSlotProps {
  id: AdSlotId;
  className?: string;
}

/**
 * Заглушка рекламных слотов. При ADS_ENABLED покажет контент позже.
 */
export function AdSlot({ id, className }: AdSlotProps) {
  if (!isAdsEnabled()) return null;

  return (
    <aside
      data-ad-slot={id}
      className={cn(
        "rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground",
        className
      )}
    >
      Ad slot: {id}
    </aside>
  );
}
