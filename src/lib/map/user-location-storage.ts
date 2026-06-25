import type { UserLocation } from "@/types/map";

const STORAGE_KEY = "printshere-map-location";
const MAX_AGE_MS = 60 * 60 * 1000;

interface StoredLocation extends UserLocation {
  savedAt: number;
}

export function readStoredUserLocation(): UserLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredLocation;
    if (
      typeof parsed.latitude !== "number" ||
      typeof parsed.longitude !== "number" ||
      typeof parsed.savedAt !== "number"
    ) {
      return null;
    }

    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    };
  } catch {
    return null;
  }
}

export function writeStoredUserLocation(location: UserLocation): void {
  if (typeof window === "undefined") return;

  const payload: StoredLocation = {
    ...location,
    savedAt: Date.now(),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredUserLocation(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
