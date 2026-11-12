import { describe, expect, it } from "vitest";
import { descriptionMaxLength } from "@/lib/company-profile";
import { centsToEuroInput, companyDraftSchema, emptyClosedYear, emptyCompanyDraft, emptyForecastYear, eurosToCents, placeStatementsOnWindow, projectSlug } from "@/lib/company-draft";

function draft(overrides: Record<string, unknown>) {
  return { ...emptyCompanyDraft(), saleReason: "jubilacion", ...overrides };
}

describe("company draft money and slug", () => {
  it("stores euros as cents and builds a public slug", () => {
    expect(eurosToCents("1250000")).toBe(125_000_000);
    expect(eurosToCents("1250000,5")).toBe(125_000_050);
    expect(eurosToCents("-1250,5")).toBe(-125_050);
    expect(centsToEuroInput(125_000_050)).toBe("1250000,50");
    expect(centsToEuroInput(-125_050)).toBe("-1250,50");
    expect(projectSlug("Proyecto Árbol Norte")).toBe("proyecto-arbol-norte");
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120,5",
      askingPrice: "800",
    })).success).toBe(true);
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1.000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
    })).success).toBe(false);
  });

  it("accepts a Spanish postal code and city without a street", () => {
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Cataluña",
      postalCode: "08022",
      city: "Barcelona",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
    })).success).toBe(true);
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Cataluña",
      postalCode: "8022",
      city: "Barcelona",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
    })).success).toBe(false);
  });

  it("saves a partial draft without a sale reason (t78)", () => {
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
      saleReason: "",
    })).success).toBe(true);
  });

  it("requires shareholder percents to sum to 100", () => {
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
      capitalPercents: ["60", "40"],
    })).success).toBe(true);
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
      capitalPercents: ["60", "30"],
    })).success).toBe(false);
  });

  it("keeps client shares when the company sells to consumers", () => {
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
      customerBase: "consumer",
    })).success).toBe(true);
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
      customerBase: "consumer",
      clientPercents: ["60", "40"],
    })).success).toBe(true);
    expect(companyDraftSchema.safeParse(draft({
      codename: "Proyecto Norte",
      region: "Galicia",
      revenue: "1000",
      ebitda: "100",
      adjustedEbitda: "120",
      askingPrice: "800",
      customerBase: "consumer",
      clientPercents: ["40"],
    })).success).toBe(true);
  });

  it("keeps the latest closed exercises and moves a finished forecast into them", () => {
    const older = emptyClosedYear("2022");
    older.sales = "740000";
    const middle = emptyClosedYear("2023");
    middle.sales = "830000";
    const recent = emptyClosedYear("2024");
    recent.sales = "920000";
    recent.equity = "100";
    const forecast = emptyForecastYear("2025");
    forecast.sales = "1010000";
    const placed = placeStatementsOnWindow([older, middle, recent], forecast, new Date("2026-10-06T12:00:00"));

    expect(placed.closedYears.map((year) => year.year)).toEqual(["2022", "2023", "2024", "2025"]);
    expect(placed.closedYears.map((year) => year.sales)).toEqual(["740000", "830000", "920000", "1010000"]);
    expect(placed.closedYears[2]?.equity).toBe("100");
    expect(placed.closedYears[3]?.equity).toBe("");
    expect(placed.forecastYear.year).toBe("2026");
    expect(placed.forecastYear.sales).toBe("");
  });

  it("keeps four stored closed years even when the calendar window has moved on", () => {
    const years = ["2021", "2022", "2023", "2024"].map((year) => {
      const row = emptyClosedYear(year);
      row.sales = year;
      return row;
    });
    const placed = placeStatementsOnWindow(years, emptyForecastYear("2025"), new Date("2026-10-06T12:00:00"));
    expect(placed.closedYears.map((year) => year.year)).toEqual(["2021", "2022", "2023", "2024"]);
    expect(placed.closedYears.map((year) => year.sales)).toEqual(["2021", "2022", "2023", "2024"]);
  });
});

describe("description length", () => {
  it("saves a partial description and still caps the maximum", () => {
    expect(companyDraftSchema.safeParse(draft({ codename: "Proyecto Norte", region: "Galicia", description: "" })).success).toBe(true);
    expect(companyDraftSchema.safeParse(draft({ codename: "Proyecto Norte", region: "Galicia", description: "Empresa de 29 caracteres." })).success).toBe(true);
    expect(
      companyDraftSchema.safeParse(
        draft({
          codename: "Proyecto Norte",
          region: "Galicia",
          description: "Empresa de servicios industriales con un equipo estable, clientes recurrentes y una descripción que supera el mínimo de doscientos caracteres para que el comprador entienda el negocio, su mercado y cómo genera caja.",
        }),
      ).success,
    ).toBe(true);
    expect(companyDraftSchema.safeParse(draft({ codename: "Proyecto Norte", region: "Galicia", description: "x".repeat(descriptionMaxLength + 1) })).success).toBe(false);
  });
});

describe("empty + rows (t85)", () => {
  it("ignores rows added with + but left empty", () => {
    const parsed = companyDraftSchema.safeParse(draft({ codename: "Proyecto Norte", region: "Galicia", secondaryCnaes: [""], productPercents: ["", " "], capitalPercents: [""] }));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.secondaryCnaes).toEqual([]);
      expect(parsed.data.productPercents).toEqual([]);
    }
  });
});
