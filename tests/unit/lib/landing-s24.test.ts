import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("Round S24 registro, profile, marketplace, and INT CIF", () => {
  it("gives Información / Ficha pública a solid white GooeyNav frame", () => {
    const tabs = read("src/components/seller/seller-tabs.tsx");
    expect(tabs).toMatch(/gooey-nav--solid/);
    expect(tabs).toMatch(/"--gn-frame": "#ffffff"/);
    expect(read("src/components/ui/gooey-nav/GooeyNav.css")).toMatch(/gooey-nav--solid\.gooey-nav--framed/);
  });

  it("fits the registro role selector without helper lines", () => {
    const form = read("src/components/auth/sign-up-form.tsx");
    expect(form).toMatch(/grid grid-cols-3/);
    expect(form).not.toMatch(/whitespace-nowrap/);
    expect(form).not.toMatch(/roleHints/);
    expect(read("src/components/auth/auth-screen.tsx")).not.toMatch(/authCopy\.signUpIntro/);
  });

  it("keeps a compact required terms line and password chips", () => {
    const form = read("src/components/auth/sign-up-form.tsx");
    expect(form).toMatch(/name="acceptTerms"/);
    expect(form).toMatch(/text-\[11px\]/);
    expect(form).toMatch(/chips/);
    expect(read("src/app/globals.css")).toMatch(/\.password-chips ul\[aria-label\]/);
    expect(read("src/components/auth/new-password-field.tsx")).toMatch(/aria-live|role="status"|summary/);
  });

  it("drops the buyer plan commission intro", () => {
    expect(read("src/lib/billing-copy.ts")).not.toMatch(/Ver empresas es gratis/);
    expect(read("src/components/investor/premium-plans.tsx")).not.toMatch(/billingCopy\.intro/);
  });

  it("drops the masked DNI hint and widens the profile layout", () => {
    const account = read("src/components/account/account-settings.tsx");
    expect(account).not.toMatch(/nationalIdMaskedHint/);
    expect(account).toMatch(/max-w-\[72rem\]/);
    expect(account).toMatch(/xl:grid-cols-2/);
  });

  it("restores vendored Gaze blob avatars for unknown seeds", () => {
    const gaze = read("src/lib/gaze-avatar.ts");
    expect(gaze).toMatch(/waitlistSeeds\[hashSeed/);
    expect(gaze).not.toMatch(/data:image\/svg\+xml/);
  });

  it("filters the marketplace by asking price as Precio de venta", () => {
    expect(read("src/lib/market-copy.ts")).toMatch(/revenueLabel: "Precio de venta"/);
    expect(read("src/lib/market-filters.ts")).toMatch(/inBand\(project\.askingPriceCents/);
    expect(read("src/lib/market-filters.ts")).not.toMatch(/inBand\(project\.revenueCents, revenueBounds/);
  });

  it("does not claim CIF data was filled when the registry missed", () => {
    expect(read("src/lib/company-copy.ts")).toMatch(/nifMissTitle/);
    expect(read("src/components/seller/company-nif-form.tsx")).toMatch(/state\.filled/);
    expect(read("src/lib/server/lookup-company-registry.ts")).toMatch(/lookupIntRegistry/);
    expect(read("src/lib/int-registry-lookup.ts")).toMatch(/B12345674/);
  });

  it("links seller home to Detalles when company data is still empty", () => {
    expect(read("src/components/seller/seller-overview.tsx")).toMatch(/\/mi-empresa\/detalles/);
    expect(read("src/components/seller/sabi-pending-notice.tsx")).toMatch(/sellerCopy\.detailsTitle/);
  });

  it("keeps seller financing as Sí/No with Recomendado and unused year/pct columns", () => {
    const field = read("src/components/seller/company-draft-form.tsx");
    expect(field).toMatch(/Recomendado/);
    expect(field).not.toMatch(/Porcentaje del precio financiado/);
    expect(read("src/lib/seller-financing.ts")).toMatch(/sellerFinancingMaxPct: null/);
    expect(read("src/lib/seller-financing.ts")).toMatch(/sellerFinancingYears: null/);
  });
});
