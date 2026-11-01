import { describe, expect, it } from "vitest";
import { missingHint, publishChecklist } from "./publish-checklist";

const full = { identity: true, description: true, cnae: true, income: true, balance: true, structure: true, price: true };

describe("publishChecklist", () => {
  it("is ready only when every required item is done, EBITDA included", () => {
    expect(publishChecklist({ panels: full, saleReason: true, ebitdaPositive: true, registryImported: false }).ready).toBe(true);
    const noEbitda = publishChecklist({ panels: full, saleReason: true, ebitdaPositive: false, registryImported: false });
    expect(noEbitda.ready).toBe(false);
    expect(noEbitda.missing).toEqual(["EBITDA positivo"]);
  });

  it("requires the sale reason as its own item", () => {
    const list = publishChecklist({ panels: full, saleReason: false, ebitdaPositive: true, registryImported: false });
    expect(list.missing).toEqual(["Motivo de venta"]);
    expect(list.items.map((item) => item.key)).toContain("saleReason");
  });

  it("marks only done registry-fed items as coming from the registry", () => {
    const list = publishChecklist({ panels: { ...full, balance: false }, saleReason: false, ebitdaPositive: true, registryImported: true });
    const byKey = Object.fromEntries(list.items.map((item) => [item.key, item.fromRegistry]));
    expect(byKey.cnae).toBe(true);
    expect(byKey.balance).toBe(false);
    expect(byKey.saleReason).toBe(false);
    expect(byKey.price).toBe(false);
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
