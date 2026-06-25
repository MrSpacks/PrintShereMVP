"use client";

import { useCallback, useEffect } from "react";

import {
  clearStoredUserLocation,
  readStoredUserLocation,
  writeStoredUserLocation,
} from "@/lib/map/user-location-storage";
import { useMapStore } from "@/store/map-store";
import type { UserLocation } from "@/types/map";

function toLocationErrorMessage(code: number): string {
  if (code === 1) return "denied";
  if (code === 2) return "unavailable";
  if (code === 3) return "timeout";
  return "unknown";
}

export function useUserLocation() {
  const userLocation = useMapStore((state) => state.userLocation);
  const locationStatus = useMapStore((state) => state.locationStatus);
  const locationError = useMapStore((state) => state.locationError);
  const setUserLocation = useMapStore((state) => state.setUserLocation);
  const setLocationStatus = useMapStore((state) => state.setLocationStatus);
  const setLocationError = useMapStore((state) => state.setLocationError);

  useEffect(() => {
    const stored = readStoredUserLocation();
    if (!stored) return;

    setUserLocation(stored);
    setLocationStatus("granted");
    setLocationError(null);
  }, [setLocationError, setLocationStatus, setUserLocation]);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("unsupported");
      return;
    }

    setLocationStatus("loading");
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        writeStoredUserLocation(location);
        setUserLocation(location);
        setLocationStatus("granted");
        setLocationError(null);
      },
      (error) => {
        clearStoredUserLocation();
        setUserLocation(null);
        setLocationStatus(error.code === 1 ? "denied" : "error");
        setLocationError(toLocationErrorMessage(error.code));
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 60_000,
      }
    );
  }, [
    setLocationError,
    setLocationStatus,
    setUserLocation,
  ]);

  const clearLocation = useCallback(() => {
    clearStoredUserLocation();
    setUserLocation(null);
    setLocationStatus("idle");
    setLocationError(null);
  }, [setLocationError, setLocationStatus, setUserLocation]);

  return {
    userLocation,
    locationStatus,
    locationError,
    requestLocation,
    clearLocation,
    isLocationSupported:
      typeof window !== "undefined" && Boolean(navigator.geolocation),
  };
}
