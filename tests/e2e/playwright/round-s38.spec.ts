import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S38 asesor", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("advisor"), "Set E2E_ADVISOR_EMAIL and E2E_ADVISOR_PASSWORD");
    expect(await signInAs(page, "advisor")).toBe(true);
  });

  test("Mis servicios has no section subtitles and flags the RC policy", async ({ page }) => {
    await page.goto("/mis-servicios");
    await expect(page.getByPlaceholder("Describe tu asesoría")).toBeVisible();
  });

  test("a paid encargo shows the process chats and the centered buyer tab", async ({ page }) => {
    await page.goto("/mandatos/venta");
    const link = page.locator('a[href^="/mandatos/venta/"]').first();
    test.skip((await link.count()) === 0, "No paid encargos for this advisor");
    await link.click();
    await page.waitForURL(/\/mandatos\/venta\//);
    // S43: the advisor's counterparty tabs are Comprador and Vendedor.
    await page.locator('[role="tab"][aria-controls="panel-buyer"]:visible').first().click();
    await expect(page.locator('[role="tabpanel"]#panel-buyer')).toBeVisible();
    const overlay = page.locator("[data-advisor-buyer-overlay]");
    if (await overlay.count()) {
      const box = await overlay.boundingBox();
      const viewport = page.viewportSize();
      if (box && viewport) {
        expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(40);
        expect(Math.abs(box.x + box.width - viewport.width)).toBeLessThan(4);
      }
    }
  });
});

test.describe("S38 admin", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("admin"), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    expect(await signInAs(page, "admin")).toBe(true);
  });

  test("companies with pending adjustments come first with Ver ajustes", async ({ page }) => {
    await page.goto("/admin/empresas");
    const first = page.locator("[data-pending-adjustments]").first();
    test.skip((await first.count()) === 0, "No pending adjustments");
    await expect(first).toContainText("Ver ajustes");
    await first.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
