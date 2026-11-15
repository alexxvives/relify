import { ebitdaPublishable } from "@/lib/seller-draft-guard";
import { storedSellerFinancing } from "@/lib/seller-financing";
import { centsToEuroInput } from "@/lib/company-draft";
import { incomeLabels } from "@/lib/company-copy";
import { sellerCopy } from "@/lib/seller-copy";
import {
  activityKindsForCustomer,
  anonymousSliceLabel,
  sellerPanelFlags,
  statementEbitda,
  type PnlAmounts,
  type SellerPanelFlags,
  type SliceKind,
} from "@/lib/company-profile";
import { adminChecksMessage, adminPublishChecks, publishChecklist, recommendedChecklist, type CheckItem, type PublishChecklist, type RecommendedCheckKey } from "@/lib/publish-checklist";
import { storedEbitdaAdjustments } from "@/lib/ebitda-adjustments";
import { prisma } from "@/lib/db";
import { activeSellerProjectId } from "@/lib/server/seller-company";

export type SellerYearPoint = {
  year: number;
  salesCents: number | null;
  ebitdaCents: number | null;
  forecast: boolean;
};

export type SellerMix = {
  kind: SliceKind;
  title: string;
  slices: { label: string; basisPoints: number }[];
};

export type SellerCostSlice = {
  label: string;
  cents: number;
};

export type SellerCostYear = {
  year: number;
  slices: SellerCostSlice[];
};

const mixTitle: Record<SliceKind, string> = {
  capital: sellerCopy.mixCapital,
  product: sellerCopy.mixProduct,
  client: sellerCopy.mixClient,
};

const emptyPanels: SellerPanelFlags = {
  identity: false,
  description: false,
  cnae: false,
  income: false,
  balance: false,
  structure: false,
  price: false,
};

export async function getSellerOverview(ownerId: string): Promise<{
  panels: SellerPanelFlags;
  checklist: PublishChecklist;
  /** t85: non-blocking "Recomendado" steps shown under the required ones. */
  recommended: CheckItem<RecommendedCheckKey>[];
  /** t75: why "Publicar · pagar" cannot run yet (financials not loaded / EBITDA <= 0), or null. */
  payBlocked: string | null;
  series: SellerYearPoint[];
  mixes: SellerMix[];
  costYears: SellerCostYear[];
}> {
  const activeId = await activeSellerProjectId(ownerId);
  const project = activeId
    ? await prisma.project.findFirst({
        where: { id: activeId, ownerId },
        select: {
          legalName: true,
          cif: true,
          city: true,
          region: true,
          description: true,
          saleReason: true,
          sellerFinancing: true,
          sellerStay: true,
          ebitdaCents: true,
          askingPriceCents: true,
          customerBase: true,
          ebitdaAdjustments: true,
          adjustedEbitdaCents: true,
          headcountRange: true,
          cnaes: { select: { role: true, code: true } },
          activitySlices: {
            select: { kind: true, position: true, basisPoints: true },
          },
          years: {
            select: {
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
              equityCents: true,
            },
          },
        },
      })
    : null;

  if (!project) {
    return {
      panels: emptyPanels,
      checklist: publishChecklist({ panels: emptyPanels, saleReason: false, sellerFinancing: false }),
      recommended: recommendedChecklist({ customerBase: null, productSlices: 0, clientSlices: 0, adjustments: 0 }),
      payBlocked: null,
      series: [],
      mixes: [],
      costYears: [],
    };
  }

  const closed = project.years.filter((year) => year.kind === "closed");
  const principal = project.cnaes.find((cnae) => cnae.role === "principal");
  const panels = sellerPanelFlags({
    legalName: project.legalName,
    cif: project.cif,
    description: project.description ?? "",
    principalCnae: principal?.code ?? "",
    closedYears: closed.map((year) => ({
      sales: year.salesCents === null ? "" : "1",
      currentAssets: year.currentAssetsCents === null ? "" : "1",
      equity: year.equityCents === null ? "" : "1",
    })),
    headcount: project.headcountRange ?? "",
    capitalPercents: project.activitySlices
      .filter((slice) => slice.kind === "capital")
      .map(() => "1"),
    askingPrice: centsToEuroInput(project.askingPriceCents),
  });
  // t75: only what the seller provides; financials and EBITDA > 0 are admin checks (publishChecks.ts).
  const checklist = publishChecklist({
    panels,
    saleReason: (project.saleReason ?? "").trim().length > 0,
    sellerFinancing: storedSellerFinancing(project) !== null,
    location: `${project.city ?? ""}${project.region}`.trim().length > 0,
  });
  const admin = adminPublishChecks({ panels, ebitdaPositive: ebitdaPublishable(project) });
  const series: SellerYearPoint[] = [];

  for (const year of [...project.years].sort(
    (left, right) => left.year - right.year,
  )) {
    // t79: an empty forecast never shows; sellers no longer enter one and the registry has none.
    if (year.salesCents === null) {
      continue;
    }

    series.push({
      year: year.year,
      salesCents: year.salesCents,
      ebitdaCents:
        year.salesCents === null ? null : statementEbitda(pnlAmounts(year)),
      forecast: year.kind === "forecast",
    });
  }

  return {
    panels,
    checklist,
    recommended: recommendedChecklist({
      customerBase: project.customerBase,
      productSlices: project.activitySlices.filter((slice) => slice.kind === "product").length,
      clientSlices: project.activitySlices.filter((slice) => slice.kind === "client").length,
      adjustments: storedEbitdaAdjustments(project.ebitdaAdjustments)?.length ?? 0,
      sellerStay: project.sellerStay !== null,
    }),
    payBlocked: admin.ready ? null : adminChecksMessage(admin),
    series,
    mixes: mixGroups(project.activitySlices, project.customerBase),
    costYears: costYears(project.years),
  };
}

function mixGroups(
  slices: { kind: SliceKind; position: number; basisPoints: number }[],
  customerBase: "business" | "consumer" | "mixed" | null,
): SellerMix[] {
  const kinds = activityKindsForCustomer(customerBase);

  return kinds.flatMap((kind) => {
    const group = slices
      .filter((slice) => slice.kind === kind)
      .sort((left, right) => left.position - right.position)
      .map((slice) => ({
        label: anonymousSliceLabel(kind, slice.position),
        basisPoints: slice.basisPoints,
      }));

    return group.length === 0
      ? []
      : [{ kind, title: mixTitle[kind], slices: group }];
  });
}

function costYears(
  years: {
    year: number;
    kind: string;
    suppliesCents: number | null;
    staffCostsCents: number | null;
    otherOperatingCostsCents: number | null;
    amortizationCents: number | null;
  }[],
): SellerCostYear[] {
  const closed = [...years]
    .filter((year) => year.kind === "closed")
    .sort((left, right) => right.year - left.year);

  return closed.flatMap((year) => {
    const slices = [
      { label: incomeLabels.supplies, cents: year.suppliesCents },
      { label: incomeLabels.staffCosts, cents: year.staffCostsCents },
      {
        label: incomeLabels.otherOperatingCosts,
        cents: year.otherOperatingCostsCents,
      },
      { label: incomeLabels.amortization, cents: year.amortizationCents },
    ].flatMap((item) =>
      item.cents === null || item.cents === 0
        ? []
        : [{ label: item.label, cents: Math.abs(item.cents) }],
    );

    return slices.length === 0 ? [] : [{ year: year.year, slices }];
  });
}

function pnlAmounts(year: {
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
}): PnlAmounts {
  return {
    sales: year.salesCents,
    inventoryChange: year.inventoryChangeCents,
    ownUse: year.ownUseCents,
    supplies: year.suppliesCents,
    otherOperatingIncome: year.otherOperatingIncomeCents,
    staffCosts: year.staffCostsCents,
    otherOperatingCosts: year.otherOperatingCostsCents,
    grantIncome: year.grantIncomeCents,
    provisionSurplus: year.provisionSurplusCents,
    assetImpairment: year.assetImpairmentCents,
    subsidiaryControlLoss: year.subsidiaryControlLossCents,
    negativeDifference: year.negativeDifferenceCents,
    otherResults: year.otherResultsCents,
    amortization: year.amortizationCents,
  };
}
