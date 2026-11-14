import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const view = readFileSync(path.join(process.cwd(), "src/components/company/company-ficha-view.tsx"), "utf8");
const buyer = readFileSync(path.join(process.cwd(), "src/components/investor/investor-project.tsx"), "utf8");
const seller = readFileSync(path.join(process.cwd(), "src/components/seller/company-draft-form.tsx"), "utf8");

describe("shared company ficha", () => {
  it("is a single module that buyer and seller preview both render", () => {
    expect(view).toMatch(/export function CompanyFichaView/);
    expect(view).toMatch(/<CompanyBanner/);
    expect(view).toMatch(/<InvestorProjectTabs/);
    expect(buyer).toMatch(/from "@\/components\/company\/company-ficha-view"/);
    expect(seller).toMatch(/from "@\/components\/company\/company-ficha-view"/);
    expect(buyer).toMatch(/<CompanyFichaView/);
    expect(seller).toMatch(/<CompanyFichaView/);
    expect(seller).not.toMatch(/<CompanyBanner/);
    expect(buyer).not.toMatch(/<CompanyBanner/);
    expect(seller).toMatch(/<FavoriteButton/);
    expect(seller).toMatch(/companyPdfCopy\.teaserDownload/);
  });
});
