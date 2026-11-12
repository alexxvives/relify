import { describe, expect, it } from "vitest";
import { sectorImageKeys } from "@/lib/sector-image";
import { bannerChips, foundedChip, sectorBannerBackground, sectorThemes } from "@/lib/sector-theme";

describe("sectorThemes", () => {
  it("has a label and hue for every sector family", () => {
    for (const key of sectorImageKeys) {
      expect(sectorThemes[key].label.length).toBeGreaterThan(0);
      expect(sectorThemes[key].hue).toMatch(/^#[0-9a-f]{6}$/);
      expect(sectorBannerBackground(key)).toContain("#1c2740");
    }
  });
});

describe("bannerChips", () => {
  it("lists sector, region and a coarse founding decade", () => {
    expect(bannerChips({ sector: "hosteleria", region: "Madrid", foundedYear: 1998 })).toEqual(["Hostelería", "Madrid", "Fundada en los 90"]);
    expect(bannerChips({ sector: null, region: " ", foundedYear: "2014" })).toEqual(["Fundada en los 2010"]);
    expect(foundedChip(null)).toBeNull();
  });
});
