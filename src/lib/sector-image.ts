export const sectorImageKeys = [
  "hosteleria",
  "comercio",
  "industria",
  "alimentacion",
  "construccion",
  "servicios",
  "transporte",
  "turismo",
] as const;

export type SectorImageKey = (typeof sectorImageKeys)[number];

export const aiImageLabel = "Imagen generada con IA";

/** Maps a CNAE 2009 code (e.g. "56.10") to a generic, AI-generated sector picture. */
export function sectorKeyFromCnae(code: string | null | undefined): SectorImageKey {
  const division = Number.parseInt((code ?? "").slice(0, 2), 10);
  if (!Number.isFinite(division)) return "servicios";
  if (division === 55 || division === 79 || (division >= 90 && division <= 93)) return "turismo";
  if (division === 56) return "hosteleria";
  if (division >= 1 && division <= 3) return "alimentacion";
  if (division >= 10 && division <= 12) return "alimentacion";
  if (division >= 5 && division <= 33) return "industria";
  if (division >= 41 && division <= 43) return "construccion";
  if (division >= 45 && division <= 47) return "comercio";
  if (division >= 49 && division <= 53) return "transporte";
  return "servicios";
}

export function sectorImageSrc(key: SectorImageKey): string {
  return `/sectors/${key}.jpg`;
}
