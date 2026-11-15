/**
 * S25: one "Añadir sector" combobox. Typed text filters the known sectors; Enter adds the
 * highlighted one, or the typed text as a custom sector. Stored as "A · B · C" (max 160 chars).
 */
import { foldPlace as fold } from "@/lib/spain-places";

export const sectorJoiner = " · ";
export const sectorsMaxChars = 160;

export function splitSectors(value: string): string[] {
  return value
    .split(sectorJoiner)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function filterSectors(options: readonly string[], chosen: string[], query: string): string[] {
  const needle = fold(query);
  const taken = new Set(chosen.map(fold));
  return options.filter((label) => !taken.has(fold(label)) && fold(label).includes(needle));
}

export type AddSectorResult = { ok: true; next: string[] } | { ok: false; reason: "empty" | "duplicate" | "too-long" };

/** Adds `raw` to `chosen`. An exact (accent/case-insensitive) match to a known sector uses its label. */
export function addSector(chosen: string[], raw: string, options: readonly string[]): AddSectorResult {
  const text = raw.replaceAll("·", " ").replace(/\s+/g, " ").trim();
  if (text.length === 0) {
    return { ok: false, reason: "empty" };
  }
  const known = options.find((label) => fold(label) === fold(text));
  const label = known ?? text.charAt(0).toLocaleUpperCase("es-ES") + text.slice(1);
  if (chosen.some((item) => fold(item) === fold(label))) {
    return { ok: false, reason: "duplicate" };
  }
  const next = [...chosen, label];
  if (next.join(sectorJoiner).length > sectorsMaxChars) {
    return { ok: false, reason: "too-long" };
  }
  return { ok: true, next };
}
