import type { DeliveryMethod } from "@/types/delivery";

const STORAGE_KEY = "printshere_pending_order_checkout";
const MAX_AGE_MS = 60 * 60 * 1000;

export interface PendingOrderCheckout {
  makerId: string;
  deliveryMethod: DeliveryMethod;
  deliveryPriceCzk: number;
  zasilkovnaPointId?: string;
  zasilkovnaPointLabel?: string;
  savedAt: number;
}

export function savePendingOrderCheckout(
  checkout: Omit<PendingOrderCheckout, "savedAt">
): void {
  if (typeof window === "undefined") return;

  const payload: PendingOrderCheckout = {
    ...checkout,
    savedAt: Date.now(),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadPendingOrderCheckout(): PendingOrderCheckout | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingOrderCheckout;
    if (
      !parsed.makerId ||
      !parsed.deliveryMethod ||
      typeof parsed.deliveryPriceCzk !== "number" ||
      typeof parsed.savedAt !== "number"
    ) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearPendingOrderCheckout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
