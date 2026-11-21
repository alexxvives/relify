import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

const questionsTab = '[role="tab"][aria-controls="panel-questions"]:visible';

test.describe("S40 asesor", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("advisor"), "Set E2E_ADVISOR_EMAIL and E2E_ADVISOR_PASSWORD");
    expect(await signInAs(page, "advisor")).toBe(true);
  });

  test("Inicio lives at /inicio and /mandatos redirects there", async ({ page }) => {
    await page.goto("/mandatos");
    await page.waitForURL(/\/inicio$/);
  });

  test("a paid encargo uses the buyer tabs and no quick links", async ({ page }) => {
    await page.goto("/mandatos/venta");
    await expect(page.locator("[data-advisor-quick-links]")).toHaveCount(0);
    const link = page.locator('a[href^="/mandatos/venta/"]').first();
    test.skip((await link.count()) === 0, "No paid encargos for this advisor");
    await link.click();
    await page.waitForURL(/\/mandatos\/venta\/.+/);
    await expect(page.locator(questionsTab).first()).toBeVisible();
    await expect(page.locator('[role="tab"][aria-controls="panel-meetings"]:visible').first()).toBeVisible();
  });
});

test.describe("S40 vendedor", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
  });

  test("the process list has no Chat / Reuniones toggles and the ficha has tabs", async ({ page }) => {
    await page.goto("/mi-empresa/procesos");
    await expect(page.getByRole("button", { name: /^Chat \/ Documentos/ })).toHaveCount(0);
    const ficha = page.locator('a[href^="/mi-empresa/procesos/"]').first();
    test.skip((await ficha.count()) === 0, "No open processes for this seller");
    await ficha.click();
    await page.waitForURL(/\/mi-empresa\/procesos\/.+/);
    await expect(page.locator(questionsTab).first()).toBeVisible();
    await expect(page.locator("[data-advisor-buyer-overlay]")).toHaveCount(1);
  });
});
