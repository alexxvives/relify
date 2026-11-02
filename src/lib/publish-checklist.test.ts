import { describe, expect, it } from "vitest";
import { adminChecksMessage, adminPublishChecks, missingHint, publishChecklist } from "./publish-checklist";

const full = { identity: true, description: true, cnae: true, income: true, balance: true, structure: true, price: true };

describe("publishChecklist (seller)", () => {
  it("lists only what the seller provides, and hides name/NIF once verified", () => {
    const list = publishChecklist({ panels: { ...full, income: false, balance: false, cnae: false, structure: false }, saleReason: true });
    expect(list.items.map((item) => item.key)).toEqual(["saleReason", "description", "price"]);
    expect(list.ready).toBe(true);
  });

  it("shows name/NIF while missing and requires the sale reason", () => {
    const list = publishChecklist({ panels: { ...full, identity: false }, saleReason: false });
    expect(list.items[0].key).toBe("identity");
    expect(list.missing).toEqual(["Nombre y NIF", "Motivo de venta"]);
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
