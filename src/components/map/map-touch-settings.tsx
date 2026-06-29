"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

function MapTouchSettings() {
  const map = useMap();

  useEffect(() => {
    const isTouch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      map.scrollWheelZoom.disable();
    }
  }, [map]);

  return null;
}

export { MapTouchSettings };
