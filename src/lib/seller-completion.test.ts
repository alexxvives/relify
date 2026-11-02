import { describe, expect, it } from "vitest";
import { completionProgress, sectionComplete, sellerRequiredFields, type CompletionInput } from "./seller-completion";

const empty: CompletionInput = {
  saleReason: "",
  description: "",
  principalCnae: "",
  customerBase: "",
  productPercents: [],
  clientPercents: [],
  askingPrice: "",
};

describe("seller completion (t78)", () => {
  it("an empty draft has no complete section, including 'Cómo es tu negocio'", () => {
    const fields = sellerRequiredFields(empty);
    expect(sectionComplete(fields, "basic")).toBe(false);
    expect(sectionComplete(fields, "structure")).toBe(false);
    expect(sectionComplete(fields, "deal")).toBe(false);
  });

  it("lists missing fields by name, not by section", () => {
    const progress = completionProgress(sellerRequiredFields({ ...empty, saleReason: "retirement", principalCnae: "1071" }));
    expect(progress.missing.map((item) => item.label)).toContain("Descripción");
    expect(progress.missing.map((item) => item.label)).not.toContain("Tu empresa");
    expect(progress.done).toBe(2);
  });

  it("structure needs customer type and a product split summing 100 %, plus a client split for B2B", () => {
    const consumer = sellerRequiredFields({ ...empty, customerBase: "consumer", productPercents: ["60", "40"] });
    expect(sectionComplete(consumer, "structure")).toBe(true);
    const halfSplit = sellerRequiredFields({ ...empty, customerBase: "consumer", productPercents: ["60"] });
    expect(sectionComplete(halfSplit, "structure")).toBe(false);
    const business = sellerRequiredFields({ ...empty, customerBase: "business", productPercents: ["100"] });
    expect(sectionComplete(business, "structure")).toBe(false);
    const businessDone = sellerRequiredFields({ ...empty, customerBase: "business", productPercents: ["100"], clientPercents: ["70", "30"] });
    expect(sectionComplete(businessDone, "structure")).toBe(true);
  });

  it("basic needs sale reason, description and sector; deal needs the asking price", () => {
    const fields = sellerRequiredFields({ ...empty, saleReason: "retirement", description: "Obrador", principalCnae: "1071", askingPrice: "500000" });
    expect(sectionComplete(fields, "basic")).toBe(true);
    expect(sectionComplete(fields, "deal")).toBe(true);
  });
});
