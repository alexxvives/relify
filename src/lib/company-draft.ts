import * as z from "zod";
import { companyCopy } from "./company-copy";
import {
  balanceInputKeys,
  defaultClosedYearNumbers,
  defaultForecastYearNumber,
  descriptionMaxLength,
  headcountRanges,
  isFoundedYear,
  isStatementYear,
  maxActivitySlices,
  maxSecondaryCnaes,
  parsePercentToBasisPoints,
  percentsSumToHundred,
  pnlInputKeys,
  type BalanceInputKey,
  type PnlInputKey,
} from "./company-profile";
import { isCnaeCode } from "./cnae-2009";

const unsignedEuroPattern = /^\d{1,12}(,\d{1,2})?$/;
const signedEuroPattern = /^-?\d{1,12}(,\d{1,2})?$/;

const euroText = z.string().trim().regex(unsignedEuroPattern, "euro");
const optionalEuroText = z.string().trim().refine((value) => value === "" || unsignedEuroPattern.test(value), "euro");
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
    description: z.string().trim().max(descriptionMaxLength, "description"),
    principalCnae: z.string().trim(),
    secondaryCnaes: z.array(z.string().trim()).max(maxSecondaryCnaes, "cnae-count"),
    revenue: euroText,
    ebitda: euroText,
    adjustedEbitda: euroText,
    askingPrice: euroText,
    opex: optionalEuroText,
    capitalPercents: z.array(z.string().trim()).max(maxActivitySlices, "percent-count"),
    productPercents: z.array(z.string().trim()).max(maxActivitySlices, "percent-count"),
    clientPercents: z.array(z.string().trim()).max(maxActivitySlices, "percent-count"),
    headcount: z.union([z.literal(""), z.enum(headcountRanges)]),
    closedYears: z.tuple([closedYearSchema, closedYearSchema, closedYearSchema]),
    forecastYear: forecastYearSchema,
  })
  .superRefine((input, ctx) => {
    validateCnaes(input.principalCnae, input.secondaryCnaes, ctx);
    validatePercents(input.capitalPercents, "capitalPercents", "percent-sum-capital", ctx);
    validatePercents(input.productPercents, "productPercents", "percent-sum-product", ctx);
    validatePercents(input.clientPercents, "clientPercents", "percent-sum-client", ctx);

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

export type CompanyDraftInput = z.infer<typeof companyDraftSchema>;
export type ClosedYearInput = CompanyDraftInput["closedYears"][number];
export type ForecastYearInput = CompanyDraftInput["forecastYear"];

const draftMessages = {
  codename: companyCopy.codenameRequired,
  region: companyCopy.regionRequired,
  euro: companyCopy.euroInvalid,
  "founded-year": companyCopy.foundedYearInvalid,
  description: companyCopy.descriptionInvalid,
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

export function emptyCompanyDraft(): CompanyDraftInput {
  const [first = "2023", second = "2024", third = "2025"] = defaultClosedYearNumbers;

  return {
    legalName: "",
    address: "",
    codename: "",
    region: "",
    foundedYear: "",
    description: "",
    principalCnae: "",
    secondaryCnaes: [],
    revenue: "",
    ebitda: "",
    adjustedEbitda: "",
    askingPrice: "",
    opex: "",
    capitalPercents: [],
    productPercents: [],
    clientPercents: [],
    headcount: "",
    closedYears: [emptyClosedYear(String(first)), emptyClosedYear(String(second)), emptyClosedYear(String(third))],
    forecastYear: emptyForecastYear(String(defaultForecastYearNumber)),
  };
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
