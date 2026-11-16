import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sellerDraftAutosaveRevalidatePaths } from "@/lib/seller-draft-cache";

describe("seller draft autosave revalidation", () => {
  it("does not revalidate the current /mi-empresa/detalles URL", () => {
    expect(sellerDraftAutosaveRevalidatePaths).toEqual(["/mi-empresa"]);
    expect(sellerDraftAutosaveRevalidatePaths).not.toContain("/mi-empresa/detalles");
  });

  it("keeps saveCompanyDraftAction off the current detalles path", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/(app)/mi-empresa/actions.ts"), "utf8");
    const save = source.slice(source.indexOf("export async function saveCompanyDraftAction"), source.indexOf("export async function saveEbitdaAdjustmentsAction"));
    expect(save).toMatch(/sellerDraftAutosaveRevalidatePaths/);
    expect(save).not.toMatch(/revalidatePath\("\/mi-empresa\/detalles"\)/);
  });

  it("does not preload og.jpg in the document head", () => {
    const layout = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(layout).toMatch(/property="og:image"/);
    expect(layout).not.toMatch(/rel="preload"/);
    expect(layout).not.toMatch(/OG_IMAGE_PATH/);
  });
});
