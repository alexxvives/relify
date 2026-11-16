import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { companyDraftSchema, emptyCompanyDraft } from "@/lib/company-draft";
import { publishChecklist } from "@/lib/publish-checklist";
import { addSector, filterSectors, sectorJoiner, splitSectors } from "@/lib/sector-picks";
import { completionProgress, sellerRequiredFields } from "@/lib/seller-completion";
import {
  formatLocation,
  matchProvince,
  parseLocation,
  resolveProvince,
  suggestionsFromNominatim,
  suggestionsFromPhoton,
} from "@/lib/spain-places";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const sectors = ["Industria manufacturera", "Comercio", "Hostelería", "Información y comunicaciones"];

describe("S25 Ubicación (OpenStreetMap)", () => {
  it("formats and parses one location field into city and province", () => {
    // S26: shown as "Ciudad, Comunidad, España" (a legacy stored province maps to its community).
    expect(formatLocation("Sabadell", "Barcelona")).toBe("Sabadell, Cataluña, España");
    expect(formatLocation("Madrid", "Madrid")).toBe("Madrid, Comunidad de Madrid, España");
    expect(formatLocation("", "Girona")).toBe("Cataluña, España");
    expect(parseLocation("  Sabadell ,  Barcelona ")).toEqual({ city: "Sabadell", province: "Barcelona" });
    expect(parseLocation("Pueblo sin provincia")).toEqual({ city: "Pueblo sin provincia", province: "" });
    expect(parseLocation("Santa Coloma, de Gramenet, Barcelona")).toEqual({ city: "Santa Coloma, de Gramenet", province: "Barcelona" });
  });

  it("matches provinces with accents, co-official names and single-province communities", () => {
    expect(matchProvince("cadiz")).toBe("Cádiz");
    expect(matchProvince("A Coruña")).not.toBeNull();
    expect(matchProvince("Gerona")).toBe(matchProvince("Girona"));
    expect(matchProvince("Atlantis")).toBeNull();
    expect(resolveProvince({ city: "Oviedo", state: "Asturias" })).not.toBe("");
  });

  it("keeps only Spanish places from Photon and Nominatim and removes duplicates", () => {
    const photon = {
      features: [
        { properties: { name: "Sabadell", countrycode: "ES", county: "Barcelona", state: "Cataluña", osm_value: "town", type: "city" } },
        { properties: { name: "Sabadell", countrycode: "ES", county: "Barcelona", state: "Cataluña", osm_value: "town", type: "city" } },
        { properties: { name: "Perpignan", countrycode: "FR", osm_value: "city", type: "city" } },
        { properties: { name: "Calle Mayor", countrycode: "ES", osm_value: "residential", type: "street" } },
      ],
    };
    expect(suggestionsFromPhoton(photon)).toEqual([{ city: "Sabadell", province: "Cataluña", label: "Sabadell, Cataluña, España" }]);
    expect(suggestionsFromPhoton(null)).toEqual([]);
    const nominatim = [
      { name: "Úbeda", address: { town: "Úbeda", province: "Jaén", state: "Andalucía", country_code: "es" } },
      { name: "Porto", address: { city: "Porto", country_code: "pt" } },
    ];
    expect(suggestionsFromNominatim(nominatim)).toEqual([{ city: "Úbeda", province: "Andalucía", label: "Úbeda, Andalucía, España" }]);
    expect(suggestionsFromNominatim({})).toEqual([]);
  });

  it("allows both OSM hosts in connect-src and shows the attribution", () => {
    const csp = read("src/lib/security-headers.ts");
    expect(csp).toMatch(/https:\/\/photon\.komoot\.io/);
    expect(csp).toMatch(/https:\/\/nominatim\.openstreetmap\.org/);
    expect(read("src/components/ui/place-autocomplete.tsx")).toMatch(/openstreetmap\.org\/copyright/);
  });
});

describe("S25 Añadir sector combobox", () => {
  it("filters known sectors ignoring accents and the ones already chosen", () => {
    expect(filterSectors(sectors, ["Comercio"], "hosteleria")).toEqual(["Hostelería"]);
    expect(filterSectors(sectors, ["Comercio"], "")).not.toContain("Comercio");
  });

  it("adds a known sector with its label and a custom one as typed", () => {
    expect(addSector([], "  comercio ", sectors)).toEqual({ ok: true, next: ["Comercio"] });
    expect(addSector(["Comercio"], "energía solar", sectors)).toEqual({ ok: true, next: ["Comercio", "Energía solar"] });
  });

  it("rejects empty, duplicate (accent-insensitive) and too-long values", () => {
    expect(addSector([], "   ", sectors)).toEqual({ ok: false, reason: "empty" });
    expect(addSector(["Hostelería"], "HOSTELERIA", sectors)).toEqual({ ok: false, reason: "duplicate" });
    expect(addSector(["a".repeat(150)], "Otro sector largo", sectors)).toEqual({ ok: false, reason: "too-long" });
  });

  it("round-trips the stored value", () => {
    expect(splitSectors(["Comercio", "Hostelería"].join(sectorJoiner))).toEqual(["Comercio", "Hostelería"]);
    expect(splitSectors("")).toEqual([]);
    // The joiner character cannot sneak into a custom sector.
    expect(addSector([], "a · b", sectors)).toEqual({ ok: true, next: ["A b"] });
  });
});

describe("S25 seller wizard saves partial data and only publishing checks", () => {
  it("saves without a region, project name or a complete postal code", () => {
    const parsed = companyDraftSchema.safeParse({ ...emptyCompanyDraft(), city: "Sabadell", postalCode: "082" });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.postalCode).toBe("");
  });

  it("saves many secondary CNAEs (SABI can return more than four)", () => {
    const parsed = companyDraftSchema.safeParse({ ...emptyCompanyDraft(), principalCnae: "43.12", secondaryCnaes: ["43.21", "43.22", "43.29", "43.31", "43.32", "43.33"] });
    expect(parsed.success).toBe(true);
  });

  it("lists Ubicación as required to publish when it is missing", () => {
    const base = {
      saleReason: "jubilacion",
      description: "",
      principalCnae: "",
      customerBase: "",
      productPercents: [],
      clientPercents: [],
      askingPrice: "",
    };
    const missing = completionProgress(sellerRequiredFields({ ...base, location: false })).missing.map((item) => item.label);
    expect(missing).toContain("Ubicación");
    const filled = completionProgress(sellerRequiredFields({ ...base, location: true })).missing.map((item) => item.label);
    expect(filled).not.toContain("Ubicación");
    expect(sellerRequiredFields(base).some((field) => field.id === "panel-location")).toBe(false);
  });

  it("adds Ubicación to the publish checklist only when the location is known to be missing", () => {
    const panels = { identity: true, description: true, price: true } as Parameters<typeof publishChecklist>[0]["panels"];
    expect(publishChecklist({ panels, saleReason: true, sellerFinancing: true }).ready).toBe(true);
    const list = publishChecklist({ panels, saleReason: true, sellerFinancing: true, location: false });
    expect(list.ready).toBe(false);
    expect(list.missing).toEqual(["Ubicación"]);
  });

  it("no longer points a failed save at Razón de venta (root cause of the retry loop)", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    expect(form).not.toMatch(/panelRejected\(/);
    expect(form).not.toMatch(/key=\{`sale-reason-\$\{attempt/);
    expect(form).toMatch(/function retrySave\(\)/);
    expect(form).toMatch(/onRetry=\{state && !state\.saved \? retrySave : undefined\}/);
    expect(form).toMatch(/data-publish-missing/);
  });

  it("moves Datos de la ficha after Estructura", () => {
    const form = read("src/components/seller/company-draft-form.tsx");
    const structure = form.indexOf("step={2}");
    const ficha = form.indexOf("step={3}");
    expect(structure).toBeGreaterThan(-1);
    expect(ficha).toBeGreaterThan(structure);
    expect(form.slice(structure - 400, structure)).toMatch(/structure/i);
  });
});

describe("S25 density and ficha", () => {
  it("shows 3 market cards per row from ~1024 px and 4 on wide screens", () => {
    const card = read("src/components/investor/market-card.tsx");
    expect(card).toMatch(/@\[44rem\]\/market:grid-cols-3/);
    expect(card).toMatch(/@\[72rem\]\/market:grid-cols-4/);
  });

  it("keeps plan prices on one line", () => {
    expect(read("src/components/investor/premium-plans.tsx")).toMatch(/function PlanPrice[\s\S]*whitespace-nowrap/);
  });

  it("renders ficha sections always open, with the intro as an info tooltip", () => {
    const report = read("src/components/seller/company-report.tsx");
    expect(report).toMatch(/<InfoHint text=\{intro\}/);
    expect(read("src/components/ui/gooey-nav/GooeyNav.css")).toMatch(/gooey-nav__list--active[\s\S]*user-select: none/);
  });
});
