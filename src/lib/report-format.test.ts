import { describe, expect, it } from "vitest";
import { compactEur, formatValue, registryText } from "./report-format";

describe("registryText", () => {
  it("flattens line breaks and turns ALL CAPS into sentence case", () => {
    expect(registryText("LA INTERMEDIACION EN LA\nPRESTACION DE SERVICIOS.   OTRAS\r\nACTIVIDADES")).toBe("La intermediacion en la prestacion de servicios. Otras actividades");
  });

  it("keeps mixed-case text as written", () => {
    expect(registryText("Software  para\nPymes")).toBe("Software para Pymes");
  });
});

describe("compactEur", () => {
  it("uses one K/M style with a decimal comma", () => {
    expect(compactEur(-36_400_000)).toBe("-364K €");
    expect(compactEur(170_000_000)).toBe("1,7M €");
    expect(compactEur(5_740_000)).toBe("57,4K €");
    expect(compactEur(85_000)).toBe("850 €");
    expect(formatValue(57.4, "keur")).toBe("57,4K €");
  });
});
