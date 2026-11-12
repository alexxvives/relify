import { describe, expect, it } from "vitest";
import { cnaeSection, groupSectorBooks, groupSectors, groupedCnaeOptions } from "./cnae-section";

describe("groupedCnaeOptions", () => {
  it("puts each class under its CNAE section header", () => {
    expect(
      groupedCnaeOptions(
        [
          { code: "10.71", title: "Panadería" },
          { code: "62.01", title: "Programación" },
        ],
        "Elige",
      ),
    ).toEqual([
      { value: "", label: "Elige" },
      { value: "10.71", label: "10.71 — Panadería", group: "Industria" },
      { value: "62.01", label: "62.01 — Programación", group: "Información" },
    ]);
  });
});

describe("cnaeSection", () => {
  it("groups a class code into its CNAE section", () => {
    expect(cnaeSection("10.71")).toEqual({ id: "C", label: "Industria" });
    expect(cnaeSection("46.34")).toEqual({ id: "G", label: "Comercio" });
    expect(cnaeSection("55.10")).toEqual({ id: "I", label: "Hostelería" });
    expect(cnaeSection("25.11")).toEqual({ id: "C", label: "Industria" });
    expect(cnaeSection("no")).toBeNull();
  });
});

describe("groupSectors", () => {
  it("counts published companies by section", () => {
    expect(groupSectors(["10.71", "25.11", "46.34", "55.10"])).toEqual([
      { id: "C", label: "Industria", count: 2 },
      { id: "G", label: "Comercio", count: 1 },
      { id: "I", label: "Hostelería", count: 1 },
    ]);
  });
});

describe("groupSectorBooks", () => {
  it("sizes each sector by the published revenue", () => {
    expect(
      groupSectorBooks([
        { code: "10.71", slug: "proyecto-olivo", codename: "Proyecto Olivo", revenueCents: 800_000_00 },
        { code: "25.11", slug: "proyecto-roble", codename: "Proyecto Roble", revenueCents: 1_200_000_00 },
        { code: "55.10", slug: "proyecto-duna", codename: "Proyecto Duna", revenueCents: 400_000_00 },
      ]),
    ).toEqual([
      {
        id: "C",
        label: "Industria",
        count: 2,
        revenueCents: 2_000_000_00,
        companies: [
          { slug: "proyecto-olivo", codename: "Proyecto Olivo", revenueCents: 800_000_00 },
          { slug: "proyecto-roble", codename: "Proyecto Roble", revenueCents: 1_200_000_00 },
        ],
      },
      {
        id: "I",
        label: "Hostelería",
        count: 1,
        revenueCents: 400_000_00,
        companies: [{ slug: "proyecto-duna", codename: "Proyecto Duna", revenueCents: 400_000_00 }],
      },
    ]);
  });
});
