import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("Round S21 landing and product bits", () => {
  it("lists the Relify folder last on Mis documentos", () => {
    const docs = read("src/components/seller/seller-documents.tsx");
    const relify = docs.lastIndexOf("featured");
    const create = docs.indexOf("sellerCopy.folderCreate");
    expect(relify).toBeGreaterThan(create);
    expect(docs).toMatch(/DocumentThumb/);
    expect(docs).toMatch(/PdfThumb/);
  });

  it("drops the profile identity declaration and keeps it on NDA signing", () => {
    expect(read("src/components/account/account-settings.tsx")).not.toMatch(/IdentityDeclarationCheckbox/);
    expect(read("src/components/investor/signature-pad.tsx")).toMatch(/IdentityDeclarationCheckbox/);
  });

  it("keeps plan cards without the old IVA 21% line", () => {
    expect(read("src/components/investor/premium-plans.tsx")).not.toMatch(/IVA 21% no incluido/);
    expect(read("src/lib/billing-copy.ts")).toMatch(/IVA incluido/);
  });

  it("uses a white StarBorder shine and navy primary buttons", () => {
    const star = read("src/components/landing/try-free-button.tsx");
    expect(star).toMatch(/color="#ffffff"/);
    expect(star).toMatch(/#1c2740/);
    expect(star).toMatch(/size === "hero"/);
    expect(read("src/components/ui/form/index.tsx")).toMatch(/bg-relify-btn/);
    expect(read("src/app/globals.css")).toMatch(/--relify-btn: #1c2740/);
    expect(read("src/app/globals.css")).toMatch(/--relify-btn-hover: #334761/);
  });

  it("keeps rentables gold with a diagonal shine", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/\.releva-gold-shine \{[\s\S]*#c48914/);
    expect(css).toMatch(/@keyframes releva-gold-sweep/);
  });

  it("hides the mobile carousel on Empresas en venta", () => {
    const offer = read("src/components/landing/offer.tsx");
    expect(offer).not.toMatch(/OfferCarousel/);
    expect(offer).toMatch(/OfferGlare/);
    expect(read("src/components/landing/offer-glare.tsx")).toMatch(/overflow-hidden/);
  });

  it("starts the Empresa path with a CIF popup and colourful charts", () => {
    const copy = read("src/lib/landing-copy.ts");
    expect(copy).toMatch(/kind: "cif"/);
    expect(read("src/components/landing/how-it-works.tsx")).toMatch(/function CifBody/);
    expect(read("src/components/landing/how-it-works.tsx")).toMatch(/conic-gradient/);
  });

  it("centres the pipeline line through the dots and uses a step card", () => {
    const css = read("src/app/globals.css");
    // S26: the connector top is derived from the dot size, so it stays centred on the dot.
    expect(css).toMatch(/top: calc\(\(var\(--pipe-dot\) - var\(--pipe-line\)\) \/ 2\)/);
    expect(css).not.toMatch(/top: 1\.575rem/);
    expect(read("src/components/landing/landing-pipeline.tsx")).toMatch(/releva-land-pipe-icon/);
    expect(read("src/components/landing/landing-pipeline.tsx")).toMatch(/Paso \{active \+ 1\}/);
  });

  it("toasts on seller detalle save", () => {
    expect(read("src/components/seller/company-draft-form.tsx")).toMatch(/AppToast/);
    expect(read("src/components/seller/company-draft-form.tsx")).toMatch(/savePulse/);
  });
});
