import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S37 asesor", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("advisor"), "Set E2E_ADVISOR_EMAIL and E2E_ADVISOR_PASSWORD");
    expect(await signInAs(page, "advisor")).toBe(true);
  });

  test("Mis servicios autosaves Datos corporativos and uploads documents without Editar", async ({ page }) => {
    await page.goto("/mis-servicios");
    const corporate = page.locator("#datos-corporativos");
    await expect(corporate.getByRole("button", { name: "Guardar" })).toHaveCount(0);
    const documents = page.locator("[data-advisor-documents]");
    await expect(documents.locator("[data-upload-tile]")).toBeVisible();
    await expect(documents.getByRole("button", { name: /Editar/ })).toHaveCount(0);
  });

  test("a paid encargo opens under Mis procesos", async ({ page }) => {
    await page.goto("/mandatos/venta");
    const link = page.locator('a[href^="/mandatos/venta/"]').first();
    test.skip((await link.count()) === 0, "No paid encargos for this advisor");
    await link.click();
    await page.waitForURL(/\/mandatos\/venta\//);
    await expect(page.locator('a[aria-current="page"][href="/mandatos/venta"]')).not.toHaveCount(0);
    await expect(page.locator('a[aria-current="page"][href="/mandatos/encargos"]')).toHaveCount(0);
  });
});
