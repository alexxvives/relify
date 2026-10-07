import { describe, expect, it } from "vitest";
import { cnaeSection, groupSectors } from "./cnae-section";

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
