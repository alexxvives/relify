import * as z from "zod";

/**
 * t82: seller-declared adjustments to the accounts EBITDA ("EBITDA ajustado").
 * The seller lists each adjustment (type, signed amount, short reason); the adjusted figure is always
 * computed on the server as accounts EBITDA + sum of adjustments. A total sent by the client is never read.
 */
export const ebitdaAdjustmentTypes = ["owner_salary", "one_off", "personal", "rent", "other"] as const;
export type EbitdaAdjustmentType = (typeof ebitdaAdjustmentTypes)[number];

export const ebitdaAdjustmentLabels: Record<EbitdaAdjustmentType, string> = {
  owner_salary: "Sueldo del propietario por encima de mercado",
  one_off: "Gastos extraordinarios / no recurrentes",
  personal: "Gastos personales cargados a la empresa",
  rent: "Alquiler a precio no de mercado",
  other: "Otro",
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
