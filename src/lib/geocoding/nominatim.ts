export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Геокодинг адреса через OpenStreetMap Nominatim (бесплатно, без API-ключа).
 * Подходит для любой страны — без привязки к Праге.
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodedLocation | null> {
  const query = address.trim();
  if (query.length < 5) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "PrintLocalP2P/1.0 (contact@printlocal.cz)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) return null;

  const results = (await response.json()) as NominatimResult[];
  const first = results[0];

  if (!first) return null;

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    displayName: first.display_name,
  };
}
