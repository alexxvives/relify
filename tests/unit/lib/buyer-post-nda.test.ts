import { describe, expect, it } from "vitest";
import { buyerProjectView } from "@/lib/report-veil";
import { toInvestorProject } from "@/lib/investor-project";
import { accessFromConnection } from "@/lib/project-access";
import { investorProcessFiles } from "@/lib/deal-pipeline";

const closedYear = {
  year: 2024,
  kind: "closed" as const,
  salesCents: 200_000_000,
  inventoryChangeCents: 0,
  ownUseCents: 0,
  suppliesCents: -40_000_000,
  otherOperatingIncomeCents: 0,
  staffCostsCents: -80_000_000,
  otherOperatingCostsCents: -20_000_000,
  grantIncomeCents: 0,
  provisionSurplusCents: 0,
  assetImpairmentCents: 0,
  subsidiaryControlLossCents: 0,
  negativeDifferenceCents: 0,
  otherResultsCents: 0,
  amortizationCents: -10_000_000,
  currentAssetsCents: 90_000_000,
  cashCents: 25_000_000,
  nonCurrentAssetsCents: 70_000_000,
  currentLiabilitiesCents: 40_000_000,
  longTermDebtCents: 20_000_000,
  nonCurrentLiabilitiesCents: 15_000_000,
  shortTermDebtCents: 8_000_000,
  equityCents: 77_000_000,
  financialResultCents: -2_000_000,
  profitBeforeTaxCents: 38_000_000,
  netResultCents: 30_000_000,
  cashFlowCents: 35_000_000,
  employees: 15,
  ratios: { economicReturn: 12.5, collectionDays: 42 },
  dataSource: "vendedor",
};

const record = {
  slug: "int-consultoria-servicios",
  codename: "Consultoría Servicios",
  region: "Cataluña",
  foundedYear: 2018,
  description: "Consultoría estratégica.",
  saleReason: "Nuevos proyectos internacionales",
  revenueCents: 200_000_000,
  ebitdaCents: 40_000_000,
  adjustedEbitdaCents: 45_000_000,
  ebitdaAdjustments: [{ type: "other", amountCents: 5_000_000, reason: "Sueldo del socio", status: "approved" }],
  askingPriceCents: 160_000_000,
  opexCents: 140_000_000,
  headcountRange: "band_11_20",
  customerBase: "business" as const,
  cnaes: [{ code: "70.22", role: "principal" as const, position: 0 }],
  activitySlices: [{ kind: "client" as const, position: 0, basisPoints: 10_000 }],
  years: [closedYear],
};

describe("post-NDA buyer ficha", () => {
  it("keeps years, charts payload, detalle and adjustment reasons after NDA", () => {
    const profile = toInvestorProject(record);
    expect(profile.reportYears?.length).toBe(1);
    expect(profile.reportYears?.[0]?.revenueCents).toBe(200_000_000);
    expect(profile.detailRows?.some((row) => row.key === "netResultCents" && row.values[0] === 30_000_000)).toBe(true);
    expect(profile.incomeRows.some((row) => row.values.some((value) => value === 200_000_000))).toBe(true);
    expect(profile.indicatorRows?.some((row) => row.key === "employees" && row.values[0] === 15)).toBe(true);

    const open = buyerProjectView(profile, true);
    const text = JSON.stringify(open);
    expect(open.figuresVeiled).toBeUndefined();
    expect(text).toContain("200000000");
    expect(text).toContain("30000000");
    expect(text).toContain("Sueldo del socio");
    expect(text).toContain("12.5");
    expect(open.reportYears?.[0]?.revenueCents).toBe(200_000_000);
    expect(open.detailRows).toEqual(profile.detailRows);
    expect(open.incomeRows).toEqual(profile.incomeRows);
    expect(open.indicatorRows).toEqual(profile.indicatorRows);
  });

  it("veils year figures and reasons before the NDA while keeping published cards", () => {
    const profile = toInvestorProject(record);
    const locked = buyerProjectView(profile, false);
    const text = JSON.stringify(locked);
    expect(locked.figuresVeiled).toBe(true);
    expect(locked.revenueCents).toBe(profile.revenueCents);
    expect(locked.ebitdaCents).toBe(profile.ebitdaCents);
    expect(text).not.toContain("Sueldo del socio");
    expect(text).not.toContain("30000000");
    expect(locked.reportYears?.[0]?.revenueCents).not.toBe(200_000_000);
  });

  it("treats accepted as the only stage that opens the full ficha", () => {
    expect(
      accessFromConnection({
        sellerAcceptedAt: new Date(),
        ndaAcceptedAt: new Date(),
        cancelledAt: null,
      }),
    ).toBe("accepted");
    expect(
      accessFromConnection({
        sellerAcceptedAt: new Date(),
        ndaAcceptedAt: null,
        cancelledAt: null,
      }),
    ).not.toBe("accepted");
  });

  it("does not list data-room files until the seller grants the room, even after NDA", () => {
    const files = [{ folder: "Cuentas", fileName: "pyg.pdf", id: "f1", stored: true }];
    expect(investorProcessFiles({ ndaAcceptedAt: new Date(), granted: false, files })).toEqual([]);
    expect(investorProcessFiles({ ndaAcceptedAt: new Date(), granted: true, files })).toEqual([
      { folder: "Cuentas", fileName: "pyg.pdf", id: "f1", stored: true },
    ]);
  });
});
