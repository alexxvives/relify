import * as z from "zod";

/**
 * t82: seller-declared adjustments to the accounts EBITDA ("EBITDA ajustado").
 * The seller lists each adjustment (type, signed amount, short reason); the adjusted figure is always
 * computed on the server as accounts EBITDA + sum of adjustments. A total sent by the client is never read.
 */
export const ebitdaAdjustmentTypes = ["owner_salary", "personal", "one_off", "one_off_income", "rent", "litigation", "other"] as const;
export type EbitdaAdjustmentType = (typeof ebitdaAdjustmentTypes)[number];

/**
 * t89: sellers may only pick a predefined type. "other" stays a known stored value so old rows still display and
 * still save, but it is no longer offered; the editor asks the seller to reclassify it before saving.
 */
export const selectableEbitdaAdjustmentTypes = ebitdaAdjustmentTypes.filter(
  (type): type is Exclude<EbitdaAdjustmentType, "other"> => type !== "other",
);

export const ebitdaAdjustmentLabels: Record<EbitdaAdjustmentType, string> = {
  owner_salary: "Sueldo del propietario fuera de mercado",
  personal: "Gastos personales del propietario",
  one_off: "Gastos extraordinarios no recurrentes",
  one_off_income: "Ingresos extraordinarios no recurrentes",
  rent: "Alquiler fuera de mercado",
  litigation: "Indemnizaciones o litigios puntuales",
  other: "Otro",
};

/** Expected sign of each type: "+" adds to the EBITDA, "-" subtracts, "±" depends on the case. */
export const ebitdaAdjustmentSign: Record<EbitdaAdjustmentType, "+" | "-" | "±"> = {
  owner_salary: "±",
  personal: "+",
  one_off: "+",
  one_off_income: "-",
  rent: "±",
  litigation: "+",
  other: "±",
};

/** t89: one line per type telling the seller what it covers and which sign it usually takes. */
export const ebitdaAdjustmentHints: Record<EbitdaAdjustmentType, string> = {
  owner_salary: "Diferencia con lo que costaría un gerente contratado. Suma (+) si cobras de más, resta (−) si cobras de menos.",
  personal: "Gastos tuyos pagados por la empresa (coche, viajes…) que un comprador no tendría. Suma (+).",
  one_off: "Gastos puntuales que no se repetirán (una reforma, una mudanza…). Suma (+).",
  one_off_income: "Ingresos puntuales que no se repetirán (venta de un activo, una subvención única…). Resta (−).",
  rent: "Diferencia con un alquiler de mercado, p. ej. si el local es tuyo. Suma (+) si pagas de más, resta (−) si pagas de menos.",
  litigation: "Despidos, indemnizaciones o pleitos puntuales ya cerrados. Suma (+).",
  other: "Tipo antiguo: elige uno de la lista para poder guardar.",
};

export const maxEbitdaAdjustments = 10;
export const ebitdaAdjustmentReasonMax = 140;

/** Stored shape (Project.ebitdaAdjustments). `reason` is null when hidden from a buyer before the NDA. */
export type EbitdaAdjustment = { type: EbitdaAdjustmentType; amountCents: number; reason: string | null };

/** What the form posts per row: amount as Spanish euro text ("-12000" or "1500,50"). */
const rowSchema = z.object({
  type: z.enum(ebitdaAdjustmentTypes),
  amount: z
    .string()
    .trim()
    .regex(/^-?\d{1,12}(,\d{1,2})?$/, "adjustment-amount"),
  reason: z.string().trim().min(3, "adjustment-reason").max(ebitdaAdjustmentReasonMax, "adjustment-reason"),
});

function centsOf(value: string): number {
  const negative = value.startsWith("-");
  const [whole = "0", fraction = ""] = (negative ? value.slice(1) : value).split(",");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  return negative ? -cents : cents;
}

export type ParsedAdjustments = { ok: true; rows: EbitdaAdjustment[] } | { ok: false; code: string };

/**
 * Parses the posted JSON list. Unknown keys (e.g. a client-side "total") are dropped; zero amounts are rejected
 * because they explain nothing.
 */
export function parseEbitdaAdjustments(raw: string): ParsedAdjustments {
  if (raw.trim() === "") {
    return { ok: true, rows: [] };
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, code: "adjustment-format" };
  }
  const parsed = z.array(rowSchema).max(maxEbitdaAdjustments, "adjustment-count").safeParse(json);
  if (!parsed.success) {
    return { ok: false, code: parsed.error.issues[0]?.message ?? "adjustment-format" };
  }
  const rows = parsed.data.map((row) => ({ type: row.type, amountCents: centsOf(row.amount), reason: row.reason }));
  if (rows.some((row) => row.amountCents === 0)) {
    return { ok: false, code: "adjustment-amount" };
  }
  return { ok: true, rows };
}

export function sumEbitdaAdjustments(rows: readonly Pick<EbitdaAdjustment, "amountCents">[]): number {
  return rows.reduce((total, row) => total + row.amountCents, 0);
}

/** The only place the adjusted figure is derived: accounts EBITDA plus the listed adjustments. */
export function adjustedEbitdaCents(accountsEbitdaCents: number, rows: readonly Pick<EbitdaAdjustment, "amountCents">[]): number {
  return accountsEbitdaCents + sumEbitdaAdjustments(rows);
}

/** Reads the stored JSON column defensively (null = the seller never used the list: legacy declared number). */
export function storedEbitdaAdjustments(value: unknown): EbitdaAdjustment[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const row = item as Record<string, unknown>;
    const type = ebitdaAdjustmentTypes.find((known) => known === row.type);
    const amount = typeof row.amountCents === "number" && Number.isFinite(row.amountCents) ? Math.trunc(row.amountCents) : null;
    if (!type || amount === null) {
      return [];
    }
    return [{ type, amountCents: amount, reason: typeof row.reason === "string" ? row.reason : null }];
  });
}

/** Before the NDA a buyer sees type and amount only: the reason is free seller text and may identify the company. */
export function adjustmentsForBuyer(rows: EbitdaAdjustment[] | null, ndaSigned: boolean): EbitdaAdjustment[] | null {
  if (!rows || ndaSigned) {
    return rows;
  }
  return rows.map((row) => ({ ...row, reason: null }));
}

/** Editable row as the seller form holds it (amount as typed euro text). */
export type EbitdaAdjustmentFormRow = { type: EbitdaAdjustmentType; amount: string; reason: string };

export function centsToAdjustmentAmount(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.trunc(abs / 100);
  const rest = abs % 100;
  return `${sign}${euros}${rest === 0 ? "" : `,${String(rest).padStart(2, "0")}`}`;
}

/** Stored rows → the form's hidden JSON. `null` (legacy, never itemised) stays "". */
export function adjustmentsToFormJson(rows: EbitdaAdjustment[] | null): string {
  if (rows === null) {
    return "";
  }
  return JSON.stringify(
    rows.map((row) => ({ type: row.type, amount: centsToAdjustmentAmount(row.amountCents), reason: row.reason ?? "" })),
  );
}

/** The form's JSON → editable rows (lenient: the server re-validates on save). */
export function formRowsFromJson(raw: string): EbitdaAdjustmentFormRow[] {
  if (raw.trim() === "") {
    return [];
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) {
      return [];
    }
    return value.flatMap((item) => {
      if (typeof item !== "object" || item === null) {
        return [];
      }
      const row = item as Record<string, unknown>;
      const type = ebitdaAdjustmentTypes.find((known) => known === row.type) ?? "other";
      return [{ type, amount: typeof row.amount === "string" ? row.amount : "", reason: typeof row.reason === "string" ? row.reason : "" }];
    });
  } catch {
    return [];
  }
}

/** Live preview amount for one typed row: cents, or null while the text is not a valid amount yet. */
export function formRowAmountCents(amount: string): number | null {
  const text = amount.trim().replace(/\./g, "").replace(/\s/g, "");
  if (!/^-?\d{1,12}(,\d{1,2})?$/.test(text)) {
    return null;
  }
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace("-", "").split(",");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}

/** t89: per-field problems of one editable row, shown inline in the adjustments modal. */
export type AdjustmentRowErrors = { type?: string; amount?: string; reason?: string };

export function adjustmentRowErrors(row: EbitdaAdjustmentFormRow): AdjustmentRowErrors {
  const errors: AdjustmentRowErrors = {};
  if (row.type === "other") {
    errors.type = "Elige un tipo de la lista.";
  }
  const cents = formRowAmountCents(row.amount);
  if (row.amount.trim() === "" || cents === null) {
    errors.amount = "Indica un importe, p. ej. 12000 o -3500.";
  } else if (cents === 0) {
    errors.amount = "El importe no puede ser 0.";
  }
  const reason = row.reason.trim().length;
  if (reason < 3) {
    errors.reason = "Justifica el ajuste (mínimo 3 caracteres).";
  } else if (reason > ebitdaAdjustmentReasonMax) {
    errors.reason = `Máximo ${ebitdaAdjustmentReasonMax} caracteres.`;
  }
  return errors;
}

export function adjustmentRowsValid(rows: EbitdaAdjustmentFormRow[]): boolean {
  return rows.every((row) => Object.keys(adjustmentRowErrors(row)).length === 0);
}
