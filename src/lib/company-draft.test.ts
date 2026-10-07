import { describe, expect, it } from "vitest";
import { centsToEuroInput, companyDraftSchema, emptyClosedYear, emptyCompanyDraft, emptyForecastYear, eurosToCents, placeStatementsOnWindow, projectSlug } from "./company-draft";

function draft(overrides: Record<string, unknown>) {
  return { ...emptyCompanyDraft(), ...overrides };
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

    expect(placed.closedYears.map((year) => year.year)).toEqual(["2023", "2024", "2025"]);
    expect(placed.closedYears.map((year) => year.sales)).toEqual(["830000", "920000", "1010000"]);
    expect(placed.closedYears[1]?.equity).toBe("100");
    expect(placed.closedYears[2]?.equity).toBe("");
    expect(placed.forecastYear.year).toBe("2026");
    expect(placed.forecastYear.sales).toBe("");
  });
});
