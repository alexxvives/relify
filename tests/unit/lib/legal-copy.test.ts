import { describe, expect, it } from "vitest";
import { legalEntity, privacyCopy, termsCopy } from "@/lib/legal-copy";

describe("legal copy", () => {
  it("leaves company identity as TODO for Alex and never invents NIF or address", () => {
    expect(legalEntity.razonSocial.startsWith("TODO:")).toBe(true);
    expect(legalEntity.nif.startsWith("TODO:")).toBe(true);
    expect(legalEntity.domicilio.startsWith("TODO:")).toBe(true);
    expect(legalEntity.email).toBe("info@itsrelify.com");
    const blob = JSON.stringify({ legalEntity, privacyCopy, termsCopy });
    expect(blob).toMatch(/TODO: razón social/);
    expect(blob).toMatch(/TODO: NIF/);
    expect(blob).toMatch(/TODO: domicilio social/);
    expect(blob).not.toMatch(/B[0-9]{8}/);
  });

  it("covers privacy processors, rights and AEPD", () => {
    const text = privacyCopy.sections.map((section) => `${section.title} ${section.body.join(" ")}`).join(" ");
    expect(text).toMatch(/Cloudflare/);
    expect(text).toMatch(/Neon/);
    expect(text).toMatch(/Maileroo/);
    expect(text).toMatch(/Stripe/);
    expect(text).toMatch(/Google Analytics/);
    expect(text).toMatch(/cookieless/);
    expect(text).toMatch(/info@itsrelify.com/);
    expect(text).toMatch(/AEPD/);
    expect(text).toMatch(/comprador/i);
    expect(text).toMatch(/vendedor/i);
    expect(text).toMatch(/asesor/i);
  });

  it("covers marketplace terms: NDA, notary, success fee, Stripe and Spanish courts", () => {
    const text = termsCopy.sections.map((section) => `${section.title} ${section.body.join(" ")}`).join(" ");
    expect(text).toMatch(/NDA/);
    expect(text).toMatch(/notario/);
    expect(text).toMatch(/escrow/i);
    expect(text).toMatch(/no es parte/);
    expect(text).toMatch(/5%/);
    expect(text).toMatch(/Stripe/);
    expect(text).toMatch(/IVA/);
    expect(text).toMatch(/portal de facturación/);
    expect(text).toMatch(/ley española/);
  });
});
