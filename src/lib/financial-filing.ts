import { z } from "zod";

/** Seller-supplied financials from the Modelo 200 (or cuentas anuales / XBRL), per fiscal year. */

export const filingByteLimit = 8 * 1024 * 1024;
export const filingYearsShown = 3;

export type FilingKind = "modelo200" | "cuentas" | "xbrl";
export type FilingStatus = "uploaded" | "extracted" | "failed" | "confirmed";
export type Confidence = "alta" | "media" | "baja";

export const pnlFilingKeys = [
  "sales",
  "supplies",
  "staffCosts",
  "amortization",
  "operatingResult",
  "financialResult",
  "profitBeforeTax",
  "netResult",
] as const;

export const balanceFilingKeys = [
  "nonCurrentAssets",
  "currentAssets",
  "inventory",
  "receivables",
  "cash",
  "equity",
  "longTermDebt",
  "shortTermDebt",
  "suppliers",
] as const;

export const filingAmountKeys = [...pnlFilingKeys, ...balanceFilingKeys] as const;
export type FilingAmountKey = (typeof filingAmountKeys)[number];

/** Costs are shown and typed as positive amounts; they are stored with a negative sign. */
export const filingCostKeys = new Set<FilingAmountKey>(["supplies", "staffCosts", "amortization"]);

export const filingLabels: Record<FilingAmountKey, string> = {
  sales: "Cifra de negocios",
  supplies: "Aprovisionamientos",
  staffCosts: "Gastos de personal",
  amortization: "Amortizaciones",
  operatingResult: "Resultado de explotación",
  financialResult: "Resultado financiero",
  profitBeforeTax: "Resultado antes de impuestos",
  netResult: "Resultado del ejercicio",
  nonCurrentAssets: "Activo no corriente",
  currentAssets: "Activo corriente",
  inventory: "Existencias",
  receivables: "Clientes",
  cash: "Tesorería",
  equity: "Patrimonio neto",
  longTermDebt: "Deuda a largo plazo",
  shortTermDebt: "Deuda a corto plazo",
  suppliers: "Proveedores",
};

export type FilingField = { value: number | null; confidence: Confidence };

export type FilingExtraction = {
  /** Fiscal year the document says it covers, when it says so. */
  documentYear: number | null;
  amounts: Partial<Record<FilingAmountKey, FilingField>>;
  cnae: { value: string | null; confidence: Confidence };
  averageHeadcount: { value: number | null; confidence: Confidence };
  method: "xbrl" | "casillas" | "ia" | "casillas+ia" | "manual";
};

export function emptyExtraction(method: FilingExtraction["method"] = "manual"): FilingExtraction {
  return {
    documentYear: null,
    amounts: {},
    cnae: { value: null, confidence: "baja" },
    averageHeadcount: { value: null, confidence: "baja" },
    method,
  };
}

export function filingYears(today: Date): number[] {
  // Modelo 200 of year N is filed in July N+1: until then the latest closed year may not be filed yet.
  const latest = today.getUTCFullYear() - 1;
  return Array.from({ length: filingYearsShown }, (_, index) => latest - index);
}

export function filingKind(bytes: Uint8Array, fileName: string): FilingKind | null {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  const lower = fileName.toLowerCase();

  if (head.startsWith("%PDF-")) {
    return /cuentas|balance|ccaa|deposito|depósito/.test(lower) ? "cuentas" : "modelo200";
  }

  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return "xbrl";
  }

  if (/^\uFEFF?\s*</.test(head) && /xbrl|<\?xml/i.test(head)) {
    return "xbrl";
  }

  return null;
}

export const filingMimeTypes: Record<FilingKind, string> = {
  modelo200: "application/pdf",
  cuentas: "application/pdf",
  xbrl: "application/xml",
};

const euro = z
  .string()
  .trim()
  .max(24)
  .transform((value, context) => {
    if (value === "") {
      return null;
    }

    const parsed = parseEuroInput(value);

    if (parsed === null) {
      context.addIssue({ code: "custom", message: "invalid" });
      return z.NEVER;
    }

    return parsed;
  });

export const confirmFilingSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  amounts: z.object(Object.fromEntries(filingAmountKeys.map((key) => [key, euro])) as Record<FilingAmountKey, typeof euro>),
  cnae: z
    .string()
    .trim()
    .regex(/^(\d{4})?$/),
  averageHeadcount: z
    .string()
    .trim()
    .max(8)
    .transform((value, context) => {
      if (value === "") {
        return null;
      }

      const parsed = Number(value.replace(",", "."));

      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100000) {
        context.addIssue({ code: "custom", message: "invalid" });
        return z.NEVER;
      }

      return parsed;
    }),
});

export type ConfirmFilingInput = z.infer<typeof confirmFilingSchema>;

/** "1.234.567,89", "1234567.89", "-12.000" or "(12.000)" → euros. */
export function parseEuroInput(raw: string): number | null {
  let text = raw.replace(/[€\s]/g, "");
  let negative = false;

  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }

  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  }

  if (!/^[\d.,]+$/.test(text) || !/\d/.test(text)) {
    return null;
  }

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  let normalized: string;

  if (lastComma > lastDot) {
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > -1 && text.length - lastDot - 1 === 3 && (text.match(/\./g)?.length ?? 0) >= 1 && lastComma === -1) {
    // "12.000" is twelve thousand in Spanish documents.
    normalized = text.replace(/\./g, "");
  } else {
    normalized = text.replace(/,/g, "");
  }

  const value = Number(normalized);

  if (!Number.isFinite(value) || Math.abs(value) > 1e12) {
    return null;
  }

  return Math.round((negative ? -value : value) * 100) / 100;
}

export function formatEuroInput(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, useGrouping: true }).format(value);
}

/** Stored cents (costs negative) from a confirmed euro amount (costs positive). */
export function storedCents(key: FilingAmountKey, euros: number | null): number | null {
  if (euros === null) {
    return null;
  }

  const cents = Math.round(euros * 100);
  return filingCostKeys.has(key) ? -Math.abs(cents) : cents;
}

export type YearAmounts = Partial<Record<FilingAmountKey, number | null>>;

export type FinancialRatios = {
  ebitda: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  /** Deuda financiera / patrimonio neto. */
  leverage: number | null;
  netDebt: number | null;
  /** Activo corriente / (deuda a corto plazo + proveedores). */
  liquidity: number | null;
};

/** All amounts in euros, costs positive. */
export function yearRatios(amounts: YearAmounts): FinancialRatios {
  const sales = amounts.sales ?? null;
  const operating = amounts.operatingResult ?? null;
  const amortization = amounts.amortization ?? null;
  const ebitda = operating === null || amortization === null ? null : operating + Math.abs(amortization);
  const debt =
    amounts.longTermDebt === undefined && amounts.shortTermDebt === undefined
      ? null
      : (amounts.longTermDebt ?? 0) + (amounts.shortTermDebt ?? 0);
  const equity = amounts.equity ?? null;
  const shortSide =
    amounts.shortTermDebt === null || amounts.shortTermDebt === undefined
      ? null
      : amounts.shortTermDebt + (amounts.suppliers ?? 0);

  return {
    ebitda,
    ebitdaMargin: ebitda !== null && sales ? ebitda / sales : null,
    netMargin: amounts.netResult !== null && amounts.netResult !== undefined && sales ? amounts.netResult / sales : null,
    leverage: debt !== null && equity !== null && equity > 0 ? debt / equity : null,
    netDebt: debt === null ? null : debt - (amounts.cash ?? 0),
    liquidity:
      amounts.currentAssets !== null && amounts.currentAssets !== undefined && shortSide !== null && shortSide > 0
        ? amounts.currentAssets / shortSide
        : null,
  };
}

/** Compound annual growth of sales between the first and the last year given (sorted by year). */
export function salesGrowth(series: Array<{ year: number; sales: number | null }>): number | null {
  const known = series.filter((item) => item.sales !== null && item.sales > 0).sort((a, b) => a.year - b.year);
  const first = known[0];
  const last = known[known.length - 1];

  if (!first || !last || last.year === first.year) {
    return null;
  }

  return Math.pow((last.sales as number) / (first.sales as number), 1 / (last.year - first.year)) - 1;
}

/** Fields worth a second look: low confidence, missing, or not adding up. */
export function reviewFlags(amounts: YearAmounts, extraction: FilingExtraction | null): Set<FilingAmountKey> {
  const flags = new Set<FilingAmountKey>();

  for (const key of filingAmountKeys) {
    const field = extraction?.amounts[key];

    if (!field || field.value === null || field.confidence === "baja") {
      flags.add(key);
    }
  }

  const { operatingResult, financialResult, profitBeforeTax } = amounts;

  if (
    operatingResult !== null &&
    operatingResult !== undefined &&
    financialResult !== null &&
    financialResult !== undefined &&
    profitBeforeTax !== null &&
    profitBeforeTax !== undefined &&
    Math.abs(operatingResult + financialResult - profitBeforeTax) > 1
  ) {
    flags.add("profitBeforeTax");
  }

  return flags;
}

/**
 * Turn loose model output into a safe extraction. Anything that is not a finite number is dropped,
 * and costs are normalised to positive amounts.
 */
export function normaliseModelOutput(raw: unknown): Omit<FilingExtraction, "method"> {
  const result = emptyExtraction();
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fields = record.fields && typeof record.fields === "object" ? (record.fields as Record<string, unknown>) : {};

  for (const key of filingAmountKeys) {
    const field = fields[key];
    const value = field && typeof field === "object" ? (field as Record<string, unknown>).value : field;
    const confidence = field && typeof field === "object" ? (field as Record<string, unknown>).confidence : undefined;
    const number = typeof value === "number" ? value : typeof value === "string" ? parseEuroInput(value) : null;

    if (number !== null && Number.isFinite(number) && Math.abs(number) < 1e12) {
      result.amounts[key] = {
        value: filingCostKeys.has(key) ? Math.abs(number) : number,
        confidence: confidence === "alta" || confidence === "media" ? confidence : "baja",
      };
    }
  }

  const year = Number(record.year);
  result.documentYear = Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
  const cnae = typeof record.cnae === "string" ? record.cnae.replace(/\D/g, "").slice(0, 4) : "";
  result.cnae = { value: cnae.length === 4 ? cnae : null, confidence: cnae.length === 4 ? "media" : "baja" };
  const headcount = Number(record.averageHeadcount);
  result.averageHeadcount = {
    value: Number.isFinite(headcount) && headcount >= 0 && headcount < 100000 ? headcount : null,
    confidence: Number.isFinite(headcount) ? "media" : "baja",
  };
  return result;
}

/** Modelo 200 casillas we can read straight from the PDF text. Signs follow the form. */
export const modelo200Casillas: Record<string, FilingAmountKey> = {
  "00255": "sales",
  "00260": "supplies",
  "00270": "staffCosts",
  "00284": "amortization",
  "00296": "operatingResult",
};

/** Read "casilla importe" pairs from the text of a Modelo 200 PDF. */
export function readCasillas(text: string): Partial<Record<FilingAmountKey, FilingField>> {
  const found: Partial<Record<FilingAmountKey, FilingField>> = {};

  for (const [casilla, key] of Object.entries(modelo200Casillas)) {
    const match = new RegExp(`(?:^|\\D)${casilla}\\D{0,40}?(-?\\(?[\\d.]{1,15},\\d{2}\\)?)`).exec(text);
    const value = match?.[1] ? parseEuroInput(match[1]) : null;

    if (value !== null) {
      found[key] = { value: filingCostKeys.has(key) ? Math.abs(value) : value, confidence: "alta" };
    }
  }

  return found;
}

export function mergeExtractions(
  casillas: Partial<Record<FilingAmountKey, FilingField>>,
  model: Omit<FilingExtraction, "method"> | null,
): FilingExtraction {
  const base = model ?? emptyExtraction();
  const amounts: FilingExtraction["amounts"] = { ...base.amounts };

  for (const [key, field] of Object.entries(casillas) as Array<[FilingAmountKey, FilingField]>) {
    const other = amounts[key];
    const agree = other && other.value !== null && field.value !== null && Math.abs(other.value - field.value) <= 1;
    amounts[key] = other && !agree && other.value !== null ? { value: field.value, confidence: "baja" } : field;
  }

  const hasCasillas = Object.keys(casillas).length > 0;
  return {
    ...base,
    amounts,
    method: hasCasillas && model ? "casillas+ia" : hasCasillas ? "casillas" : model ? "ia" : "manual",
  };
}

export function extractionHasData(extraction: FilingExtraction): boolean {
  return Object.values(extraction.amounts).some((field) => field && field.value !== null);
}
