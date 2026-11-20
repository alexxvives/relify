import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { intApiEmpresasConfigured, intApiEmpresasKey } from "@/lib/int-env";
import { intRegistryLookupMode } from "@/lib/int-registry-lookup";
import { investorProfileDraftSchema, investorProfileSchema } from "@/lib/investor-profile";
import { flagEmoji, phonePrefixTriggerLabel } from "@/lib/phone-countries";
import { platformAgreementSigned, signupStampWindowMs } from "@/lib/platform-agreement";
import { shouldBlockExternalApi } from "@/lib/server/int-guards";
import {
  formatLocation,
  matchCommunity,
  parseLocation,
  resolveCommunity,
  suggestionsFromNominatim,
  suggestionsFromPhoton,
} from "@/lib/spain-places";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("S26 point 4: the Acuerdo con Relify is signed, not stamped at sign-up", () => {
  const createdAt = new Date("2026-11-14T10:00:00Z");

  it("treats no acceptance as unsigned and a stored signature as signed", () => {
    expect(platformAgreementSigned({ termsAcceptedAt: null, hasSignature: true, createdAt })).toBe(false);
    expect(platformAgreementSigned({ termsAcceptedAt: new Date(createdAt.getTime() + 1000), hasSignature: true, createdAt })).toBe(true);
  });

  it("ignores the S22 sign-up stamp (set at creation without a signature) but keeps legacy acceptances", () => {
    expect(platformAgreementSigned({ termsAcceptedAt: new Date(createdAt.getTime() + 500), hasSignature: false, createdAt })).toBe(false);
    expect(
      platformAgreementSigned({ termsAcceptedAt: new Date(createdAt.getTime() + signupStampWindowMs + 1), hasSignature: false, createdAt }),
    ).toBe(true);
  });

  it("no longer writes terms_accepted_at from sign-up; the shell still gates on the agreement", () => {
    expect(read("src/lib/server/sign-up.ts")).not.toMatch(/termsAcceptedAt/);
    expect(read("src/lib/server/get-current-user.ts")).toMatch(/platformAgreementSigned/);
    expect(read("src/components/shell/app-shell.tsx")).toMatch(/PlatformTermsDialog/);
  });
});

describe("S26 point 5: INT CIF verification with API Empresas", () => {
  it("keeps the B12345674 mock and uses the mock without a key", () => {
    expect(intRegistryLookupMode("B12345674", "key")).toBe("mock");
    expect(intRegistryLookupMode("b-12345674", "key")).toBe("mock");
    expect(intRegistryLookupMode("B87654321", "")).toBe("mock");
    expect(intRegistryLookupMode("B87654321", "key")).toBe("apiempresas");
  });

  it("reads only INT_APIEMPRESAS_API_KEY and unblocks only API Empresas in INT", () => {
    vi.stubEnv("INT_ENVIRONMENT", "true");
    vi.stubEnv("APIEMPRESAS_API_KEY", "prod-key-must-not-be-used");
    vi.stubEnv("INT_APIEMPRESAS_API_KEY", "");
    expect(intApiEmpresasKey()).toBe("");
    expect(intApiEmpresasConfigured()).toBe(false);
    expect(shouldBlockExternalApi("APIEMPRESAS")).toBe(true);
    vi.stubEnv("INT_APIEMPRESAS_API_KEY", "int-key");
    expect(intApiEmpresasConfigured()).toBe(true);
    expect(shouldBlockExternalApi("APIEMPRESAS")).toBe(false);
    expect(shouldBlockExternalApi("OPENMERCANTIL")).toBe(true);
  });

  it("lists the optional secret in the INT pack manifest", () => {
    expect(read("scripts/package-int-worker.mjs")).toMatch(/secrets_optional: \["INT_APIEMPRESAS_API_KEY"\]/);
  });
});

describe("S26 point 1: pipeline connectors through the dot centres", () => {
  it("draws one per-step connector centred on the dot instead of an absolute base/fill bar", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/top: calc\(\(var\(--pipe-dot\) - var\(--pipe-line\)\) \/ 2\)/);
    expect(css).not.toMatch(/\.releva-land-pipe-fill \{/);
    expect(read("src/components/landing/landing-pipeline.tsx")).not.toMatch(/releva-land-pipe-(base|fill)/);
  });
});

describe("S26 points 2-3: auth card", () => {
  it("widens the card and puts the forgot-password link on the Contraseña label row", () => {
    expect(read("src/components/auth/auth-screen.tsx")).toMatch(/lg:w-\[min\(32rem,max\(29rem,54%\)\)\]/);
    const signIn = read("src/components/auth/sign-in-form.tsx");
    expect(signIn).toMatch(/labelAside=\{/);
    expect(read("src/components/auth/auth-field.tsx")).toMatch(/justify-between[\s\S]*\{labelAside\}/);
  });
});

describe("S26 point 6-12 and placeholders", () => {
  it("narrows the Inicio side column", () => {
    expect(read("src/components/investor/investor-home.tsx")).toMatch(/xl:grid-cols-\[minmax\(0,1fr\)_340px\]/);
    expect(read("src/components/seller/seller-overview.tsx")).toMatch(/xl:grid-cols-\[minmax\(0,1fr\)_340px\]/);
  });

  it("shows only flag and prefix on the closed phone selector", () => {
    expect(flagEmoji("ES")).toBe("🇪🇸");
    expect(flagEmoji("x")).toBe("");
    expect(phonePrefixTriggerLabel("ES", "34")).toBe("🇪🇸 +34");
    expect(read("src/components/auth/phone-field.tsx")).toMatch(/triggerLabel: phonePrefixTriggerLabel/);
    expect(read("src/components/ui/option-select.tsx")).toMatch(/selected\?\.triggerLabel \?\? selected\?\.label/);
  });

  it("formats investor places as Ciudad, Comunidad autónoma, España", () => {
    expect(matchCommunity("Catalunya")).toBe("Cataluña");
    expect(matchCommunity("Euskadi")).toBe("País Vasco");
    expect(matchCommunity("Sevilla")).toBe("Andalucía");
    expect(resolveCommunity({ city: "Sabadell", county: "Vallès Occidental", state: "Catalunya" })).toBe("Cataluña");
    expect(formatLocation("Barcelona", "Cataluña")).toBe("Barcelona, Cataluña, España");
    expect(parseLocation("Barcelona, Cataluña, España")).toEqual({ city: "Barcelona", province: "Cataluña" });
    const photon = {
      features: [
        { properties: { name: "Barcelona", countrycode: "ES", county: "Barcelona", state: "Catalunya", osm_value: "city", type: "city" } },
        { properties: { name: "Barcelona", countrycode: "ES", state: "Catalunya", osm_value: "administrative", type: "county" } },
        { properties: { name: "Gràcia", countrycode: "ES", state: "Catalunya", osm_value: "suburb", type: "district" } },
      ],
    };
    expect(suggestionsFromPhoton(photon)).toEqual([{ city: "Barcelona", province: "Cataluña", label: "Barcelona, Cataluña, España" }]);
    expect(suggestionsFromNominatim([{ address: { city: "Bilbao", province: "Bizkaia", state: "Euskadi", country_code: "es" } }])).toEqual([
      { city: "Bilbao", province: "País Vasco", label: "Bilbao, País Vasco, España" },
    ]);
  });

  it("autosaves partial investor drafts so an Enter-added sector persists", () => {
    const partial = { photo: "", city: "", province: "", investorType: "", ticket: "", sectors: "Hostelería", thesis: "", contribution: "", stake: "" };
    expect(investorProfileDraftSchema.safeParse(partial).success).toBe(true);
    expect(investorProfileSchema.safeParse(partial).success).toBe(false);
    expect(investorProfileDraftSchema.safeParse({ ...partial, stake: "Todo" }).success).toBe(false);
    expect(read("src/app/(app)/inversor/perfil/actions.ts")).toMatch(/saveInvestorProfileLiveAction[\s\S]*investorProfileDraftSchema\.safeParse/);
    const combo = read("src/components/investor/sector-combobox.tsx");
    expect(combo).toMatch(/isComposing/);
    expect(combo).toMatch(/event\.key === "Enter"[\s\S]*event\.preventDefault\(\)/);
  });

  it("keeps Eliminar cuenta fields shrinking with the button on the right", () => {
    const account = read("src/components/account/account-settings.tsx");
    expect(account).toMatch(/flex-\[1_1_20rem\]/);
    expect(account).toMatch(/ml-auto shrink-0/);
    expect(account).toMatch(/placeholder=\{authCopy\.nationalIdPlaceholder\}/);
  });

  it("drops headcount and Verificado from marketplace cards", () => {
    const card = read("src/components/investor/market-card.tsx");
    expect(card).not.toMatch(/>Verificado</);
    expect(card).not.toMatch(/project\.verified \?/);
    expect(card).not.toMatch(/trab\./);
    expect(card).toMatch(/project\.region/);
  });

  it("uses an example CIF placeholder in the Nueva empresa dialog and a blob avatar in the preview", () => {
    expect(read("src/components/seller/company-switcher.tsx")).toMatch(/placeholder=\{sellerCopy\.addCompanyCifPlaceholder\}/);
    expect(read("src/components/investor/investor-public-card.tsx")).toMatch(/fallbackPhoto \|\| gazeAvatarUrl\(label\)/);
  });
});
