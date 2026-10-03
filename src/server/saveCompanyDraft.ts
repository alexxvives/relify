import { randomUUID } from "node:crypto";
import { companyCopy } from "@/lib/company-copy";
import {
  closedYearIsActive,
  eurosToCents,
  forecastYearIsActive,
  optionalEurosToCents,
  projectSlug,
  type ClosedYearInput,
  type CompanyDraftInput,
  type ForecastYearInput,
} from "@/lib/company-draft";
import { descriptionContainsSecret, parsePercentToBasisPoints, type SliceKind } from "@/lib/company-profile";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";

export type SaveCompanyDraftResult = { ok: true } | { ok: false; message: string };

async function unusedSlug(codename: string): Promise<string> {
  const base = projectSlug(codename);
  let slug = base;
  let suffix = 2;

  while (await prisma.project.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function basisPointsFor(values: string[]): number[] | null {
  const parsed = values.map((value) => parsePercentToBasisPoints(value));

  if (parsed.some((value) => value === null)) {
    return null;
  }

  return parsed.filter((value): value is number => value !== null);
}

function sliceData(projectId: string, kind: SliceKind, basisPoints: number[]) {
  return basisPoints.map((points, index) => ({
    id: randomUUID(),
    projectId,
    kind,
    position: index + 1,
    basisPoints: points,
  }));
}

function pnlData(year: ForecastYearInput | ClosedYearInput) {
  return {
    salesCents: optionalEurosToCents(year.sales),
    inventoryChangeCents: optionalEurosToCents(year.inventoryChange),
    ownUseCents: optionalEurosToCents(year.ownUse),
    suppliesCents: optionalEurosToCents(year.supplies),
    otherOperatingIncomeCents: optionalEurosToCents(year.otherOperatingIncome),
    staffCostsCents: optionalEurosToCents(year.staffCosts),
    otherOperatingCostsCents: optionalEurosToCents(year.otherOperatingCosts),
    grantIncomeCents: optionalEurosToCents(year.grantIncome),
    provisionSurplusCents: optionalEurosToCents(year.provisionSurplus),
    assetImpairmentCents: optionalEurosToCents(year.assetImpairment),
    subsidiaryControlLossCents: optionalEurosToCents(year.subsidiaryControlLoss),
    negativeDifferenceCents: optionalEurosToCents(year.negativeDifference),
    otherResultsCents: optionalEurosToCents(year.otherResults),
    amortizationCents: optionalEurosToCents(year.amortization),
  };
}

function balanceData(year: ClosedYearInput) {
  return {
    currentAssetsCents: optionalEurosToCents(year.currentAssets),
    cashCents: optionalEurosToCents(year.cash),
    nonCurrentAssetsCents: optionalEurosToCents(year.nonCurrentAssets),
    currentLiabilitiesCents: optionalEurosToCents(year.currentLiabilities),
    longTermDebtCents: optionalEurosToCents(year.longTermDebt),
    nonCurrentLiabilitiesCents: optionalEurosToCents(year.nonCurrentLiabilities),
    shortTermDebtCents: optionalEurosToCents(year.shortTermDebt),
    equityCents: optionalEurosToCents(year.equity),
  };
}

const emptyBalance = {
  currentAssetsCents: null,
  cashCents: null,
  nonCurrentAssetsCents: null,
  currentLiabilitiesCents: null,
  longTermDebtCents: null,
  nonCurrentLiabilitiesCents: null,
  shortTermDebtCents: null,
  equityCents: null,
};

export async function saveCompanyDraft(
  user: CurrentUser,
  input: CompanyDraftInput,
): Promise<SaveCompanyDraftResult> {
  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, message: companyCopy.notSeller };
  }

  const capital = basisPointsFor(input.capitalPercents);
  const products = basisPointsFor(input.productPercents);
  const clients = basisPointsFor(input.clientPercents);

  if (!capital || !products || !clients) {
    return { ok: false, message: companyCopy.percentInvalid };
  }

  const [existing, account] = await Promise.all([
    prisma.project.findFirst({
      where: { ownerId: user.id, status: "draft" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        legalName: true,
        cif: true,
        address: true,
        shareholders: { select: { name: true } },
        dataRoomFiles: { select: { fileName: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { pendingCif: true } }),
  ]);
  const pendingCif = account?.pendingCif?.trim() ?? "";
  const keptCif = existing && existing.cif.trim().length > 0 ? existing.cif : pendingCif;

  const secrets = [
    input.legalName,
    input.address,
    keptCif,
    existing?.legalName ?? "",
    existing?.cif ?? "",
    existing?.address ?? "",
    ...(existing?.shareholders.map((shareholder) => shareholder.name) ?? []),
    ...(existing?.dataRoomFiles.map((file) => file.fileName) ?? []),
  ];

  if (input.description !== "" && descriptionContainsSecret(input.description, secrets)) {
    return { ok: false, message: companyCopy.descriptionPrivate };
  }

  const profile = {
    legalName: input.legalName,
    address: input.address,
    codename: input.codename,
    region: input.region,
    revenueCents: eurosToCents(input.revenue),
    ebitdaCents: eurosToCents(input.ebitda),
    adjustedEbitdaCents: eurosToCents(input.adjustedEbitda),
    askingPriceCents: eurosToCents(input.askingPrice),
    foundedYear: input.foundedYear === "" ? null : Number(input.foundedYear),
    description: input.description === "" ? null : input.description,
    opexCents: optionalEurosToCents(input.opex),
    headcountRange: input.headcount === "" ? null : input.headcount,
  };

  const cnaes = [
    ...(input.principalCnae === ""
      ? []
      : [{ code: input.principalCnae, role: "principal" as const, position: 1 }]),
    ...input.secondaryCnaes.map((code, index) => ({
      code,
      role: "secondary" as const,
      position: index + 1,
    })),
  ];

  const closedYears = input.closedYears.filter(closedYearIsActive);
  const includeForecast = forecastYearIsActive(input.forecastYear);

  await prisma.$transaction(async (tx) => {
    const projectId = existing?.id ?? randomUUID();

    if (existing) {
      await tx.project.update({ where: { id: existing.id }, data: profile });
      await tx.projectCnae.deleteMany({ where: { projectId } });
      await tx.activitySlice.deleteMany({ where: { projectId } });
      await tx.projectYear.deleteMany({ where: { projectId } });
    } else {
      await tx.project.create({
        data: {
          id: projectId,
          slug: await unusedSlug(input.codename),
          ...profile,
          netDebtCents: 0,
          workingCapitalCents: 0,
          netIncomeCents: 0,
          cif: keptCif,
          status: "draft",
          ownerId: user.id,
        },
      });
    }

    if (existing && existing.cif.trim().length === 0 && keptCif.length > 0) {
      await tx.project.update({ where: { id: projectId }, data: { cif: keptCif } });
    }

    if (pendingCif.length > 0 && keptCif === pendingCif) {
      await tx.user.update({ where: { id: user.id }, data: { pendingCif: null } });
    }

    if (cnaes.length > 0) {
      await tx.projectCnae.createMany({
        data: cnaes.map((cnae) => ({ id: randomUUID(), projectId, ...cnae })),
      });
    }

    const slices = [
      ...sliceData(projectId, "capital", capital),
      ...sliceData(projectId, "product", products),
      ...sliceData(projectId, "client", clients),
    ];

    if (slices.length > 0) {
      await tx.activitySlice.createMany({ data: slices });
    }

    const years = [
      ...closedYears.map((year) => ({
        id: randomUUID(),
        projectId,
        year: Number(year.year),
        kind: "closed" as const,
        ...pnlData(year),
        ...balanceData(year),
      })),
      ...(includeForecast
        ? [
            {
              id: randomUUID(),
              projectId,
              year: Number(input.forecastYear.year),
              kind: "forecast" as const,
              ...pnlData(input.forecastYear),
              ...emptyBalance,
            },
          ]
        : []),
    ];

    if (years.length > 0) {
      await tx.projectYear.createMany({ data: years });
    }
  });

  return { ok: true };
}
