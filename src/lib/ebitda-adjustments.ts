import * as z from "zod";

/**
 * t82: seller-declared adjustments to the accounts EBITDA ("EBITDA ajustado").
 * The seller lists each adjustment (type, signed amount, short reason); the adjusted figure is always
 * computed on the server as accounts EBITDA + sum of adjustments. A total sent by the client is never read.
 */
export const ebitdaAdjustmentTypes = ["owner_salary", "personal", "one_off", "one_off_income", "rent", "litigation", "other"] as const;
export type EbitdaAdjustmentType = (typeof ebitdaAdjustmentTypes)[number];

/** t91: every type is offered again, "Otro" included (it always needs its justification, like the rest). */
export const selectableEbitdaAdjustmentTypes = ebitdaAdjustmentTypes;

export const ebitdaAdjustmentLabels: Record<EbitdaAdjustmentType, string> = {
  owner_salary: "Sueldo del propietario fuera de mercado",
  personal: "Gastos personales del propietario",
  one_off: "Gastos extraordinarios no recurrentes",
  one_off_income: "Ingresos extraordinarios no recurrentes",
  rent: "Alquiler fuera de mercado",
  litigation: "Indemnizaciones o litigios puntuales",
  other: "Otro",
};

/**
 * t91: the seller types a positive amount and says what it is. Removing a non-recurring COST raises the EBITDA (+);
 * removing a non-recurring INCOME lowers it (−). Amounts stay stored signed, so old rows and the buyer view are unchanged.
 */
export const ebitdaAdjustmentDirections = ["cost", "income"] as const;
export type EbitdaAdjustmentDirection = (typeof ebitdaAdjustmentDirections)[number];

/** t92: colour of the adjusted-EBITDA pill: red below the accounting EBITDA, green above, neutral when equal. */
export function adjustedEbitdaTone(ebitdaCents: number, adjustedCents: number): "down" | "up" | "flat" {
  return adjustedCents < ebitdaCents ? "down" : adjustedCents > ebitdaCents ? "up" : "flat";
}

export const ebitdaAdjustmentDirectionLabels: Record<EbitdaAdjustmentDirection, string> = {
  cost: "Coste",
  income: "Ingreso",
};

/** Sensible starting point per type; the seller can always switch it. */
export function defaultAdjustmentDirection(type: EbitdaAdjustmentType): EbitdaAdjustmentDirection {
  return type === "one_off_income" ? "income" : "cost";
}

/** Signed form amount ("-1200" / "1200") → the direction it encodes and the positive text the seller edits. */
export function splitAdjustmentAmount(amount: string, type: EbitdaAdjustmentType): { direction: EbitdaAdjustmentDirection; amount: string } {
  const text = amount.trim();
  if (text === "" || text === "-") {
    return { direction: text === "-" ? "income" : defaultAdjustmentDirection(type), amount: "" };
  }
  return text.startsWith("-") ? { direction: "income", amount: text.slice(1) } : { direction: "cost", amount: text.replace(/^\+/, "") };
}

/** Positive text + direction → the signed form amount the server parses. */
export function joinAdjustmentAmount(amount: string, direction: EbitdaAdjustmentDirection): string {
  const text = amount.trim().replace(/^[-+]/, "");
  // An empty income row keeps a bare "-" so the chosen direction survives until the seller types the amount.
  return direction === "income" ? `-${text}` : text;
}

export const maxEbitdaAdjustments = 10;
export const ebitdaAdjustmentReasonMax = 140;

/** Same ceiling as `serverActions.bodySizeLimit` and the data room. A larger file is rejected before the action runs. */
export const adjustmentDocumentByteLimit = 20 * 1024 * 1024;
const adjustmentDocumentExtensions = new Set(["pdf", "png", "jpg", "jpeg", "webp", "gif", "txt", "doc", "docx", "xls", "xlsx", "csv"]);

export function adjustmentDocumentExtension(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return adjustmentDocumentExtensions.has(extension) ? extension : null;
}
export const adjustmentStatuses = ["pending", "approved"] as const;
export type AdjustmentStatus = (typeof adjustmentStatuses)[number];

const adjustmentIdPattern = /^(?:legacy-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const documentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Stored shape (Project.ebitdaAdjustments). `reason` is null when hidden from a buyer before the NDA. */
export type EbitdaAdjustment = {
  id: string;
  type: EbitdaAdjustmentType;
  amountCents: number;
  reason: string | null;
  /** Missing on rows saved before review: those stay approved. A new or edited row is pending until an admin accepts it. */
  status: AdjustmentStatus;
  documentId: string | null;
  documentName: string | null;
};

/** What the form posts per row. Status is not read: the server decides pending or approved. */
export type PostedAdjustment = {
  id: string | null;
  type: EbitdaAdjustmentType;
  amountCents: number;
  reason: string;
  documentId: string | null;
  documentName: string | null;
};

/** What the form posts per row: amount as Spanish euro text ("-12000" or "1500,50"). */
const rowSchema = z.object({
  id: z.string().trim().max(80).optional(),
  type: z.enum(ebitdaAdjustmentTypes),
  amount: z
    .string()
    .trim()
    .regex(/^-?\d{1,12}(,\d{1,2})?$/, "adjustment-amount"),
  reason: z.string().trim().min(3, "adjustment-reason").max(ebitdaAdjustmentReasonMax, "adjustment-reason"),
  documentId: z.string().trim().max(80).optional(),
  documentName: z.string().trim().max(180).optional(),
});

function centsOf(value: string): number {
  const negative = value.startsWith("-");
  const [whole = "0", fraction = ""] = (negative ? value.slice(1) : value).split(",");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  return negative ? -cents : cents;
}

function cleanDocumentName(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const name = value.replace(/[\r\n\u0000]/g, "").trim().slice(0, 180);
  return name.length > 0 ? name : null;
}

export type ParsedAdjustments = { ok: true; rows: PostedAdjustment[] } | { ok: false; code: string };

export type ParseEbitdaAdjustmentsOptions = {
  /** Latest closed-year sales; an adjustment larger than this is rejected. */
  revenueCents?: number | null;
};

/**
 * Parses the posted JSON list. Unknown keys (a client status, a forged total) are dropped; zero amounts are rejected
 * because they explain nothing. An amount larger than the year's sales is also rejected (typos of ~1 M € on a 5 M
 * company still pass; a 6 M € "sueldo" does not).
 */
export function parseEbitdaAdjustments(raw: string, options?: ParseEbitdaAdjustmentsOptions): ParsedAdjustments {
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
  const rows = parsed.data.map((row) => {
    const documentId = row.documentId && documentIdPattern.test(row.documentId) ? row.documentId : null;
    return {
      id: row.id && adjustmentIdPattern.test(row.id) ? row.id : null,
      type: row.type,
      amountCents: centsOf(row.amount),
      reason: row.reason,
      documentId,
      documentName: documentId ? cleanDocumentName(row.documentName) : null,
    };
  });
  if (rows.some((row) => row.amountCents === 0)) {
    return { ok: false, code: "adjustment-amount" };
  }
  if (rows.some((row) => adjustmentExceedsRevenue(row.amountCents, options?.revenueCents))) {
    return { ok: false, code: "adjustment-too-large" };
  }
  return { ok: true, rows };
}

/** Rows an admin has accepted. A stored row with no status was published before review and stays approved. */
export function approvedAdjustments(rows: readonly EbitdaAdjustment[]): EbitdaAdjustment[] {
  return rows.filter((row) => row.status === "approved");
}

/** Rows still waiting for Relify. They never change the published EBITDA. */
export function pendingAdjustments(rows: readonly EbitdaAdjustment[]): EbitdaAdjustment[] {
  return rows.filter((row) => row.status === "pending");
}

/**
 * Keeps approval only when the seller did not change the row. A new row, or a change of type, amount, reason, or
 * document, waits for an admin. The client cannot send "approved".
 */
export function mergePostedAdjustments(posted: readonly PostedAdjustment[], stored: readonly EbitdaAdjustment[]): EbitdaAdjustment[] {
  return posted.map((row) => {
    const previous = row.id ? stored.find((item) => item.id === row.id) : undefined;
    const unchanged =
      previous !== undefined &&
      previous.type === row.type &&
      previous.amountCents === row.amountCents &&
      (previous.reason ?? "") === row.reason &&
      (previous.documentId ?? null) === row.documentId;
    const id =
      previous && !previous.id.startsWith("legacy-")
        ? previous.id
        : row.id && documentIdPattern.test(row.id)
          ? row.id
          : crypto.randomUUID();
    return {
      id,
      type: row.type,
      amountCents: row.amountCents,
      reason: row.reason,
      status: unchanged && previous ? previous.status : "pending",
      documentId: row.documentId,
      documentName: row.documentId ? row.documentName : null,
    };
  });
}

export function sumEbitdaAdjustments(rows: readonly Pick<EbitdaAdjustment, "amountCents">[]): number {
  return rows.reduce((total, row) => total + row.amountCents, 0);
}

/** The only place the adjusted figure is derived: accounts EBITDA plus the listed adjustments. */
export function adjustedEbitdaCents(accountsEbitdaCents: number, rows: readonly Pick<EbitdaAdjustment, "amountCents">[]): number {
  return accountsEbitdaCents + sumEbitdaAdjustments(rows);
}

/** True when |amount| is larger than that year's sales (a 1 € company cannot have a 2 € "sueldo" adjustment). */
export function adjustmentExceedsRevenue(amountCents: number, revenueCents: number | null | undefined): boolean {
  return revenueCents !== null && revenueCents !== undefined && revenueCents > 0 && Math.abs(amountCents) > revenueCents;
}

export type PublishedEbitda = {
  ebitdaCents: number;
  adjustedEbitdaCents: number;
  hasApproved: boolean;
  hasPending: boolean;
};

/**
 * Headline EBITDA: accounts figure plus approved rows only. Pending / oversized rows never change it.
 * When a list exists, the stored `adjustedEbitdaCents` column is ignored (it can be 0 after a pending-only save
 * against a 0 project.ebitdaCents). Legacy "declared number, no list" still uses that column.
 */
export function publishedEbitdaFromAdjustments(
  accountsEbitdaCents: number,
  rows: EbitdaAdjustment[] | null,
  legacyAdjustedCents: number,
  revenueCents?: number | null,
): PublishedEbitda {
  if (rows === null) {
    const hasLegacy = legacyAdjustedCents !== 0;
    return {
      ebitdaCents: accountsEbitdaCents,
      adjustedEbitdaCents: hasLegacy ? legacyAdjustedCents : accountsEbitdaCents,
      hasApproved: hasLegacy,
      hasPending: false,
    };
  }
  const approved = approvedAdjustments(rows).filter((row) => !adjustmentExceedsRevenue(row.amountCents, revenueCents));
  return {
    ebitdaCents: accountsEbitdaCents,
    adjustedEbitdaCents: approved.length > 0 ? adjustedEbitdaCents(accountsEbitdaCents, approved) : accountsEbitdaCents,
    hasApproved: approved.length > 0,
    hasPending: pendingAdjustments(rows).length > 0,
  };
}

/** Reads the stored JSON column defensively (null = the seller never used the list: legacy declared number). */
export function storedEbitdaAdjustments(value: unknown): EbitdaAdjustment[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const row = item as Record<string, unknown>;
    const type = ebitdaAdjustmentTypes.find((known) => known === row.type);
    const amount = typeof row.amountCents === "number" && Number.isFinite(row.amountCents) ? Math.trunc(row.amountCents) : null;
    if (!type || amount === null) {
      return [];
    }
    const documentId = typeof row.documentId === "string" && documentIdPattern.test(row.documentId) ? row.documentId : null;
    return [
      {
        id: typeof row.id === "string" && adjustmentIdPattern.test(row.id) ? row.id : `legacy-${index}`,
        type,
        amountCents: amount,
        reason: typeof row.reason === "string" ? row.reason : null,
        status: row.status === "pending" ? "pending" : "approved",
        documentId,
        documentName: documentId && typeof row.documentName === "string" ? cleanDocumentName(row.documentName) : null,
      },
    ];
  });
}

/**
 * A buyer never sees a row still waiting for Relify, and never sees the supporting document.
 * Before the NDA the reason is dropped too: it is free seller text and may identify the company.
 * When nothing has to be hidden, the same array is returned so an unchanged profile stays unchanged.
 */
export function adjustmentsForBuyer(rows: EbitdaAdjustment[] | null, ndaSigned: boolean): EbitdaAdjustment[] | null {
  if (!rows) {
    return rows;
  }
  const visible = rows.filter((row) => row.status !== "pending");
  const hideDocument = visible.some((row) => row.documentId != null || row.documentName != null);
  if (visible.length === rows.length && !hideDocument && ndaSigned) {
    return rows;
  }
  if (visible.length === 0) {
    return null;
  }
  return visible.map((row) => ({
    ...row,
    reason: ndaSigned ? row.reason : null,
    documentId: null,
    documentName: null,
  }));
}

/** Editable row as the seller form holds it (amount as typed euro text). */
export type EbitdaAdjustmentFormRow = {
  id: string;
  type: EbitdaAdjustmentType;
  amount: string;
  reason: string;
  status: AdjustmentStatus;
  documentId: string;
  documentName: string;
};

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
    rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: centsToAdjustmentAmount(row.amountCents),
      reason: row.reason ?? "",
      status: row.status,
      documentId: row.documentId ?? "",
      documentName: row.documentName ?? "",
    })),
  );
}

/** Editable rows → the hidden JSON the form posts and the seller preview reads. Status must stay on the wire or a pending row is treated as approved. */
export function formRowsToJson(rows: readonly EbitdaAdjustmentFormRow[]): string {
  return JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: row.amount.trim().replace(/[.\s]/g, ""),
      reason: row.reason.trim(),
      status: row.status,
      documentId: row.documentId,
      documentName: row.documentName,
    })),
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
      const documentId = typeof row.documentId === "string" ? row.documentId : "";
      return [
        {
          id: typeof row.id === "string" ? row.id : "",
          type,
          amount: typeof row.amount === "string" ? row.amount : "",
          reason: typeof row.reason === "string" ? row.reason : "",
          status: row.status === "pending" ? "pending" : "approved",
          documentId,
          documentName: typeof row.documentName === "string" ? row.documentName : "",
        },
      ];
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

export type AdjustmentRowErrorOptions = { revenueCents?: number | null };

export function adjustmentRowErrors(
  row: { type?: string; amount: string; reason: string },
  options?: AdjustmentRowErrorOptions,
): AdjustmentRowErrors {
  const errors: AdjustmentRowErrors = {};
  const cents = formRowAmountCents(row.amount);
  if (row.amount.trim() === "" || cents === null) {
    errors.amount = "Indica un importe, p. ej. 12000.";
  } else if (cents === 0) {
    errors.amount = "El importe no puede ser 0.";
  } else if (adjustmentExceedsRevenue(cents, options?.revenueCents)) {
    errors.amount = "El importe no puede superar la facturación del ejercicio.";
  }
  const reason = row.reason.trim().length;
  if (reason < 3) {
    errors.reason = "Justifica el ajuste (mínimo 3 caracteres).";
  } else if (reason > ebitdaAdjustmentReasonMax) {
    errors.reason = `Máximo ${ebitdaAdjustmentReasonMax} caracteres.`;
  }
  return errors;
}

export function adjustmentRowsValid(
  rows: readonly { type?: string; amount: string; reason: string }[],
  options?: AdjustmentRowErrorOptions,
): boolean {
  return rows.every((row) => Object.keys(adjustmentRowErrors(row, options)).length === 0);
}
