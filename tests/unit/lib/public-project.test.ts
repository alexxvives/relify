import { describe, expect, it } from "vitest";
import { otherPublishedProjects, publicProjectSelect, publicProjectWhere, toPublicProjectDetail } from "@/lib/public-project";

const publicKeys = [
  "adjustedEbitdaCents",
  "askingPriceCents",
  "codename",
  "ebitdaCents",
  "region",
  "revenueCents",
  "slug",
] as const;

const privateKeys = [
  "id",
  "legalName",
  "cif",
  "address",
  "netDebtCents",
  "workingCapitalCents",
  "netIncomeCents",
  "shareholders",
  "dataRoomFiles",
  "createdAt",
  "status",
  "ownerId",
  "teaserToken",
  "foundedYear",
  "description",
  "opexCents",
  "headcountRange",
  "cnaes",
  "activitySlices",
  "years",
] as const;

describe("publicProjectSelect", () => {
  it("selects only the public card fields", () => {
    expect(Object.keys(publicProjectSelect).sort()).toEqual([...publicKeys]);

    for (const key of privateKeys) {
      expect(publicProjectSelect).not.toHaveProperty(key);
    }

    expect(publicProjectWhere).toEqual({ status: "published" });
  });
});

describe("toPublicProjectDetail", () => {
  it("adds locked labels and no confidential amounts", () => {
    const detail = toPublicProjectDetail({
      slug: "proyecto-olivo",
      codename: "Proyecto Olivo",
      region: "Comunitat Valenciana",
      revenueCents: 125_000_000,
      ebitdaCents: 31_000_000,
      adjustedEbitdaCents: 34_000_000,
      askingPriceCents: 98_000_000,
    });

    expect(detail.lockedFinancials.map((item) => item.label)).toEqual([
      "Deuda neta",
      "Capital circulante",
      "Resultado neto",
    ]);
    expect(JSON.stringify(detail.lockedFinancials)).not.toMatch(/\d/);
    expect(detail).not.toHaveProperty("legalName");
    expect(detail).not.toHaveProperty("netDebtCents");
  });
});

describe("otherPublishedProjects", () => {
  it("drops the project on the page and keeps the public card", () => {
    const olivo = {
      slug: "proyecto-olivo",
      codename: "Proyecto Olivo",
      region: "Comunitat Valenciana",
      revenueCents: 1,
      ebitdaCents: 2,
      adjustedEbitdaCents: 3,
      askingPriceCents: 4,
    };
    const duna = { ...olivo, slug: "proyecto-duna", codename: "Proyecto Duna" };
    const others = otherPublishedProjects([olivo, duna], "proyecto-duna");

    expect(others).toEqual([olivo]);
    expect(others[0]).not.toHaveProperty("legalName");
  });
});
