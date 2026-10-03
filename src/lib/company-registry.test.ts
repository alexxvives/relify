import { describe, expect, it } from "vitest";
import { draftFromRegistry, lookupFixtureCompany } from "./company-registry";
import { isValidSpanishCif } from "./spanish-cif";

describe("lookupFixtureCompany", () => {
  it("returns fictional registry fields for the known CIF and nothing for another valid CIF", () => {
    const hit = lookupFixtureCompany("b12345674");

    expect(isValidSpanishCif("B12345674")).toBe(true);
    expect(hit?.legalName).toBe("Obrador Ficticio Norte S.L.");
    expect(hit?.revenueCents).toBe(185_000_000);
    expect(hit?.principalCnae).toBe("10.71");
    expect(hit?.statementYear).toBe(2024);
    expect(lookupFixtureCompany("A00000000")).toBeNull();
  });
});

describe("draftFromRegistry", () => {
  it("prefills an editable draft and keeps the legal name off the public codename", () => {
    const record = lookupFixtureCompany("B12345674");

    expect(record).not.toBeNull();

    if (!record) {
      return;
    }

    const draft = draftFromRegistry(record);

    expect(draft.legalName).toBe(record.legalName);
    expect(draft.address).toBe("Calle Ficticia 12, 28001 Madrid");
    expect(draft.region).toBe("Madrid");
    expect(draft.codename.startsWith("Proyecto ")).toBe(true);
    expect(draft.codename).not.toContain("Obrador");
    expect(draft.codename).not.toContain("B12345674");
    expect(draft.revenue).toBe("1850000");
    expect(draft.ebitda).toBe("240000");
    expect(draft.adjustedEbitda).toBe("210000");
    expect(draft.principalCnae).toBe("10.71");
    expect(draft.secondaryCnaes).toEqual(["10.72"]);
    expect(draft.headcount).toBe("band_6_10");
    expect(draft.foundedYear).toBe("2014");
    expect(draft.closedYears[1]?.sales).toBe("1850000");
    expect(draft.askingPrice).toBe("");
  });
});
