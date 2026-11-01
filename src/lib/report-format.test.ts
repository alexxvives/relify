import { describe, expect, it } from "vitest";
import { registryText } from "./report-format";

describe("registryText", () => {
  it("flattens line breaks and turns ALL CAPS into sentence case", () => {
    expect(registryText("LA INTERMEDIACION EN LA\nPRESTACION DE SERVICIOS.   OTRAS\r\nACTIVIDADES")).toBe("La intermediacion en la prestacion de servicios. Otras actividades");
  });

  it("keeps mixed-case text as written", () => {
    expect(registryText("Software  para\nPymes")).toBe("Software para Pymes");
  });
});
