"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapInvalidatorProps {
  active?: boolean;
}

/** Leaflet needs invalidateSize when the container was hidden or flex-sized. */
export function MapInvalidator({ active = true }: MapInvalidatorProps) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    const invalidate = () => {
      map.invalidateSize();
    };

    const frame = requestAnimationFrame(invalidate);
    const timeout = window.setTimeout(invalidate, 100);
    const timeout2 = window.setTimeout(invalidate, 400);

    window.addEventListener("resize", invalidate);

    const container = map.getContainer();
    const observed = container.parentElement ?? container;
    const observer = new ResizeObserver(invalidate);
    observer.observe(observed);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.clearTimeout(timeout2);
      window.removeEventListener("resize", invalidate);
      observer.disconnect();
    };
  }, [map, active]);

  return null;
}
