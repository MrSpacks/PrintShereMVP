"use client";

import { useCallback, useEffect, useState } from "react";

export function usePendingOrdersCount(enabled: boolean) {
  const [count, setCount] = useState(0);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    let cancelled = false;

    async function loadCount() {
      try {
        const response = await fetch("/api/orders/pending-count");
        if (!response.ok) return;

        const data = (await response.json()) as { count?: number };
        if (!cancelled) {
          setCount(data.count ?? 0);
        }
      } catch {
        if (!cancelled) setCount(0);
      }
    }

    void loadCount();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadCount();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, tick]);

  return { count, refetch };
}
