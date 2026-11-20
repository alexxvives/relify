import { describe, expect, it } from "vitest";
import { advisorCopy } from "@/lib/advisor-copy";
import { advisorPublishMissing, identityIsComplete, marketplaceInputSchema } from "@/lib/advisor-profile";
import { anonymousRegion, autoCompanyDescription } from "@/lib/auto-description";
import { engagementCopy } from "@/lib/engagement-copy";

const now = new Date("2026-11-20T12:00:00Z");

describe("S34 auto description", () => {
  it("builds a neutral summary from CNAE and registry facts, without exact figures", () => {
    const text = autoCompanyDescription({
      principalCnae: "4752",
      secondaryCnaes: ["4674"],
      foundedYear: 1998,
      headcountRange: "band_6_10",
      region: "47001, Valladolid",
      customerBase: "mixed",
      now,
    });
    expect(text).toMatch(/^Empresa cuya actividad principal es /);
    expect(text).toContain("más de 25 años de trayectoria");
    expect(text).toContain("opera en Valladolid");
    expect(text).toContain("de 6 a 10 personas");
    expect(text).not.toMatch(/1998|47001/);
    expect(text!.length).toBeLessThanOrEqual(1000);
  });

  it("returns null without a principal CNAE", () => {
    expect(autoCompanyDescription({ principalCnae: null, now })).toBeNull();
  });

  it("keeps only the place name of a region", () => {
    expect(anonymousRegion("08001, Barcelona")).toBe("Barcelona");
    expect(anonymousRegion("")).toBeNull();
  });
});

describe("S34 advisor profile split", () => {
  it("Datos corporativos is the identity only; the marketplace save accepts partial input", () => {
    expect(identityIsComplete({ businessName: "", nif: "", postalCode: "" })).toBe(false);
    expect(marketplaceInputSchema.safeParse({ description: "", sectors: [], services: [] }).success).toBe(true);
  });

  it("lists a missing service among what keeps the profile unpublished", () => {
    const missing = advisorPublishMissing({ businessName: "", nif: "", postalCode: "", description: "", sectors: [], services: [] });
    expect(missing.at(-1)).toBe("al menos un servicio con precio");
  });

  it("uses the seller-style published copy and the dock tabs", () => {
    expect(advisorCopy.profileUnpublished).toBe("Tu perfil no está publicado");
    expect(engagementCopy.railDeposit).toBe("Depósito");
    expect(engagementCopy.railInvestor).toBe("Comprador");
    expect(advisorCopy.processesLanes).toContain("{n}");
  });
});
