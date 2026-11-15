/**
 * S25: "Ciudad, Provincia" for the buyer's Ubicación field. Pure helpers (no fetch) that turn
 * OpenStreetMap results (Photon, Nominatim) into Spanish city + province, and read/write the
 * single input back into the existing `city` / `province` columns.
 */

export type PlaceSuggestion = { city: string; province: string; label: string };

/** The 50 provinces plus Ceuta and Melilla. Aliases cover co-official names OSM uses. */
const provinces: { name: string; aliases: string[] }[] = [
  { name: "Álava", aliases: ["araba", "araba/alava", "alava"] },
  { name: "Albacete", aliases: [] },
  { name: "Alicante", aliases: ["alacant"] },
  { name: "Almería", aliases: [] },
  { name: "Asturias", aliases: ["asturies"] },
  { name: "Ávila", aliases: [] },
  { name: "Badajoz", aliases: [] },
  { name: "Barcelona", aliases: [] },
  { name: "Burgos", aliases: [] },
  { name: "Cáceres", aliases: [] },
  { name: "Cádiz", aliases: [] },
  { name: "Cantabria", aliases: [] },
  { name: "Castellón", aliases: ["castello", "castello de la plana"] },
  { name: "Ciudad Real", aliases: [] },
  { name: "Córdoba", aliases: [] },
  { name: "A Coruña", aliases: ["la coruna", "coruna"] },
  { name: "Cuenca", aliases: [] },
  { name: "Girona", aliases: ["gerona"] },
  { name: "Granada", aliases: [] },
  { name: "Guadalajara", aliases: [] },
  { name: "Gipuzkoa", aliases: ["guipuzcoa"] },
  { name: "Huelva", aliases: [] },
  { name: "Huesca", aliases: [] },
  { name: "Illes Balears", aliases: ["islas baleares", "baleares", "balears"] },
  { name: "Jaén", aliases: [] },
  { name: "León", aliases: [] },
  { name: "Lleida", aliases: ["lerida"] },
  { name: "Lugo", aliases: [] },
  { name: "Madrid", aliases: [] },
  { name: "Málaga", aliases: [] },
  { name: "Murcia", aliases: [] },
  { name: "Navarra", aliases: ["nafarroa"] },
  { name: "Ourense", aliases: ["orense"] },
  { name: "Palencia", aliases: [] },
  { name: "Las Palmas", aliases: [] },
  { name: "Pontevedra", aliases: [] },
  { name: "La Rioja", aliases: ["rioja"] },
  { name: "Salamanca", aliases: [] },
  { name: "Santa Cruz de Tenerife", aliases: [] },
  { name: "Segovia", aliases: [] },
  { name: "Sevilla", aliases: [] },
  { name: "Soria", aliases: [] },
  { name: "Tarragona", aliases: [] },
  { name: "Teruel", aliases: [] },
  { name: "Toledo", aliases: [] },
  { name: "Valencia", aliases: ["valència"] },
  { name: "Valladolid", aliases: [] },
  { name: "Bizkaia", aliases: ["vizcaya"] },
  { name: "Zamora", aliases: [] },
  { name: "Zaragoza", aliases: [] },
  { name: "Ceuta", aliases: [] },
  { name: "Melilla", aliases: [] },
];

/** Autonomous communities that are a single province: OSM often gives only the community. */
const singleProvinceCommunities: Record<string, string> = {
  "comunidad de madrid": "Madrid",
  "principado de asturias": "Asturias",
  asturias: "Asturias",
  cantabria: "Cantabria",
  "la rioja": "La Rioja",
  navarra: "Navarra",
  "comunidad foral de navarra": "Navarra",
  "nafarroako foru komunitatea": "Navarra",
  "region de murcia": "Murcia",
  "illes balears": "Illes Balears",
  ceuta: "Ceuta",
  melilla: "Melilla",
};

export function foldPlace(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/\s+/g, " ")
    .trim();
}

const provinceIndex = new Map<string, string>();
for (const province of provinces) {
  provinceIndex.set(foldPlace(province.name), province.name);
  for (const alias of province.aliases) {
    provinceIndex.set(foldPlace(alias), province.name);
  }
}

/** "Comarca de València", "Asturias / Asturies", "Provincia de Sevilla" → canonical province, or null. */
export function matchProvince(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const candidates = [raw, ...raw.split("/")].map((part) =>
    foldPlace(part).replace(/^(provincia de|comarca de|comarca del|comarca d'|area metropolitana de)\s+/, ""),
  );
  for (const candidate of candidates) {
    const hit = provinceIndex.get(candidate);
    if (hit) {
      return hit;
    }
  }
  return null;
}

/** Best province for a place: county, then the city itself (capitals), then a one-province community, then the community. */
export function resolveProvince(input: { city: string; county?: string | null; state?: string | null }): string {
  return (
    matchProvince(input.county) ??
    matchProvince(input.city) ??
    (input.state ? singleProvinceCommunities[foldPlace(input.state)] : undefined) ??
    (input.state?.trim() || "")
  );
}

export function formatLocation(city: string, province: string): string {
  const c = city.trim();
  const p = province.trim();
  if (c && p && foldPlace(c) !== foldPlace(p)) {
    return `${c}, ${p}`;
  }
  return c || p;
}

/** Free text back into the two stored fields: "Ciudad, Provincia" splits on the last comma. */
export function parseLocation(text: string): { city: string; province: string } {
  const value = text.replace(/\s+/g, " ").trim();
  const cut = value.lastIndexOf(",");
  if (cut === -1) {
    return { city: value, province: "" };
  }
  return { city: value.slice(0, cut).trim(), province: value.slice(cut + 1).trim() };
}

function suggestion(city: string, province: string): PlaceSuggestion {
  return { city, province, label: formatLocation(city, province) };
}

function dedupe(items: PlaceSuggestion[], limit: number): PlaceSuggestion[] {
  const seen = new Set<string>();
  const out: PlaceSuggestion[] = [];
  for (const item of items) {
    const key = foldPlace(item.label);
    if (item.city && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
    if (out.length >= limit) {
      break;
    }
  }
  return out;
}

type PhotonFeature = {
  properties?: {
    name?: string;
    countrycode?: string;
    county?: string;
    state?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
  };
};

const placeValues = new Set(["city", "town", "village", "municipality", "hamlet", "suburb", "administrative"]);

/** Photon GeoJSON → Spanish places only. */
export function suggestionsFromPhoton(body: unknown, limit = 6): PlaceSuggestion[] {
  const features = (body as { features?: PhotonFeature[] } | null)?.features;
  if (!Array.isArray(features)) {
    return [];
  }
  const items: PlaceSuggestion[] = [];
  for (const feature of features) {
    const p = feature.properties;
    if (!p?.name || p.countrycode !== "ES" || (p.osm_value && !placeValues.has(p.osm_value))) {
      continue;
    }
    if (p.type === "state") {
      continue;
    }
    if (p.type === "county") {
      const province = matchProvince(p.name);
      if (province) {
        items.push(suggestion(province, province));
      }
      continue;
    }
    items.push(suggestion(p.name, resolveProvince({ city: p.name, county: p.county, state: p.state })));
  }
  return dedupe(items, limit);
}

type NominatimResult = {
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    province?: string;
    county?: string;
    state?: string;
    country_code?: string;
  };
};

/** Nominatim jsonv2 with addressdetails=1 → Spanish places only. */
export function suggestionsFromNominatim(body: unknown, limit = 6): PlaceSuggestion[] {
  if (!Array.isArray(body)) {
    return [];
  }
  const items: PlaceSuggestion[] = [];
  for (const row of body as NominatimResult[]) {
    const a = row.address;
    if (!a || a.country_code !== "es") {
      continue;
    }
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? row.name ?? "";
    const province = matchProvince(a.province) ?? resolveProvince({ city, county: a.county, state: a.state });
    items.push(suggestion(city, province));
  }
  return dedupe(items, limit);
}
