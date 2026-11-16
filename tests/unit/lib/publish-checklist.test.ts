import { describe, expect, it } from "vitest";
import { adminChecksMessage, adminPublishChecks, missingHint, publishChecklist } from "@/lib/publish-checklist";

const full = { identity: true, description: true, cnae: true, income: true, balance: true, structure: true, price: true };

describe("publishChecklist (seller)", () => {
  it("lists only what the seller provides, and hides name/NIF once verified", () => {
    const list = publishChecklist({ panels: { ...full, income: false, balance: false, cnae: false, structure: false }, saleReason: true, sellerFinancing: true });
    expect(list.items.map((item) => item.key)).toEqual(["saleReason", "description", "price", "sellerFinancing"]);
    expect(list.items.find((item) => item.key === "saleReason")?.href).toBe(
      "/mi-empresa/detalles?seccion=identity&ancla=panel-sale-reason#panel-sale-reason",
    );
    expect(list.ready).toBe(true);
  });

  it("shows name/NIF while missing and requires the sale reason", () => {
    const list = publishChecklist({ panels: { ...full, identity: false }, saleReason: false, sellerFinancing: false });
    expect(list.items[0].key).toBe("identity");
    expect(list.missing).toEqual(["Nombre y NIF", "Motivo de venta", "Financiación del vendedor"]);
  });
});

describe("adminPublishChecks", () => {
  it("needs the financials and a positive EBITDA", () => {
    expect(adminPublishChecks({ panels: full, ebitdaPositive: true }).ready).toBe(true);
    const noEbitda = adminPublishChecks({ panels: full, ebitdaPositive: false });
    expect(noEbitda.missing).toEqual(["EBITDA positivo"]);
    expect(adminChecksMessage(noEbitda)).toBe("Necesitas un EBITDA positivo para publicar.");
    expect(adminChecksMessage(adminPublishChecks({ panels: { ...full, income: false }, ebitdaPositive: false }))).toContain("24 h");
  });
});

describe("missingHint", () => {
  it("lists up to three missing items, then counts", () => {
    expect(missingHint([])).toBe("");
    expect(missingHint(["Precio de venta"])).toBe("Falta: Precio de venta.");
    expect(missingHint(["A", "B"])).toBe("Falta: A y B.");
    expect(missingHint(["A", "B", "C", "D"])).toBe("Faltan 4 requisitos de la lista.");
  });
});

describe("recommendedChecklist (t85)", () => {
  it("adds the client split only for business sellers and never touches ready", async () => {
    const { recommendedChecklist } = await import("@/lib/publish-checklist");
    const consumer = recommendedChecklist({ customerBase: "consumer", productSlices: 1, clientSlices: 0, adjustments: 0 });
    expect(consumer.map((item) => item.key)).toEqual(["customer", "productSplit", "adjustedEbitda"]);
    const business = recommendedChecklist({ customerBase: "business", productSlices: 0, clientSlices: 2, adjustments: 1 });
    expect(business.find((item) => item.key === "clientSplit")?.done).toBe(true);
    expect(business.every((item) => item.href.startsWith("/mi-empresa/detalles?seccion="))).toBe(true);
  });
});
