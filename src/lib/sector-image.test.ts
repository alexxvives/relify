import { describe, expect, it } from "vitest";
import { sectorImageSrc, sectorKeyFromCnae } from "./sector-image";

describe("sectorKeyFromCnae", () => {
  it("maps CNAE divisions to sector pictures", () => {
    expect(sectorKeyFromCnae("56.10")).toBe("hosteleria");
    expect(sectorKeyFromCnae("55.10")).toBe("turismo");
    expect(sectorKeyFromCnae("10.71")).toBe("alimentacion");
    expect(sectorKeyFromCnae("25.11")).toBe("industria");
    expect(sectorKeyFromCnae("43.29")).toBe("construccion");
    expect(sectorKeyFromCnae("46.34")).toBe("comercio");
    expect(sectorKeyFromCnae("49.41")).toBe("transporte");
    expect(sectorKeyFromCnae("69.20")).toBe("servicios");
  });

  it("falls back to services when the code is missing", () => {
    expect(sectorKeyFromCnae(null)).toBe("servicios");
    expect(sectorImageSrc("servicios")).toBe("/sectors/servicios.jpg");
  });
});
