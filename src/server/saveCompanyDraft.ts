import { randomUUID } from "node:crypto";
import { codenameIsFree, uniqueCodename } from "@/server/uniqueCodename";
import { isCuratedNickname } from "@/lib/nickname";
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
import {
  descriptionContainsSecret,
  parsePercentToBasisPoints,
  type SliceKind,
} from "@/lib/company-profile";
import type { CurrentUser } from "@/server/getCurrentUser";
import { prisma } from "@/server/db";
import { activeSellerProjectId } from "@/server/sellerCompany";
import { lockedIdentity } from "@/lib/seller-draft-guard";

export type SaveCompanyDraftResult =
  { ok: true } | { ok: false; message: string };

async function unusedSlug(codename: string): Promise<string> {
  const base = projectSlug(codename);
  let slug = base;
  let suffix = 2;

  while (
    await prisma.project.findUnique({ where: { slug }, select: { id: true } })
  ) {
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
    subsidiaryControlLossCents: optionalEurosToCents(
      year.subsidiaryControlLoss,
    ),
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
    nonCurrentLiabilitiesCents: optionalEurosToCents(
      year.nonCurrentLiabilities,
    ),
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
  cif: string,
): Promise<SaveCompanyDraftResult> {
  if (!user.onboarded || user.role !== "seller") {
    return { ok: false, message: companyCopy.notSeller };
  }

  const capital = basisPointsFor(input.capitalPercents);
  const products = basisPointsFor(input.productPercents);
  const clientValues =
    input.customerBase === "consumer"
      ? input.clientPercents
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      : input.clientPercents;
  const clients = basisPointsFor(clientValues);

  if (!capital || !products || !clients) {
    return { ok: false, message: companyCopy.percentInvalid };
  }

  const activeId = await activeSellerProjectId(user.id);
  const [existing, account, ownedCount] = await Promise.all([
    activeId
      ? prisma.project.findFirst({
          where: { id: activeId, ownerId: user.id },
          select: {
            id: true,
            legalName: true,
            codename: true,
            cif: true,
            address: true,
            shareholders: { select: { name: true } },
            dataRoomFiles: { select: { fileName: true } },
          },
        })
      : null,
    prisma.user.findUnique({
      where: { id: user.id },
      select: { pendingCif: true },
    }),
    prisma.project.count({ where: { ownerId: user.id } }),
  ]);
  const pendingCif = account?.pendingCif?.trim() ?? "";
  const keptCif =
    existing && existing.cif.trim().length > 0
      ? existing.cif
      : ownedCount <= 1
        ? pendingCif
        : "";
  // t78: once the NIF is verified the legal name and CIF are locked (change requests go through info@).
  const identity = lockedIdentity(existing, { legalName: input.legalName, cif: cif.length > 0 ? cif : keptCif });
  const writtenCif = identity.cif;

  const secrets = [
    input.legalName,
    input.address,
    writtenCif,
    existing?.legalName ?? "",
    existing?.cif ?? "",
    existing?.address ?? "",
    ...(existing?.shareholders.map((shareholder) => shareholder.name) ?? []),
    ...(existing?.dataRoomFiles.map((file) => file.fileName) ?? []),
  ];

  if (
    input.description !== "" &&
    descriptionContainsSecret(input.description, secrets)
  ) {
    return { ok: false, message: companyCopy.descriptionPrivate };
  }

  // The nickname is generated, not typed: a change is kept only when it is
  // another free curated name (the "Generar otro" button); anything else keeps the stored one.
  const requested = input.codename.trim();
  const acceptable =
    isCuratedNickname(requested) &&
    (await codenameIsFree(requested, existing?.id));
  const codename = existing
    ? requested === existing.codename || acceptable
      ? requested
      : existing.codename
    : acceptable
      ? requested
      : await uniqueCodename();

  const profile = {
    legalName: identity.legalName,
    address: input.address,
    codename,
    region: input.region,
    revenueCents: eurosToCents(input.revenue),
    ebitdaCents: eurosToCents(input.ebitda),
    adjustedEbitdaCents: eurosToCents(input.adjustedEbitda),
    askingPriceCents: eurosToCents(input.askingPrice),
    foundedYear: input.foundedYear === "" ? null : Number(input.foundedYear),
    description: input.description === "" ? null : input.description,
    saleReason: input.saleReason === "" ? null : input.saleReason,
    opexCents: optionalEurosToCents(input.opex),
    headcountRange: input.headcount === "" ? null : input.headcount,
    customerBase: input.customerBase === "" ? null : input.customerBase,
  };

  const cnaes = [
    ...(input.principalCnae === ""
      ? []
      : [
          {
            code: input.principalCnae,
            role: "principal" as const,
            position: 1,
          },
        ]),
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

    // Lines that only the Modelo 200 upload fills: keep them across edits of the details form.
    const extras = new Map(
      existing
        ? (
            await tx.projectYear.findMany({
              where: { projectId },
              select: {
                year: true,
                financialResultCents: true,
                profitBeforeTaxCents: true,
                netResultCents: true,
                inventoryCents: true,
                receivablesCents: true,
                suppliersCents: true,
                dataSource: true,
                confirmedAt: true,
              },
            })
          ).map(({ year, ...rest }) => [year, rest] as const)
        : [],
    );
    const stored =
      writtenCif.length > 0 ? { ...profile, cif: writtenCif } : profile;

    if (existing) {
      const firstCif =
        existing.cif.trim().length === 0 && writtenCif.length > 0;
      await tx.project.update({
        where: { id: existing.id },
        data: firstCif ? { ...stored, sabiRequestedAt: new Date() } : stored,
      });
      await tx.projectCnae.deleteMany({ where: { projectId } });
      await tx.activitySlice.deleteMany({ where: { projectId } });
      await tx.projectYear.deleteMany({ where: { projectId } });
    } else {
      await tx.project.create({
        data: {
          id: projectId,
          slug: await unusedSlug(codename),
          ...profile,
          netDebtCents: 0,
          workingCapitalCents: 0,
          netIncomeCents: 0,
          cif: writtenCif,
          sabiRequestedAt: writtenCif.length > 0 ? new Date() : null,
          status: "draft",
          ownerId: user.id,
        },
      });
    }

    if (pendingCif.length > 0 && writtenCif.length > 0) {
      await tx.user.update({
        where: { id: user.id },
        data: { pendingCif: null },
      });
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
        ...(extras.get(Number(year.year)) ?? {}),
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
