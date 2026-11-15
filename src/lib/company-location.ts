const spanishPostal = /^\d{5}$/;

export type CompanyLocation = {
  postalCode: string;
  city: string;
  fromRegistry: boolean;
};

const smallWords = new Set(["de", "del", "dels", "la", "las", "los", "el", "y", "i", "d"]);

export function titleCasePlace(value: string): string {
  const words = value
    .trim()
    .toLocaleLowerCase("es-ES")
    .split(/(\s+|-)/)
    .filter((word) => word.length > 0);
  return words
    .map((word, index) => {
      if (/^\s+$/.test(word) || word === "-") {
        return word;
      }
      if (index > 0 && smallWords.has(word)) {
        return word;
      }
      return `${word.charAt(0).toLocaleUpperCase("es-ES")}${word.slice(1)}`;
    })
    .join("");
}

export function isSpanishPostalCode(value: string): boolean {
  return spanishPostal.test(value.trim());
}

/** One Ubicación field: "08022, Barcelona", or a city with no code yet. */
export function parseCompanyLocationField(value: string): { postalCode: string; city: string } {
  const trimmed = value.trim();
  const lead = /^(\d{1,5})(.*)$/.exec(trimmed);
  if (!lead) {
    return { postalCode: "", city: trimmed };
  }
  const postalCode = lead[1] ?? "";
  const rest = lead[2] ?? "";
  if (rest.length === 0 || /^\d/.test(rest)) {
    return { postalCode, city: "" };
  }
  return { postalCode, city: rest.replace(/^\s*,\s*|^\s+/, "").trim() };
}

export function formatCompanyLocation(postalCode: string, city: string): string {
  const code = postalCode.trim();
  const place = titleCasePlace(city);
  if (code.length > 0 && place.length > 0) {
    return `${code}, ${place}`;
  }
  if (place.length > 0) {
    return place;
  }
  return code;
}

function firstPostalCode(value: string): string {
  const match = /\b(\d{5})\b/.exec(value);
  return match?.[1] ?? "";
}

function cityFromAddress(address: string, postalCode: string, region: string): string {
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return "";
  }
  if (postalCode.length > 0) {
    const after = trimmed.split(postalCode)[1] ?? "";
    const parenthetical = /\(([^)]+)\)/.exec(after);
    const raw = after.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
    const words = raw.split(" ").filter((word) => word.length > 0 && !/^\d+$/.test(word));
    if (words.length > 0) {
      const place = words[0] ?? "";
      if (region && place.toLocaleLowerCase("es-ES") === region.toLocaleLowerCase("es-ES") && parenthetical?.[1]) {
        return titleCasePlace(parenthetical[1]);
      }
      return titleCasePlace(place);
    }
  }
  const paren = /\(([^)]+)\)/.exec(trimmed);
  if (paren?.[1] && !isSpanishPostalCode(paren[1])) {
    return titleCasePlace(paren[1]);
  }
  const parts = trimmed.split(",").map((part) => part.trim()).filter((part) => part.length > 0);
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2] ?? "";
    const last = parts[parts.length - 1] ?? "";
    if (region && last.toLocaleLowerCase("es-ES") === region.toLocaleLowerCase("es-ES") && candidate.length > 0 && !isSpanishPostalCode(candidate)) {
      return titleCasePlace(candidate);
    }
    if (!isSpanishPostalCode(last) && last.toLocaleLowerCase("es-ES") !== region.toLocaleLowerCase("es-ES")) {
      return titleCasePlace(last);
    }
  }
  if (parts.length === 1 && !isSpanishPostalCode(parts[0] ?? "") && trimmed.length <= 80) {
    return titleCasePlace(trimmed);
  }
  return "";
}

/**
 * Prefers registry columns (SABI `postal_code` / `city`). Falls back to parsing the
 * composed `address` string from API Empresas / BORME / an older SABI compose.
 * `fromRegistry` is true only when both CP and city already live on those columns.
 */
export function resolveCompanyLocation(input: {
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  region?: string | null;
}): CompanyLocation {
  const columnCode = (input.postalCode ?? "").trim();
  const columnCity = (input.city ?? "").trim();
  const region = (input.region ?? "").trim();
  const fromRegistry = isSpanishPostalCode(columnCode) && columnCity.length > 0;
  if (fromRegistry) {
    return { postalCode: columnCode, city: titleCasePlace(columnCity), fromRegistry: true };
  }
  const address = input.address ?? "";
  const parsedCode = isSpanishPostalCode(columnCode) ? columnCode : firstPostalCode(address);
  const parsedCity = columnCity.length > 0 ? titleCasePlace(columnCity) : cityFromAddress(address, parsedCode, region);
  return { postalCode: parsedCode, city: parsedCity, fromRegistry: false };
}

export type StoredProjectLocation = {
  address?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  region?: string | null;
};

/**
 * S25b: the wizard's Ubicación reads a project row like this (columns first, then the composed `address`).
 * Every loader uses it so the field, the checklist and the publish checks see the same place.
 */
export function resolveProjectLocation(row: StoredProjectLocation): CompanyLocation {
  return resolveCompanyLocation({
    address: row.address || [row.street, row.postalCode, row.city].filter(Boolean).join(", "),
    postalCode: row.postalCode,
    city: row.city,
    region: row.region,
  });
}

/**
 * S25b: one rule for "Ubicación is filled", shared by the wizard, the Inicio checklist and the publish gate.
 * A city, a full Spanish postal code, or a region counts. A partial code does not (saving drops it).
 */
export function companyLocationComplete(location: { postalCode: string; city: string; region?: string | null }): boolean {
  return location.city.trim().length > 0 || isSpanishPostalCode(location.postalCode) || (location.region ?? "").trim().length > 0;
}

export function projectLocationComplete(row: StoredProjectLocation): boolean {
  return companyLocationComplete({ ...resolveProjectLocation(row), region: row.region });
}
