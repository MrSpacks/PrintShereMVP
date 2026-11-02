"use client";

import { createSharedPoll } from "@/lib/polling/create-shared-poll";

const usePendingCountPoll = createSharedPoll<number>({
  url: "/api/orders/pending-count",
  intervalMs: 30000,
  empty: 0,
  parse: (json) => (json as { count?: number }).count ?? 0,
});

export function usePendingOrdersCount(enabled: boolean) {
  const { data: count, refetch } = usePendingCountPoll(enabled);
  return { count, refetch };
}
