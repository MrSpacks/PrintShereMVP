import { PRAGUE_CENTER } from "@/data/makers";
import { getDistanceKm } from "@/lib/map/geo";
import type { Maker, MapFilters } from "@/types/maker";
import type { MapOrigin } from "@/types/map";

function resolveOrigin(origin?: MapOrigin | null): MapOrigin {
  return origin ?? PRAGUE_CENTER;
}

/**
 * Применяет фильтры карты к списку мейкеров.
 */
export function filterMakers(
  makers: Maker[],
  filters: MapFilters,
  origin?: MapOrigin | null
): Maker[] {
  const distanceOrigin = resolveOrigin(origin);

  return makers.filter((maker) => {
    if (filters.minRating !== null && maker.rating < filters.minRating) {
      return false;
    }

    if (filters.printerType !== "all") {
      if (!maker.printerTypes.includes(filters.printerType)) {
        return false;
      }
    }

    if (filters.material !== "all") {
      const hasMaterial = maker.filaments.some(
        (filament) => filament.material === filters.material
      );
      if (!hasMaterial) {
        return false;
      }
    }

    if (filters.maxDistanceKm !== null) {
      const distance = getDistanceKm(
        distanceOrigin.latitude,
        distanceOrigin.longitude,
        maker.latitude,
        maker.longitude
      );

      if (distance > filters.maxDistanceKm) {
        return false;
      }
    }

    return true;
  });
}

export function sortMakersByDistance(
  makers: Maker[],
  origin: MapOrigin
): Maker[] {
  return [...makers].sort((left, right) => {
    const leftDistance = getDistanceKm(
      origin.latitude,
      origin.longitude,
      left.latitude,
      left.longitude
    );
    const rightDistance = getDistanceKm(
      origin.latitude,
      origin.longitude,
      right.latitude,
      right.longitude
    );

    return leftDistance - rightDistance;
  });
}

export function getMakerDistanceKm(
  maker: Maker,
  origin: MapOrigin
): number {
  return getDistanceKm(
    origin.latitude,
    origin.longitude,
    maker.latitude,
    maker.longitude
  );
}
