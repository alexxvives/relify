import { parseSabiPercent } from "./insights";

/**
 * t75: readable shareholder rows for admin and seller. Registry exports use one-letter
 * holder types; only codes with a known meaning get a label, anything else is hidden.
 */
const typeLabels: Record<string, string> = {
  A: "Aseguradora",
  B: "Banco",
  C: "Sociedad",
  E: "Fondo o fideicomiso",
  F: "Entidad financiera",
  H: "Autocartera",
  I: "Persona física",
  J: "Fundación",
  L: "Empleados o directivos",
  P: "Capital riesgo",
  S: "Sector público",
  V: "Capital riesgo",
};

export function holderTypeLabel(type: string | null | undefined): string | null {
  const code = (type ?? "").trim().toUpperCase();
  return typeLabels[code] ?? null;
}

const honorific = /^(MR|MRS|MS|MISS|DR|D|DON|DÑA|DOÑA|SR|SRA)\.?\s+/i;
const legalForms = new Set(["SL", "SA", "SLU", "SAU", "SLL", "SC", "SCP", "CB", "SLP", "SAL", "SCCL", "SCOOP"]);

function titleWord(word: string): string {
  const bare = word.replace(/\.+$/, "").toUpperCase().replace(/\./g, "");
  if (legalForms.has(bare)) {
    return bare;
  }
  if (/\d/.test(word) || word.length <= 1) {
    return word.toUpperCase();
  }
  return word
    .toLocaleLowerCase("es-ES")
    .replace(/(^|[-'’])(\p{L})/gu, (_match, lead: string, letter: string) => lead + letter.toLocaleUpperCase("es-ES"));
}

/** "MR GERARD GARCIA ESTEVE" → "Gerard Garcia Esteve"; "BCLAN 8912 SL." → "Bclan 8912 SL". */
export function formatHolderName(name: string): string {
  const clean = name.replace(/\s+/g, " ").trim().replace(honorific, "");
  const words = clean.split(" ").filter(Boolean);
  return words.map((word) => titleWord(word)).join(" ") || name.trim();
}

/** ">50,00" → "> 50 %", "8,10" → "8,1 %", "-" or empty → null. */
export function formatHoldingPercent(text: string | null | undefined): string | null {
  const share = parseSabiPercent(text);
  if (!share) {
    return null;
  }
  const value = (share.basisPoints / 100).toLocaleString("es-ES", { maximumFractionDigits: 2 });
  return `${share.atLeast ? "> " : ""}${value} %`;
}

/**
 * t77: the shareholders table shows only what fits next to the donut: the biggest known stakes first, then one
 * grouped line for holders with no published %. Everything else waits behind "Ver más (N)".
 */
export function topShareholders<T extends { direct: string | null; total: string | null }>(holdings: T[], limit = 5): { known: T[]; unknown: T[]; shown: T[]; hidden: number } {
  const withShare = holdings.map((holder, index) => ({ holder, index, share: parseSabiPercent(holder.direct) ?? parseSabiPercent(holder.total) }));
  const known = withShare
    .filter((item) => item.share)
    .sort((a, b) => b.share!.basisPoints - a.share!.basisPoints || a.index - b.index)
    .map((item) => item.holder);
  const unknown = withShare.filter((item) => !item.share).map((item) => item.holder);
  const room = unknown.length > 0 ? Math.max(1, limit - 1) : limit;
  const shown = known.slice(0, room);
  return { known, unknown, shown, hidden: holdings.length - shown.length };
}
