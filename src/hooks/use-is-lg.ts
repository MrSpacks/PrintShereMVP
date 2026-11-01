"use client";

import { useSyncExternalStore } from "react";

const LG_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(LG_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(LG_QUERY).matches;
// Server assumes desktop; React re-renders with the real value after hydration
const getServerSnapshot = () => true;

/** Matches Tailwind `lg` breakpoint (1024px). */
export function useIsLg(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
