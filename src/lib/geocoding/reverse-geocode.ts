interface ReverseGeocodeResult {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  postcode?: string;
  country?: string;
}

interface NominatimReverseResult {
  address?: NominatimAddress;
  display_name?: string;
}

/**
 * Обратное геокодирование: координаты → адрес через Nominatim
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", latitude.toString());
    url.searchParams.set("lon", longitude.toString());
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "PrintShare/1.0 (web.mr.spacks@gmail.com)",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as NominatimReverseResult;
    const addr = data.address;

    if (!addr) return null;

    // Build street from road + house_number
    const street = [addr.road, addr.house_number]
      .filter(Boolean)
      .join(" ");

    // City can be in city, town, or village
    const city = addr.city || addr.town || addr.village || "";

    return {
      street: street || undefined,
      city: city || undefined,
      postalCode: addr.postcode || undefined,
      country: addr.country || undefined,
    };
  } catch (error) {
    console.error("[reverseGeocode] Error:", error);
    return null;
  }
}
