import { describe, expect, it } from "vitest";
import { syntheticWorkbook } from "@/lib/sabi/__fixtures__/synthetic";
import { cnaeCatalogCode, mapSabiReport } from "@/lib/sabi/mapping";
import { parseSabiWorkbook } from "@/lib/sabi/parse";
import { buildSabiPreview } from "@/lib/sabi/preview";

describe("cnaeCatalogCode", () => {
  it("turns SABI's 4-digit CNAE into the catalog's NN.NN form", () => {
    expect(cnaeCatalogCode("7490")).toBe("74.90");
    expect(cnaeCatalogCode(" 4634 ")).toBe("46.34");
    expect(cnaeCatalogCode("74.90")).toBe("74.90");
    expect(cnaeCatalogCode("541990")).toBe("541990");
  });
});

describe("buildSabiPreview", () => {
  it("builds the preview from the parsed report and flags CIF and seller-year clashes", async () => {
    const parsed = await parseSabiWorkbook(syntheticWorkbook());

    if (!parsed.ok) {
      throw new Error(parsed.code);
    }

    const mapping = mapSabiReport(parsed.report);
    const year = mapping.years[0]!.year;
    const preview = buildSabiPreview(parsed.report, mapping, { cif: "B00000000", sellerClosedYears: [year] }, "x".repeat(300));

    expect(preview.fileName).toHaveLength(200);
    expect(preview.years.map((row) => row.year)).toEqual(mapping.years.map((row) => row.year));
    expect(preview.years.find((row) => row.year === year)?.replacesSeller).toBe(true);
    expect(preview.warnings.some((warning) => warning.includes("Se sustituyen"))).toBe(true);

    if (parsed.report.identity.cif) {
      expect(preview.warnings[0]).toContain("no coincide");
    }
  });
});
