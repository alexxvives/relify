/**
 * S25/S26: "Ciudad, Comunidad autónoma, España" for the buyer's Ubicación field (city level only). Pure helpers (no fetch) that turn
 * OpenStreetMap results (Photon, Nominatim) into Spanish city + province, and read/write the
 * single input back into the existing `city` / `province` columns.
 */

/** `province` keeps its column name but, since S26, holds the autonomous community ("Cataluña"). */
export type PlaceSuggestion = { city: string; province: string; label: string };

export const spainCountryName = "España";

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

/** S26: the 17 autonomous communities plus Ceuta and Melilla, Spanish names first; aliases are OSM's co-official names. */
const communities: { name: string; aliases: string[]; provinces: string[] }[] = [
  { name: "Andalucía", aliases: ["andalusia"], provinces: ["Almería", "Cádiz", "Córdoba", "Granada", "Huelva", "Jaén", "Málaga", "Sevilla"] },
  { name: "Aragón", aliases: ["arago", "aragon"], provinces: ["Huesca", "Teruel", "Zaragoza"] },
  { name: "Asturias", aliases: ["principado de asturias", "asturies", "principau d'asturies"], provinces: ["Asturias"] },
  { name: "Islas Baleares", aliases: ["illes balears", "baleares", "balears"], provinces: ["Illes Balears"] },
  { name: "Canarias", aliases: ["islas canarias"], provinces: ["Las Palmas", "Santa Cruz de Tenerife"] },
  { name: "Cantabria", aliases: [], provinces: ["Cantabria"] },
  { name: "Castilla y León", aliases: ["castilla y leon"], provinces: ["Ávila", "Burgos", "León", "Palencia", "Salamanca", "Segovia", "Soria", "Valladolid", "Zamora"] },
  { name: "Castilla-La Mancha", aliases: ["castilla la mancha"], provinces: ["Albacete", "Ciudad Real", "Cuenca", "Guadalajara", "Toledo"] },
  { name: "Cataluña", aliases: ["catalunya", "cataluna", "catalonia"], provinces: ["Barcelona", "Girona", "Lleida", "Tarragona"] },
  { name: "Comunidad Valenciana", aliases: ["comunitat valenciana", "valencian community"], provinces: ["Alicante", "Castellón", "Valencia"] },
  { name: "Extremadura", aliases: [], provinces: ["Badajoz", "Cáceres"] },
  { name: "Galicia", aliases: [], provinces: ["A Coruña", "Lugo", "Ourense", "Pontevedra"] },
  { name: "Comunidad de Madrid", aliases: ["madrid"], provinces: ["Madrid"] },
  { name: "Región de Murcia", aliases: ["murcia"], provinces: ["Murcia"] },
  { name: "Navarra", aliases: ["comunidad foral de navarra", "nafarroa", "nafarroako foru komunitatea"], provinces: ["Navarra"] },
  { name: "País Vasco", aliases: ["euskadi", "pais vasco/euskadi", "euskal herria", "basque country"], provinces: ["Álava", "Bizkaia", "Gipuzkoa"] },
  { name: "La Rioja", aliases: ["rioja"], provinces: ["La Rioja"] },
  { name: "Ceuta", aliases: [], provinces: ["Ceuta"] },
  { name: "Melilla", aliases: [], provinces: ["Melilla"] },
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

const communityIndex = new Map<string, string>();
const communityByProvince = new Map<string, string>();
for (const community of communities) {
  communityIndex.set(foldPlace(community.name), community.name);
  for (const alias of community.aliases) {
    communityIndex.set(foldPlace(alias), community.name);
  }
  for (const province of community.provinces) {
    communityByProvince.set(province, community.name);
  }
}

/** S26: "Catalunya", "Euskadi", "Comunitat Valenciana", or a province ("Sevilla") → the community's Spanish name, or null. */
export function matchCommunity(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  for (const part of [raw, ...raw.split("/")]) {
    const hit = communityIndex.get(foldPlace(part));
    if (hit) {
      return hit;
    }
  }
  const province = matchProvince(raw);
  return province ? (communityByProvince.get(province) ?? null) : null;
}

/** S26: best community for a place: OSM's state, else the community of its province. */
export function resolveCommunity(input: { city: string; county?: string | null; state?: string | null }): string {
  return matchCommunity(input.state) ?? communityByProvince.get(resolveProvince(input)) ?? (input.state?.trim() || "");
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

/**
 * S26: "Barcelona, Cataluña, España". A stored legacy province ("Sabadell" + "Barcelona") is shown with its
 * community; a value OSM did not recognise is kept as typed.
 */
export function formatLocation(city: string, region: string): string {
  const c = city.trim();
  const r = region.trim();
  if (!c && !r) {
    return "";
  }
  const community = matchCommunity(r) ?? r;
  const parts = [c, community && foldPlace(community) !== foldPlace(c) ? community : ""].filter((part) => part.length > 0);
  return [...parts, spainCountryName].join(", ");
}

/** Free text back into the two stored fields: "Ciudad, Comunidad[, España]"; the country is dropped, the last part is the region. */
export function parseLocation(text: string): { city: string; province: string } {
  const parts = text
    .replace(/\s+/g, " ")
    .split(",")
    .map((part) => part.trim());
  while (parts.length > 1 && /^(espana|spain)$/.test(foldPlace(parts[parts.length - 1] ?? ""))) {
    parts.pop();
  }
  const filled = parts.filter((part, index) => part.length > 0 || index < parts.length - 1);
  if (filled.length <= 1) {
    return { city: (filled[0] ?? "").trim(), province: "" };
  }
  return { city: filled.slice(0, -1).join(", ").trim(), province: (filled[filled.length - 1] ?? "").trim() };
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

/** S26: city level only (no provinces, communities, hamlets or neighbourhoods). */
const placeValues = new Set(["city", "town", "village", "municipality", "administrative"]);

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
    if (p.osm_value === "administrative" && p.type !== "city") {
      continue;
    }
    items.push(suggestion(p.name, resolveCommunity({ city: p.name, county: p.county, state: p.state })));
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
    items.push(suggestion(city, matchCommunity(a.state) ?? resolveCommunity({ city, county: a.province ?? a.county, state: a.state })));
  }
  return dedupe(items, limit);
}
