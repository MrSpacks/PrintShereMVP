"use client";

import { useCallback, useEffect, useState } from "react";

import type { OrderResponse } from "@/types/order";
import type { OrdersListView } from "@/types/user";

interface OrdersApiResponse {
  orders: OrderResponse[];
  view: OrdersListView;
}

interface UseOrdersResult {
  orders: OrderResponse[];
  view: OrdersListView | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrders(
  enabled: boolean,
  listView: OrdersListView = "customer"
): UseOrdersResult {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [view, setView] = useState<OrdersListView | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOrders() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders?view=${listView}`);

        if (response.status === 401) {
          throw new Error("Please log in to view orders");
        }

        if (!response.ok) {
          throw new Error("Failed to load orders");
        }

        const data = (await response.json()) as OrdersApiResponse;

        if (!cancelled) {
          setOrders(data.orders);
          setView(data.view);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Failed to load orders";
          setError(message);
          setOrders([]);
          setView(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [enabled, listView, tick]);

  return { orders, view, isLoading, error, refetch };
}
