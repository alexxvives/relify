import { cnaeTitle } from "@/lib/cnae-2009";

/**
 * S34 (Alex): the company description starts as a short, neutral, anonymised summary built from the CNAE codes and
 * the registry facts (years operating, size band, region, customers), like Deale does. Deterministic, no AI and no
 * website: no name, no exact figures, no founding year (rounded to a span of years). The seller can edit it freely.
 */
export type AutoDescriptionInput = {
  principalCnae: string | null;
  secondaryCnaes?: string[];
  foundedYear?: number | null;
  headcountRange?: string | null;
  region?: string | null;
  customerBase?: string | null;
  now?: Date;
};

const headcountLabel: Record<string, string> = {
  band_1_5: "un equipo de hasta 5 personas",
  band_6_10: "un equipo de 6 a 10 personas",
  band_11_20: "un equipo de 11 a 20 personas",
  band_21_50: "una plantilla de 21 a 50 personas",
  band_over_50: "una plantilla de más de 50 personas",
};

const customerLabel: Record<string, string> = {
  business: "a otras empresas",
  consumer: "a clientes particulares",
  mixed: "tanto a particulares como a empresas",
};

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** "41001, Sevilla" -> "Sevilla"; "Andalucía" stays. Never a street or postal code. */
export function anonymousRegion(region: string | null | undefined): string | null {
  const parts = (region ?? "")
    .split(",")
    .map((part) => part.replace(/\d+/g, "").trim())
    .filter((part) => part.length > 1);
  return parts.at(-1) ?? null;
}

function yearsSpan(foundedYear: number | null | undefined, now: Date): string | null {
  if (!foundedYear) return null;
  const years = now.getFullYear() - foundedYear;
  if (years < 3) return "una trayectoria reciente";
  if (years < 5) return "más de 3 años de trayectoria";
  const rounded = years >= 50 ? 50 : Math.floor(years / 5) * 5;
  return `más de ${rounded} años de trayectoria`;
}

/** Null when there is no principal CNAE (nothing honest to say yet). */
export function autoCompanyDescription(input: AutoDescriptionInput): string | null {
  const principal = input.principalCnae ? cnaeTitle(input.principalCnae) : null;
  if (!input.principalCnae || !principal) return null;
  const secondary = [...new Set(input.secondaryCnaes ?? [])]
    .filter((code) => code !== input.principalCnae)
    .map((code) => cnaeTitle(code))
    .filter((title): title is string => Boolean(title))
    .slice(0, 2)
    .map(lowerFirst);

  const sentences: string[] = [];
  let first = `Empresa cuya actividad principal es ${lowerFirst(principal).replace(/\.$/, "")}`;
  if (secondary.length > 0) first += `, que además trabaja en ${secondary.join(" y ")}`;
  sentences.push(`${first}.`);

  const span = yearsSpan(input.foundedYear, input.now ?? new Date());
  const region = anonymousRegion(input.region);
  if (span && region) sentences.push(`Cuenta con ${span} y opera en ${region}.`);
  else if (span) sentences.push(`Cuenta con ${span}.`);
  else if (region) sentences.push(`Opera en ${region}.`);

  const team = input.headcountRange ? headcountLabel[input.headcountRange] : undefined;
  const customers = input.customerBase ? customerLabel[input.customerBase] : undefined;
  if (team && customers) sentences.push(`Trabaja con ${team} y da servicio ${customers}.`);
  else if (team) sentences.push(`Trabaja con ${team}.`);
  else if (customers) sentences.push(`Da servicio ${customers}.`);

  sentences.push("La identidad de la empresa y sus cifras detalladas se comparten con los compradores interesados tras firmar el acuerdo de confidencialidad.");
  return sentences.join(" ");
}
