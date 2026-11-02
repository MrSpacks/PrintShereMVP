"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

interface SharedPollOptions<T> {
  url: string;
  intervalMs: number;
  empty: T;
  parse: (json: unknown) => T;
}

/**
 * One polling loop per endpoint, shared by every component that uses the hook.
 * The inbox and pending-orders counters are rendered in several places at once
 * (desktop + mobile header, notification watcher); separate loops multiplied
 * requests on every navigation.
 */
export function createSharedPoll<T>({ url, intervalMs, empty, parse }: SharedPollOptions<T>) {
  let snapshot: T = empty;
  let subscribers = 0;
  let inFlight: Promise<void> | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  const emit = (next: T) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  // Concurrent callers share the request already in flight
  const load = () => {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const response = await fetch(url);
        if (response.ok && subscribers > 0) {
          emit(parse(await response.json()));
        }
      } catch {
        if (subscribers > 0) emit(empty);
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") void load();
  };

  const start = () => {
    subscribers += 1;
    if (subscribers > 1) return;
    void load();
    interval = setInterval(() => void load(), intervalMs);
    document.addEventListener("visibilitychange", onVisible);
  };

  const stop = () => {
    subscribers -= 1;
    if (subscribers > 0) return;
    if (interval) clearInterval(interval);
    interval = null;
    document.removeEventListener("visibilitychange", onVisible);
    emit(empty);
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = () => snapshot;
  const getServerSnapshot = () => empty;

  return function useSharedPoll(enabled: boolean) {
    const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
      if (!enabled) return;
      start();
      return stop;
    }, [enabled]);

    const refetch = useCallback(() => {
      if (enabled) void load();
    }, [enabled]);

    return { data: enabled ? data : empty, refetch };
  };
}
