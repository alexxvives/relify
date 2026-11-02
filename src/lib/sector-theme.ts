import type { SectorImageKey } from "./sector-image";

/**
 * t83: hero banner theme per CNAE sector family. One subtle hue per family, blended into the
 * brand navy, so the banner says "what kind of business" without any photo of real premises.
 */
export const sectorThemes: Record<SectorImageKey, { label: string; hue: string }> = {
  hosteleria: { label: "Hostelería", hue: "#b4541a" },
  comercio: { label: "Comercio", hue: "#3d5bd9" },
  industria: { label: "Industria", hue: "#5b6b7f" },
  alimentacion: { label: "Alimentación y agro", hue: "#5f7f24" },
  construccion: { label: "Construcción", hue: "#a8791a" },
  servicios: { label: "Servicios", hue: "#0f766e" },
  transporte: { label: "Transporte y logística", hue: "#2d6ca8" },
  turismo: { label: "Turismo y ocio", hue: "#0e8a9a" },
  tecnologia: { label: "Tecnología", hue: "#5b4bd1" },
  salud: { label: "Salud", hue: "#b23f66" },
  educacion: { label: "Educación", hue: "#7a4fc2" },
  inmobiliaria: { label: "Inmobiliaria", hue: "#8a6a4a" },
};

export function sectorBannerBackground(key: SectorImageKey): string {
  const { hue } = sectorThemes[key];
  return `radial-gradient(120% 140% at 100% 0%, ${hue}d9 0%, ${hue}66 35%, transparent 70%), linear-gradient(135deg, #1c2740 0%, #141c30 100%)`;
}

/** "1998" → "Fundada en los 90", "2014" → "Fundada en los 2010". Coarse on purpose (anonymity before the NDA). */
export function foundedChip(year: number | string | null | undefined): string | null {
  const value = typeof year === "string" ? Number.parseInt(year, 10) : year;
  if (!value || !Number.isFinite(value) || value < 1800) return null;
  const decade = Math.floor(value / 10) * 10;
  return `Fundada en los ${decade >= 2000 ? decade : String(decade).slice(2)}`;
}

export function bannerChips(input: { sector: SectorImageKey | null; region: string | null | undefined; foundedYear: number | string | null | undefined }): string[] {
  return [input.sector ? sectorThemes[input.sector].label : null, input.region?.trim() || null, foundedChip(input.foundedYear)].filter(
    (chip): chip is string => chip !== null && chip.length > 0,
  );
}
