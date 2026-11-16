import { describe, expect, it } from "vitest";
import { emptyCompanyDraft } from "@/lib/company-draft";
import { draftInvestorPreview } from "@/lib/draft-investor-preview";
import { formRowsToJson, type EbitdaAdjustmentFormRow } from "@/lib/ebitda-adjustments";
import { headlineEbitda } from "@/lib/financial-metrics";
import { marketCardFigures, reportHeadline } from "@/lib/company-report";
import type { SabiYear } from "@/lib/sabi/insights";

describe("draftInvestorPreview", () => {
  it("keeps client shares on a consumer company so the investor view can hide the chart without losing them", () => {
    const preview = draftInvestorPreview({
      ...emptyCompanyDraft(new Date("2026-06-01T00:00:00.000Z")),
      codename: "Proyecto Cala",
      region: "Andalucía",
      revenue: "1000000",
      ebitda: "250000",
      adjustedEbitda: "200000",
      askingPrice: "1200000",
      customerBase: "consumer",
      clientPercents: ["60", "40"],
      capitalPercents: ["100"],
      productPercents: ["100"],
    });

    expect(preview.customerBase).toBe("consumer");
    expect(preview.clients.map((slice) => slice.basisPoints)).toEqual([6000, 4000]);
    expect(preview.askingPriceCents).toBe(120_000_000);
    expect(preview.codename).toBe("Proyecto Cala");
    expect(preview.slug).not.toContain(" ");
  });

  it("keeps a negative EBITDA and its margin (t80, DEALE showed 0 €)", () => {
    const preview = draftInvestorPreview({
      ...emptyCompanyDraft(new Date("2026-06-01T00:00:00.000Z")),
      revenue: "1654133,67",
      ebitda: "-109998,88",
      adjustedEbitda: "-80000",
    });
    expect(preview.ebitdaCents).toBe(-10_999_888);
    expect(preview.adjustedEbitdaCents).toBe(-8_000_000);
    expect(preview.ebitdaMarginBp).toBe(-665);
  });

  it("does not let a pending owner_salary change the seller ficha headline", () => {
    const rows: EbitdaAdjustmentFormRow[] = [
      { id: "a", type: "one_off", amount: "50000", reason: "Extraordinario aprobado", status: "approved", documentId: "", documentName: "" },
      { id: "b", type: "owner_salary", amount: "1000001", reason: "Sueldo del propietario", status: "pending", documentId: "", documentName: "" },
    ];
    const preview = draftInvestorPreview({
      ...emptyCompanyDraft(new Date("2026-06-01T00:00:00.000Z")),
      revenue: "5000000",
      ebitda: "750000",
      adjustedEbitda: "0",
      ebitdaAdjustments: formRowsToJson(rows),
    });
    expect(preview.adjustedEbitdaCents).toBe(80_000_000);
    expect(preview.ebitdaAdjustments?.map((row) => row.status)).toEqual(["approved", "pending"]);
    const headline = reportHeadline({
      revenueCents: preview.revenueCents,
      ebitdaCents: preview.ebitdaCents,
      adjustedEbitdaCents: preview.adjustedEbitdaCents,
      ebitdaAdjustments: preview.ebitdaAdjustments,
    });
    expect(headline.adjustedEbitdaCents).toBe(80_000_000);
    expect(headline.hasPendingAdjustments).toBe(true);
  });
});

describe("seller marketplace preview matches /mercado cards", () => {
  const years: SabiYear[] = [
    {
      year: 2024,
      months: 12,
      employees: 32,
      revenueCents: 500_000_000,
      suppliesCents: null,
      staffCostsCents: null,
      ebitdaCents: 75_000_000,
      ebitCents: 60_000_000,
      financialResultCents: null,
      profitBeforeTaxCents: null,
      netResultCents: 50_000_000,
      totalAssetsCents: 200_000_000,
      nonCurrentAssetsCents: null,
      currentAssetsCents: 90_000_000,
      cashCents: 40_000_000,
      equityCents: 100_000_000,
      nonCurrentLiabilitiesCents: null,
      currentLiabilitiesCents: 60_000_000,
      longTermDebtCents: 50_000_000,
      shortTermDebtCents: 20_000_000,
      workingCapitalCents: null,
      ratios: {},
    },
  ];

  function mercado(adjustments: EbitdaAdjustmentFormRow["status"][] | "none") {
    const rows =
      adjustments === "none"
        ? null
        : adjustments.map((status, index) => ({
            id: `legacy-${index}`,
            type: status === "approved" ? ("one_off" as const) : ("owner_salary" as const),
            amountCents: status === "approved" ? 5_000_000 : 100_000_100,
            reason: "Ajuste",
            status,
            documentId: null,
            documentName: null,
          }));
    return marketCardFigures({
      revenueCents: 500_000_000,
      ebitdaCents: 75_000_000,
      adjustedEbitdaCents: rows === null ? 0 : 75_000_000,
      ebitdaAdjustments: rows,
      reportYears: years,
    });
  }

  function preview(adjustments: EbitdaAdjustmentFormRow[] | "none") {
    const draft = draftInvestorPreview({
      ...emptyCompanyDraft(new Date("2026-06-01T00:00:00.000Z")),
      revenue: "5000000",
      ebitda: "750000",
      adjustedEbitda: "0",
      askingPrice: "4000000",
      ebitdaAdjustments: adjustments === "none" ? "" : formRowsToJson(adjustments),
    });
    return marketCardFigures({ ...draft, reportYears: years });
  }

  it("pending, approved and none states share the same published card figures", () => {
    const pendingRows: EbitdaAdjustmentFormRow[] = [
      { id: "p", type: "owner_salary", amount: "1000001", reason: "Sueldo del propietario", status: "pending", documentId: "", documentName: "" },
    ];
    const approvedRows: EbitdaAdjustmentFormRow[] = [
      { id: "a", type: "one_off", amount: "50000", reason: "Extraordinario", status: "approved", documentId: "", documentName: "" },
    ];

    expect(preview("none")).toEqual(mercado("none"));
    expect(preview(pendingRows)).toEqual(mercado(["pending"]));
    expect(preview(approvedRows)).toEqual(mercado(["approved"]));

    const pending = preview(pendingRows);
    expect(pending.hasAdjustments).toBe(false);
    expect(pending.hasPendingAdjustments).toBe(true);
    expect(headlineEbitda({
      ebitdaCents: pending.ebitdaCents,
      adjustedEbitdaCents: pending.adjustedEbitdaCents,
      hasApprovedAdjustments: pending.hasAdjustments,
      hasPendingAdjustments: pending.hasPendingAdjustments,
    }).primaryCents).toBe(75_000_000);

    const approved = preview(approvedRows);
    expect(approved.hasAdjustments).toBe(true);
    expect(approved.adjustedEbitdaCents).toBe(80_000_000);
    expect(headlineEbitda({
      ebitdaCents: approved.ebitdaCents,
      adjustedEbitdaCents: approved.adjustedEbitdaCents,
      hasApprovedAdjustments: approved.hasAdjustments,
      hasPendingAdjustments: approved.hasPendingAdjustments,
    }).primaryLabel).toBe("EBITDA aj.");

    const none = preview("none");
    expect(none.hasAdjustments).toBe(false);
    expect(none.hasPendingAdjustments).toBe(false);
    expect(headlineEbitda({
      ebitdaCents: none.ebitdaCents,
      adjustedEbitdaCents: none.adjustedEbitdaCents,
      hasApprovedAdjustments: none.hasAdjustments,
      hasPendingAdjustments: none.hasPendingAdjustments,
    }).primaryLabel).toBe("EBITDA");
  });
});
