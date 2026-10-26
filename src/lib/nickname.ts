/** "Proyecto Olivo" → "Olivo": cards already say it is a listing, so the prefix is noise. */
export function shortNickname(codename: string): string {
  const short = codename.replace(/^\s*proyecto\s+/i, "").trim();
  return short.length > 0 ? short : codename;
}

/**
 * Curated Spanish words for the automatic public nickname ("Proyecto Olivo").
 * Neutral nature and landscape words: no sector, place or person hints.
 */
export const nicknameWords = [
  "Alba", "Almendro", "Arce", "Arena", "Aurora", "Bahía", "Brisa", "Bruma", "Cala", "Calma",
  "Cauce", "Cedro", "Cierzo", "Cima", "Coral", "Delta", "Duna", "Encina", "Estela", "Faro",
  "Fresno", "Garza", "Grao", "Halcón", "Haya", "Hiedra", "Horizonte", "Jara", "Laurel", "Lima",
  "Lince", "Llano", "Loma", "Lucero", "Marea", "Mirlo", "Nácar", "Nieve", "Nogal", "Olivo",
  "Olmo", "Ónix", "Pino", "Poniente", "Prado", "Quercus", "Rambla", "Ría", "Roble", "Romero",
  "Salvia", "Sauce", "Sendero", "Sierra", "Tejo", "Tomillo", "Trigo", "Vega", "Vela", "Viento",
  "Zafiro", "Zenit", "Ámbar", "Abeto", "Azahar", "Boreal", "Cobalto", "Galena", "Jade", "Lavanda",
] as const;

export function nicknameFor(word: string): string {
  return `Proyecto ${word}`;
}

/** Nicknames the seller may pick with "Generar otro"; anything else is ignored on save. */
export function isCuratedNickname(codename: string): boolean {
  const match = /^Proyecto (\S+?)(?: (\d+))?$/.exec(codename.trim());
  return match !== null && (nicknameWords as readonly string[]).includes(match[1] ?? "");
}
