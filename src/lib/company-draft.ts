import { sellerFinancingInputSchema } from "./seller-financing";
import { sellerStayInputSchema } from "./seller-stay";
import * as z from "zod";
import { companyCopy } from "./company-copy";
import {
  askingPriceIncludesKinds,
  balanceInputKeys,
  descriptionMaxLength,
  descriptionMinLength,
  headcountRanges,
  isFoundedYear,
  isStatementYear,
  customerBases,
  maxActivitySlices,
  maxSecondaryCnaes,
  ownerDependenceLevels,
  parsePercentToBasisPoints,
  percentsSumToHundred,
  pnlInputKeys,
  premisesKinds,
  seasonalityLevels,
  statementWindow,
  type BalanceInputKey,
  type PnlInputKey,
} from "./company-profile";
import { isCnaeCode } from "./cnae-2009";

export const saleReasons = [
  "jubilacion",
  "relevo",
  "nuevo-proyecto",
  "salud",
  "separacion-socios",
  "concentracion",
  "liquidez",
  "mercado",
  "otro",
] as const;

export type SaleReason = (typeof saleReasons)[number];

export const saleReasonLabels: Record<SaleReason, string> = {
  jubilacion: "Jubilación",
  relevo: "Falta de relevo",
  "nuevo-proyecto": "Cambio de proyecto",
  salud: "Salud",
  "separacion-socios": "Socios que se separan",
  concentracion: "Concentración en otro negocio",
  liquidez: "Necesidad de liquidez",
  mercado: "Oportunidad de mercado",
  otro: "Otro",
};

const unsignedEuroPattern = /^\d{1,12}(,\d{1,2})?$/;
const signedEuroPattern = /^-?\d{1,12}(,\d{1,2})?$/;

const optionalEuroText = z.string().trim().refine((value) => value === "" || unsignedEuroPattern.test(value), "euro");
const optionalPctText = z
  .string()
  .trim()
  .refine((value) => value === "" || (/^\d{1,3}$/.test(value) && Number(value) >= 0 && Number(value) <= 100), "percent");
const optionalYearsText = z
  .string()
  .trim()
  .refine((value) => value === "" || (/^\d{1,2}$/.test(value) && Number(value) >= 0 && Number(value) <= 99), "lease-years");
const moneyText = z.string().trim();

const closedYearSchema = z.object({
  year: moneyText,
  sales: moneyText,
  inventoryChange: moneyText,
  ownUse: moneyText,
  supplies: moneyText,
  otherOperatingIncome: moneyText,
  staffCosts: moneyText,
  otherOperatingCosts: moneyText,
  grantIncome: moneyText,
  provisionSurplus: moneyText,
  assetImpairment: moneyText,
  subsidiaryControlLoss: moneyText,
  negativeDifference: moneyText,
  otherResults: moneyText,
  amortization: moneyText,
  currentAssets: moneyText,
  cash: moneyText,
  nonCurrentAssets: moneyText,
  currentLiabilities: moneyText,
  longTermDebt: moneyText,
  nonCurrentLiabilities: moneyText,
  shortTermDebt: moneyText,
  equity: moneyText,
});

const forecastYearSchema = z.object({
  year: moneyText,
  sales: moneyText,
  inventoryChange: moneyText,
  ownUse: moneyText,
  supplies: moneyText,
  otherOperatingIncome: moneyText,
  staffCosts: moneyText,
  otherOperatingCosts: moneyText,
  grantIncome: moneyText,
  provisionSurplus: moneyText,
  assetImpairment: moneyText,
  subsidiaryControlLoss: moneyText,
  negativeDifference: moneyText,
  otherResults: moneyText,
  amortization: moneyText,
});

export const companyDraftSchema = z
  .object({
    legalName: z.string().trim().max(160),
    address: z.string().trim().max(240),
    codename: z.string().trim().min(1, "codename").max(80, "codename"),
    region: z.string().trim().min(1, "region").max(80, "region"),
    foundedYear: z.string().trim().refine((value) => {
      if (value === "") {
        return true;
      }

      return /^\d{4}$/.test(value) && isFoundedYear(Number(value));
    }, "founded-year"),
    description: z
      .string()
      .trim()
      .max(descriptionMaxLength, "description")
      .refine((value) => value === "" || value.length >= descriptionMinLength, "description-short"),
    saleReason: z.union([z.literal(""), z.enum(saleReasons)]),
    principalCnae: z.string().trim(),
    secondaryCnaes: z.array(z.string().trim()).max(maxSecondaryCnaes, "cnae-count").transform(dropEmptyRows),
    revenue: optionalEuroText,
    ebitda: optionalEuroText,
    adjustedEbitda: optionalEuroText,
    ebitdaAdjustments: z.string().max(20000, "adjustment-format"),
    askingPrice: optionalEuroText,
    ...sellerFinancingInputSchema,
    ...sellerStayInputSchema,
    ownerDependence: z.union([z.literal(""), z.enum(ownerDependenceLevels)]),
    premisesKind: z.union([z.literal(""), z.enum(premisesKinds)]),
    rentMonthly: optionalEuroText,
    leaseYearsRemaining: optionalYearsText,
    recurringRevenuePct: optionalPctText,
    seasonality: z.union([z.literal(""), z.enum(seasonalityLevels)]),
    seasonalityNote: z.string().trim().max(280, "seasonality-note"),
    top5ClientsPct: optionalPctText,
    askingPriceIncludes: z.union([z.literal(""), z.enum(askingPriceIncludesKinds)]),
    opex: optionalEuroText,
    capitalPercents: z.array(z.string().trim()).max(maxActivitySlices, "percent-count").transform(dropEmptyRows),
    productPercents: z.array(z.string().trim()).max(maxActivitySlices, "percent-count").transform(dropEmptyRows),
    clientPercents: z.array(z.string().trim()).max(maxActivitySlices, "percent-count").transform(dropEmptyRows),
    customerBase: z.union([z.literal(""), z.enum(customerBases)]),
    headcount: z.union([z.literal(""), z.enum(headcountRanges)]),
    closedYears: z.tuple([closedYearSchema, closedYearSchema, closedYearSchema]),
    forecastYear: forecastYearSchema,
  })
  .superRefine((input, ctx) => {
    validateCnaes(input.principalCnae, input.secondaryCnaes, ctx);
    validatePercents(input.capitalPercents, "capitalPercents", "percent-sum-capital", ctx);
    validatePercents(input.productPercents, "productPercents", "percent-sum-product", ctx);
    // t78: drafts save partially; "Por qué se vende" is required for completion (seller progress), not to save.
    if (input.customerBase === "consumer") {
      const kept = input.clientPercents.map((value) => value.trim()).filter((value) => value.length > 0);
      if (kept.some((value) => parsePercentToBasisPoints(value) === null)) {
        ctx.addIssue({ code: "custom", message: "percent", path: ["clientPercents"] });
      }
    } else {
      validatePercents(input.clientPercents, "clientPercents", "percent-sum-client", ctx);
    }

    const years = [
      inspectYear(input.closedYears[0], true, ["closedYears", 0], ctx),
      inspectYear(input.closedYears[1], true, ["closedYears", 1], ctx),
      inspectYear(input.closedYears[2], true, ["closedYears", 2], ctx),
      inspectYear(input.forecastYear, false, ["forecastYear"], ctx),
    ].filter((year): year is number => year !== null);

    if (new Set(years).size !== years.length) {
      ctx.addIssue({ code: "custom", message: "duplicate-year", path: ["closedYears"] });
    }
  });

/** t85: a row added with "+" but never filled is not data; ignore it instead of failing the save. */
function dropEmptyRows(values: string[]): string[] {
  return values.filter((value) => value.length > 0);
}

export type CompanyDraftInput = z.infer<typeof companyDraftSchema>;
export type ClosedYearInput = CompanyDraftInput["closedYears"][number];
export type ForecastYearInput = CompanyDraftInput["forecastYear"];

const draftMessages = {
  codename: companyCopy.codenameRequired,
  "sale-reason": companyCopy.saleReasonRequired,
  region: companyCopy.regionRequired,
  euro: companyCopy.euroInvalid,
  "founded-year": companyCopy.foundedYearInvalid,
  description: companyCopy.descriptionInvalid,
  "description-short": companyCopy.descriptionTooShort,
  "lease-years": companyCopy.leaseYearsLabel,
  "seasonality-note": companyCopy.seasonalityNoteLabel,
  cnae: companyCopy.cnaeInvalid,
  "cnae-principal": companyCopy.cnaePrincipalRequired,
  "cnae-duplicate": companyCopy.cnaeDuplicate,
  "cnae-count": companyCopy.cnaeInvalid,
  percent: companyCopy.percentInvalid,
  "percent-count": companyCopy.percentCount,
  "percent-sum-capital": companyCopy.capitalPercentSum,
  "percent-sum-product": companyCopy.productPercentSum,
  "percent-sum-client": companyCopy.clientPercentSum,
  "signed-euro": companyCopy.euroInvalid,
  "statement-year": companyCopy.statementYearInvalid,
  "duplicate-year": companyCopy.duplicateYear,
  "adjustment-format": companyCopy.adjustmentsInvalid,
  "adjustment-amount": companyCopy.adjustmentsInvalid,
  "adjustment-reason": companyCopy.adjustmentsInvalid,
  "adjustment-count": companyCopy.adjustmentsCount,
  "seller-financing-pct": "Financiación del vendedor: indica un porcentaje entero entre 1 y 100.",
  "seller-financing-years": "Financiación del vendedor: elige el plazo.",
} as const;

export function companyDraftFieldMessage(error: z.ZodError): string {
  const code = error.issues[0]?.message;

  if (code && Object.hasOwn(draftMessages, code)) {
    return draftMessages[code as keyof typeof draftMessages];
  }

  return companyCopy.saveFailed;
}

export function eurosToCents(value: string): number {
  const negative = value.startsWith("-");
  const absolute = negative ? value.slice(1) : value;
  const [whole = "0", fraction = ""] = absolute.split(",");
  const cents = fraction.padEnd(2, "0").slice(0, 2);
  const amount = Number(whole) * 100 + Number(cents);
  return negative ? -amount : amount;
}

export function optionalEurosToCents(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  return eurosToCents(value);
}

export function optionalWholeNumber(value: string, min: number, max: number): number | null {
  const trimmed = value.trim();
  if (trimmed === "" || !/^\d+$/.test(trimmed)) {
    return null;
  }
  const amount = Number(trimmed);
  return amount >= min && amount <= max ? amount : null;
}

export function centsToEuroInput(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const whole = Math.trunc(absolute / 100);
  const fraction = absolute % 100;
  const body = fraction === 0 ? String(whole) : `${whole},${String(fraction).padStart(2, "0")}`;
  return negative ? `-${body}` : body;
}

export function projectSlug(codename: string): string {
  const slug = codename
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug.length > 0 ? slug : "proyecto";
}

export function emptyClosedYear(year: string): ClosedYearInput {
  return {
    year,
    sales: "",
    inventoryChange: "",
    ownUse: "",
    supplies: "",
    otherOperatingIncome: "",
    staffCosts: "",
    otherOperatingCosts: "",
    grantIncome: "",
    provisionSurplus: "",
    assetImpairment: "",
    subsidiaryControlLoss: "",
    negativeDifference: "",
    otherResults: "",
    amortization: "",
    currentAssets: "",
    cash: "",
    nonCurrentAssets: "",
    currentLiabilities: "",
    longTermDebt: "",
    nonCurrentLiabilities: "",
    shortTermDebt: "",
    equity: "",
  };
}

export function emptyForecastYear(year: string): ForecastYearInput {
  return {
    year,
    sales: "",
    inventoryChange: "",
    ownUse: "",
    supplies: "",
    otherOperatingIncome: "",
    staffCosts: "",
    otherOperatingCosts: "",
    grantIncome: "",
    provisionSurplus: "",
    assetImpairment: "",
    subsidiaryControlLoss: "",
    negativeDifference: "",
    otherResults: "",
    amortization: "",
  };
}

export function emptyCompanyDraft(today = new Date()): CompanyDraftInput {
  const window = statementWindow(today);
  const [first, second, third] = window.closed;

  return {
    legalName: "",
    address: "",
    codename: "",
    region: "",
    foundedYear: "",
    description: "",
    saleReason: "",
    principalCnae: "",
    secondaryCnaes: [],
    revenue: "",
    ebitda: "",
    adjustedEbitda: "",
    ebitdaAdjustments: "",
    askingPrice: "",
    sellerFinancing: "",
    sellerFinancingPct: "",
    sellerFinancingYears: "",
    sellerStay: "",
    ownerDependence: "",
    premisesKind: "",
    rentMonthly: "",
    leaseYearsRemaining: "",
    recurringRevenuePct: "",
    seasonality: "",
    seasonalityNote: "",
    top5ClientsPct: "",
    askingPriceIncludes: "",
    opex: "",
    capitalPercents: [],
    productPercents: [],
    clientPercents: [],
    customerBase: "",
    headcount: "",
    closedYears: [emptyClosedYear(String(first)), emptyClosedYear(String(second)), emptyClosedYear(String(third))],
    forecastYear: emptyForecastYear(String(window.forecast)),
  };
}

export function placeStatementsOnWindow(
  closed: ClosedYearInput[],
  forecast: ForecastYearInput | null,
  today = new Date(),
): { closedYears: CompanyDraftInput["closedYears"]; forecastYear: ForecastYearInput } {
  const window = statementWindow(today);
  const byYear = new Map<string, ClosedYearInput | ForecastYearInput>();

  for (const year of closed) {
    if (/^\d{4}$/.test(year.year)) {
      byYear.set(year.year, year);
    }
  }

  if (forecast && /^\d{4}$/.test(forecast.year)) {
    byYear.set(forecast.year, forecast);
  }

  const [first, second, third] = window.closed;

  return {
    closedYears: [
      copyOntoClosed(byYear.get(String(first)), String(first)),
      copyOntoClosed(byYear.get(String(second)), String(second)),
      copyOntoClosed(byYear.get(String(third)), String(third)),
    ],
    forecastYear: copyOntoForecast(byYear.get(String(window.forecast)), String(window.forecast)),
  };
}

function copyOntoClosed(source: ClosedYearInput | ForecastYearInput | undefined, year: string): ClosedYearInput {
  const next = emptyClosedYear(year);

  if (!source) {
    return next;
  }

  for (const key of pnlInputKeys) {
    next[key] = source[key];
  }

  if ("currentAssets" in source) {
    for (const key of balanceInputKeys) {
      next[key] = source[key];
    }
  }

  return next;
}

function copyOntoForecast(source: ClosedYearInput | ForecastYearInput | undefined, year: string): ForecastYearInput {
  const next = emptyForecastYear(year);

  if (!source) {
    return next;
  }

  for (const key of pnlInputKeys) {
    next[key] = source[key];
  }

  return next;
}

export function closedFieldName(index: number, key: keyof ClosedYearInput): string {
  return `closed${index}_${key}`;
}

export function forecastFieldName(key: keyof ForecastYearInput): string {
  return `forecast_${key}`;
}

export function closedYearIsActive(year: ClosedYearInput): boolean {
  return [...pnlInputKeys, ...balanceInputKeys].some((key) => year[key].trim() !== "");
}

export function forecastYearIsActive(year: ForecastYearInput): boolean {
  return pnlInputKeys.some((key) => year[key].trim() !== "");
}

function moneyKeys(includeBalance: boolean): Array<PnlInputKey | BalanceInputKey> {
  return includeBalance ? [...pnlInputKeys, ...balanceInputKeys] : [...pnlInputKeys];
}

function validateCnaes(
  principal: string,
  secondary: string[],
  ctx: z.RefinementCtx,
): void {
  if (principal !== "" && !isCnaeCode(principal)) {
    ctx.addIssue({ code: "custom", message: "cnae", path: ["principalCnae"] });
  }

  if (secondary.length > 0 && principal === "") {
    ctx.addIssue({ code: "custom", message: "cnae-principal", path: ["secondaryCnaes"] });
  }

  const codes = [principal, ...secondary].filter((code) => code !== "");

  if (new Set(codes).size !== codes.length) {
    ctx.addIssue({ code: "custom", message: "cnae-duplicate", path: ["secondaryCnaes"] });
  }

  if (secondary.some((code) => !isCnaeCode(code))) {
    ctx.addIssue({ code: "custom", message: "cnae", path: ["secondaryCnaes"] });
  }
}

function validatePercents(
  values: string[],
  path: "capitalPercents" | "productPercents" | "clientPercents",
  sumCode: "percent-sum-capital" | "percent-sum-product" | "percent-sum-client",
  ctx: z.RefinementCtx,
): void {
  if (values.length === 0) {
    return;
  }

  const basisPoints = values.map((value) => parsePercentToBasisPoints(value));

  if (basisPoints.some((value) => value === null)) {
    ctx.addIssue({ code: "custom", message: "percent", path: [path] });
    return;
  }

  const parsed = basisPoints.filter((value): value is number => value !== null);

  if (!percentsSumToHundred(parsed)) {
    ctx.addIssue({ code: "custom", message: sumCode, path: [path] });
  }
}

function readYearField(year: ClosedYearInput | ForecastYearInput, key: string): string {
  if (!Object.hasOwn(year, key)) {
    return "";
  }

  const value = Reflect.get(year, key);
  return typeof value === "string" ? value : "";
}

function inspectYear(
  year: ClosedYearInput | ForecastYearInput,
  includeBalance: boolean,
  path: Array<string | number>,
  ctx: z.RefinementCtx,
): number | null {
  const keys = moneyKeys(includeBalance);
  const active = keys.some((key) => readYearField(year, key).trim() !== "");

  if (!active) {
    return null;
  }

  let validMoney = true;

  for (const key of keys) {
    const value = readYearField(year, key).trim();

    if (value !== "" && !signedEuroPattern.test(value)) {
      validMoney = false;
      ctx.addIssue({ code: "custom", message: "signed-euro", path: [...path, key] });
    }
  }

  if (!/^\d{4}$/.test(year.year) || !isStatementYear(Number(year.year))) {
    ctx.addIssue({ code: "custom", message: "statement-year", path: [...path, "year"] });
    return null;
  }

  return validMoney ? Number(year.year) : null;
}
