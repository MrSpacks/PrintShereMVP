"use client";

import { useEffect, useState } from "react";

import type { Maker } from "@/types/maker";

interface UseMakersResult {
  makers: Maker[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Загружает список мейкеров из Neon через /api/makers.
 */
export function useMakers(): UseMakersResult {
  const [makers, setMakers] = useState<Maker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMakers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/makers");

        if (!response.ok) {
          throw new Error("Failed to load makers");
        }

        const data = (await response.json()) as Maker[];

        if (!cancelled) {
          setMakers(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Failed to load makers";
          setError(message);
          setMakers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadMakers();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    makers,
    isLoading,
    error,
    refetch: () => setTick((value) => value + 1),
  };
}
