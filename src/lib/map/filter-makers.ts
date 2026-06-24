import { PRAGUE_CENTER } from "@/data/makers";
import { getDistanceKm } from "@/lib/map/geo";
import type { Maker, MapFilters } from "@/types/maker";

/**
 * Применяет фильтры карты к списку мейкеров.
 */
export function filterMakers(makers: Maker[], filters: MapFilters): Maker[] {
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
        PRAGUE_CENTER.latitude,
        PRAGUE_CENTER.longitude,
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
