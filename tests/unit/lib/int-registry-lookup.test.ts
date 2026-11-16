import { describe, expect, it } from "vitest";
import { intRegistryTestCif, lookupIntRegistry } from "@/lib/int-registry-lookup";

describe("lookupIntRegistry", () => {
  it("returns the INT seed company for the known test CIF", () => {
    const hit = lookupIntRegistry(intRegistryTestCif);
    expect(hit).toEqual({
      ok: true,
      record: expect.objectContaining({
        cif: intRegistryTestCif,
        legalName: "Obrador Ficticio Norte S.L.",
        region: "Madrid",
        principalCnae: "10.71",
      }),
    });
  });

  it("is an honest miss for any other CIF and never calls a provider", () => {
    expect(lookupIntRegistry("A58818501")).toEqual({ ok: true, record: null });
  });
});
