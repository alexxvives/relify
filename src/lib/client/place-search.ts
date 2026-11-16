import { foldPlace, suggestionsFromNominatim, suggestionsFromPhoton, type PlaceSuggestion } from "@/lib/spain-places";

/**
 * S25: keyless OpenStreetMap lookups from the browser (CSP connect-src allows both hosts).
 * Photon (komoot) is built for type-ahead. Nominatim is only a fallback when Photon fails, and
 * is throttled to one request per second as its usage policy asks (the browser sends the Referer).
 */
export const minPlaceQuery = 2;
const spainBox = "-18.5,27.4,4.6,44.2";
const cache = new Map<string, PlaceSuggestion[]>();
let lastNominatim = 0;

function photonUrl(query: string): string {
  const params = new URLSearchParams({ q: query, limit: "12", bbox: spainBox, lat: "40.4", lon: "-3.7" });
  for (const tag of ["place:city", "place:town", "place:village", "place:municipality", "boundary:administrative"]) {
    params.append("osm_tag", tag);
  }
  return `https://photon.komoot.io/api/?${params.toString()}`;
}

function nominatimUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "es",
    limit: "6",
    "accept-language": "es",
    featureType: "settlement",
  });
  return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`place lookup ${response.status}`);
  }
  return response.json();
}

/** Suggestions for a typed query. Cached per normalised query; throws only on abort. */
export async function searchPlaces(query: string, signal: AbortSignal): Promise<PlaceSuggestion[]> {
  const key = foldPlace(query);
  if (key.length < minPlaceQuery) {
    return [];
  }
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }
  let items: PlaceSuggestion[] | null = null;
  try {
    items = suggestionsFromPhoton(await getJson(photonUrl(query), signal));
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    const wait = Math.max(0, lastNominatim + 1000 - Date.now());
    if (key.length >= 3 && wait === 0) {
      lastNominatim = Date.now();
      try {
        items = suggestionsFromNominatim(await getJson(nominatimUrl(query), signal));
      } catch (fallbackError) {
        if (signal.aborted) {
          throw fallbackError;
        }
        console.warn("[ubicacion] Photon and Nominatim both failed", fallbackError);
      }
    }
  }
  if (items === null) {
    return [];
  }
  cache.set(key, items);
  return items;
}
