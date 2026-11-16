import { describe, expect, it } from "vitest";
import { draftFromRegistry, type RegistryCompany } from "@/lib/company-registry";

const record: RegistryCompany = {
  cif: "A46103834",
  legalName: "MERCADONA SA",
  address: "C/ ALFONSO ROIG ALFONSO S/N (ALBALAT DELS SORELLS), Valencia",
  region: "Valencia",
  codename: "Proyecto Alba",
  foundedYear: null,
  description: "",
  principalCnae: "",
  secondaryCnaes: [],
  headcount: null,
  revenueCents: null,
  ebitdaCents: null,
  adjustedEbitdaCents: null,
  statementYear: null,
};

describe("draftFromRegistry", () => {
  it("copies identity onto the draft and leaves the accounts blank", () => {
    const draft = draftFromRegistry(record);

    expect(draft.legalName).toBe("MERCADONA SA");
    expect(draft.address).toBe(record.address);
    expect(draft.postalCode).toBe("");
    expect(draft.city).toBe("Albalat dels Sorells");
    expect(draft.region).toBe("Valencia");
    expect(draft.codename).toBe("Proyecto Alba");
    expect(draft.foundedYear).toBe("");
    expect(draft.revenue).toBe("");
    expect(draft.ebitda).toBe("");
    expect(draft.adjustedEbitda).toBe("");
    expect(draft.headcount).toBe("");
    expect(draft.askingPrice).toBe("");
    expect(draft.closedYears.every((year) => year.sales === "")).toBe(true);
  });
});
