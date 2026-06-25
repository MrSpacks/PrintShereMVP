"use client";

import { useCallback, useEffect, useState } from "react";

import type { InboxResponse } from "@/types/inbox";

export function useMessageInbox(enabled: boolean) {
  const [data, setData] = useState<InboxResponse>({ items: [], totalUnread: 0 });
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setData({ items: [], totalUnread: 0 });
      return;
    }

    let cancelled = false;

    async function loadInbox() {
      try {
        const response = await fetch("/api/messages/inbox");
        if (!response.ok) return;

        const inbox = (await response.json()) as InboxResponse;
        if (!cancelled) {
          setData(inbox);
        }
      } catch {
        if (!cancelled) {
          setData({ items: [], totalUnread: 0 });
        }
      }
    }

    void loadInbox();

    const interval = setInterval(() => {
      void loadInbox();
    }, 30000);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadInbox();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, tick]);

  return { ...data, refetch };
}
