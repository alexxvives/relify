import { describe, expect, it } from "vitest";
import { companyDraftSchema, emptyCompanyDraft } from "@/lib/company-draft";
import { saveBlockReason } from "@/lib/seller-save";

describe("seller save (t78 'Guardar cambios' bug)", () => {
  it("does not block a save because required fields like the sale reason are still empty", () => {
    expect(saveBlockReason([[], [], []])).toBeNull();
    const draft = { ...emptyCompanyDraft(), codename: "Proyecto Prueba", region: "Barcelona", revenue: "1000", ebitda: "100", adjustedEbitda: "120", askingPrice: "800", saleReason: "" as const, description: "" };
    expect(companyDraftSchema.safeParse(draft).success).toBe(true);
  });

  it("blocks only percent splits that don't add up, with a message", () => {
    expect(saveBlockReason([[], ["60", "30"], []])).toMatch(/100 %/);
    expect(saveBlockReason([[], ["80", "30"], []])).toMatch(/más del 100/);
    expect(saveBlockReason([[], ["70", "30"], []])).toBeNull();
  });
});
