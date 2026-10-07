import { draftFromRegistry, type RegistryCompany } from "@/lib/company-registry";
import { basisPointsToPercentInput } from "@/lib/company-profile";
import {
  centsToEuroInput,
  placeStatementsOnWindow,
  type ClosedYearInput,
  type CompanyDraftInput,
  type ForecastYearInput,
} from "@/lib/company-draft";
import { isCustomerBase, isHeadcountRange } from "@/lib/company-profile";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";

const yearSelect = {
  year: true,
  kind: true,
  salesCents: true,
  inventoryChangeCents: true,
  ownUseCents: true,
  suppliesCents: true,
  otherOperatingIncomeCents: true,
  staffCostsCents: true,
  otherOperatingCostsCents: true,
  grantIncomeCents: true,
  provisionSurplusCents: true,
  assetImpairmentCents: true,
  subsidiaryControlLossCents: true,
  negativeDifferenceCents: true,
  otherResultsCents: true,
  amortizationCents: true,
  currentAssetsCents: true,
  cashCents: true,
  nonCurrentAssetsCents: true,
  currentLiabilitiesCents: true,
  longTermDebtCents: true,
  nonCurrentLiabilitiesCents: true,
  shortTermDebtCents: true,
  equityCents: true,
} as const;

type StoredYear = {
  year: number;
  kind: "closed" | "forecast";
  salesCents: number | null;
  inventoryChangeCents: number | null;
  ownUseCents: number | null;
  suppliesCents: number | null;
  otherOperatingIncomeCents: number | null;
  staffCostsCents: number | null;
  otherOperatingCostsCents: number | null;
  grantIncomeCents: number | null;
  provisionSurplusCents: number | null;
  assetImpairmentCents: number | null;
  subsidiaryControlLossCents: number | null;
  negativeDifferenceCents: number | null;
  otherResultsCents: number | null;
  amortizationCents: number | null;
  currentAssetsCents: number | null;
  cashCents: number | null;
  nonCurrentAssetsCents: number | null;
  currentLiabilitiesCents: number | null;
  longTermDebtCents: number | null;
  nonCurrentLiabilitiesCents: number | null;
  shortTermDebtCents: number | null;
  equityCents: number | null;
};

function registryFromPrefill(prefill: {
  cif: string;
  legalName: string;
  address: string;
  region: string;
  codename: string;
  foundedYear: number | null;
  description: string | null;
  principalCnae: string | null;
  secondaryCnaes: string[];
  revenueCents: number | null;
  ebitdaCents: number | null;
  adjustedEbitdaCents: number | null;
  headcountRange: string | null;
  statementYear: number | null;
}): RegistryCompany {
  return {
    cif: prefill.cif,
    legalName: prefill.legalName,
    address: prefill.address,
    region: prefill.region,
    codename: prefill.codename,
    foundedYear: prefill.foundedYear,
    description: prefill.description ?? "",
    principalCnae: prefill.principalCnae ?? "",
    secondaryCnaes: prefill.secondaryCnaes,
    headcount: prefill.headcountRange && isHeadcountRange(prefill.headcountRange) ? prefill.headcountRange : null,
    revenueCents: prefill.revenueCents,
    ebitdaCents: prefill.ebitdaCents,
    adjustedEbitdaCents: prefill.adjustedEbitdaCents,
    statementYear: prefill.statementYear,
  };
}

function money(cents: number | null): string {
  return cents === null ? "" : centsToEuroInput(cents);
}

function toForecast(year: StoredYear): ForecastYearInput {
  return {
    year: String(year.year),
    sales: money(year.salesCents),
    inventoryChange: money(year.inventoryChangeCents),
    ownUse: money(year.ownUseCents),
    supplies: money(year.suppliesCents),
    otherOperatingIncome: money(year.otherOperatingIncomeCents),
    staffCosts: money(year.staffCostsCents),
    otherOperatingCosts: money(year.otherOperatingCostsCents),
    grantIncome: money(year.grantIncomeCents),
    provisionSurplus: money(year.provisionSurplusCents),
    assetImpairment: money(year.assetImpairmentCents),
    subsidiaryControlLoss: money(year.subsidiaryControlLossCents),
    negativeDifference: money(year.negativeDifferenceCents),
    otherResults: money(year.otherResultsCents),
    amortization: money(year.amortizationCents),
  };
}

function toClosed(year: StoredYear): ClosedYearInput {
  return {
    ...toForecast(year),
    currentAssets: money(year.currentAssetsCents),
    cash: money(year.cashCents),
    nonCurrentAssets: money(year.nonCurrentAssetsCents),
    currentLiabilities: money(year.currentLiabilitiesCents),
    longTermDebt: money(year.longTermDebtCents),
    nonCurrentLiabilities: money(year.nonCurrentLiabilitiesCents),
    shortTermDebt: money(year.shortTermDebtCents),
    equity: money(year.equityCents),
  };
}

export async function getCompanyDraft(user: CurrentUser): Promise<CompanyDraftInput | null> {
  if (user.role !== "seller") {
    return null;
  }

  const activeId = await activeSellerProjectId(user.id);
  const [draft, prefill] = await Promise.all([
    activeId
      ? prisma.project.findFirst({
    where: { id: activeId, ownerId: user.id },
    select: {
      cif: true,
      legalName: true,
      address: true,
      codename: true,
      region: true,
      foundedYear: true,
      description: true,
      revenueCents: true,
      ebitdaCents: true,
      adjustedEbitdaCents: true,
      askingPriceCents: true,
      opexCents: true,
      headcountRange: true,
      customerBase: true,
      cnaes: { select: { code: true, role: true, position: true } },
      activitySlices: { select: { kind: true, position: true, basisPoints: true } },
      years: { select: yearSelect },
    },
  })
      : null,
    prisma.companyRegistryPrefill.findUnique({ where: { userId: user.id } }),
  ]);

  if (!draft) {
    if (!prefill) {
      return null;
    }

    return draftFromRegistry(registryFromPrefill(prefill));
  }

  const principal = draft.cnaes.find((cnae) => cnae.role === "principal");
  const secondary = draft.cnaes
    .filter((cnae) => cnae.role === "secondary")
    .sort((left, right) => left.position - right.position)
    .map((cnae) => cnae.code);
  const percents = (kind: "capital" | "product" | "client") =>
    draft.activitySlices
      .filter((slice) => slice.kind === kind)
      .sort((left, right) => left.position - right.position)
      .map((slice) => basisPointsToPercentInput(slice.basisPoints));
  const closed = draft.years
    .filter((year) => year.kind === "closed")
    .sort((left, right) => left.year - right.year)
    .map(toClosed);
  const forecast = draft.years.find((year) => year.kind === "forecast");
  const placed = placeStatementsOnWindow(closed, forecast ? toForecast(forecast) : null);
  const result: CompanyDraftInput = {
    legalName: draft.legalName,
    address: draft.address,
    codename: draft.codename,
    region: draft.region,
    foundedYear: draft.foundedYear === null ? "" : String(draft.foundedYear),
    description: draft.description ?? "",
    principalCnae: principal?.code ?? "",
    secondaryCnaes: secondary,
    revenue: centsToEuroInput(draft.revenueCents),
    ebitda: centsToEuroInput(draft.ebitdaCents),
    adjustedEbitda: centsToEuroInput(draft.adjustedEbitdaCents),
    askingPrice: centsToEuroInput(draft.askingPriceCents),
    opex: money(draft.opexCents),
    capitalPercents: percents("capital"),
    productPercents: percents("product"),
    clientPercents: percents("client"),
    customerBase: draft.customerBase && isCustomerBase(draft.customerBase) ? draft.customerBase : "",
    headcount: draft.headcountRange && isHeadcountRange(draft.headcountRange) ? draft.headcountRange : "",
    closedYears: placed.closedYears,
    forecastYear: placed.forecastYear,
  };

  if (draft.legalName.trim().length === 0 && prefill && prefill.cif === draft.cif) {
    const filled = draftFromRegistry(registryFromPrefill(prefill));
    return {
      ...result,
      legalName: filled.legalName,
      address: filled.address,
      codename: filled.codename,
      region: filled.region,
      foundedYear: filled.foundedYear,
      description: filled.description,
      principalCnae: filled.principalCnae,
      secondaryCnaes: filled.secondaryCnaes,
      revenue: filled.revenue.length > 0 ? filled.revenue : result.revenue,
      ebitda: filled.ebitda.length > 0 ? filled.ebitda : result.ebitda,
      adjustedEbitda: filled.adjustedEbitda.length > 0 ? filled.adjustedEbitda : result.adjustedEbitda,
      headcount: filled.headcount,
      closedYears: filled.closedYears,
      forecastYear: filled.forecastYear,
    };
  }

  return result;
}
