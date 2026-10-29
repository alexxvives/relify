import { describe, expect, it } from "vitest";
import { investorProjectSelect, toInvestorProject } from "./investor-project";

const investorKeys = [
  "accountsFormat",
  "activitySlices",
  "adjustedEbitdaCents",
  "askingPriceCents",
  "audited",
  "cnaes",
  "codename",
  "customerBase",
  "description",
  "ebitdaCents",
  "foundedYear",
  "headcountRange",
  "legalForm",
  "opexCents",
  "region",
  "revenueCents",
  "saleReason",
  "slug",
  "years",
] as const;

const hiddenKeys = [
  "address",
  "cif",
  "dataRoomFiles",
  "id",
  "legalName",
  "netDebtCents",
  "netIncomeCents",
  "ownerId",
  "shareholders",
  "status",
  "workingCapitalCents",
] as const;

describe("investorProjectSelect", () => {
  it("omits legal identity, shareholders, and data-room files", () => {
    expect(Object.keys(investorProjectSelect).sort()).toEqual([...investorKeys]);

    for (const key of hiddenKeys) {
      expect(investorProjectSelect).not.toHaveProperty(key);
    }
  });
});

describe("toInvestorProject", () => {
  it("labels slices anonymously and computes the statement rows", () => {
    const profile = toInvestorProject({
      slug: "proyecto-olivo",
      codename: "Proyecto Olivo",
      region: "Comunitat Valenciana",
      foundedYear: 1998,
      description: "Mayorista de bebidas.",
      saleReason: "jubilacion",
      revenueCents: 125_000_000,
      ebitdaCents: 31_000_000,
      adjustedEbitdaCents: 34_000_000,
      askingPriceCents: 98_000_000,
      opexCents: null,
      headcountRange: "band_21_50",
      customerBase: null,
      cnaes: [{ code: "46.34", role: "principal", position: 1 }],
      activitySlices: [
        { kind: "capital", position: 1, basisPoints: 6000 },
        { kind: "capital", position: 2, basisPoints: 4000 },
        { kind: "client", position: 1, basisPoints: 10_000 },
      ],
      years: [
        {
          year: 2025,
          kind: "closed",
          salesCents: 100,
          inventoryChangeCents: 0,
          ownUseCents: 0,
          suppliesCents: -40,
          otherOperatingIncomeCents: 0,
          staffCostsCents: -20,
          otherOperatingCostsCents: 0,
          grantIncomeCents: 0,
          provisionSurplusCents: 0,
          assetImpairmentCents: 0,
          subsidiaryControlLossCents: 0,
          negativeDifferenceCents: 0,
          otherResultsCents: 0,
          amortizationCents: -5,
          currentAssetsCents: 80,
          cashCents: 10,
          nonCurrentAssetsCents: 20,
          currentLiabilitiesCents: 30,
          longTermDebtCents: 15,
          nonCurrentLiabilitiesCents: 20,
          shortTermDebtCents: 5,
          equityCents: 50,
        },
      ],
    });

    expect(profile.capital.map((slice) => slice.label)).toEqual(["Accionista 1", "Accionista 2"]);
    expect(profile.clients[0]?.label).toBe("Cliente 1");
    expect(profile.principalCnae?.title).toBe("Comercio al por mayor de bebidas");
    expect(profile.opexCents).toBeNull();
    expect(profile.incomeRows.find((row) => row.key === "grossMargin")?.values).toEqual([60]);
    expect(profile.incomeRows.find((row) => row.key === "ebitda")?.values).toEqual([40]);
    expect(profile.incomeRows.find((row) => row.key === "operatingResult")?.values).toEqual([35]);
    expect(profile.balanceRows.find((row) => row.key === "totalAssets")?.values).toEqual([100]);
    expect(profile.balanceRows.find((row) => row.key === "totalLiabilities")?.values).toEqual([100]);
    expect(JSON.stringify(profile)).not.toMatch(/Inés Navarro|Talleres Olivo|B12345678|cuentas-2025/);
    expect(profile).not.toHaveProperty("legalName");
    expect(profile).not.toHaveProperty("shareholders");
  });
});
