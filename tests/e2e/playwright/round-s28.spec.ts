import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S28", () => {
  test("Tendencias is an image grid without lane tabs or the diary link", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
    await page.goto("/tendencias");
    await page.waitForLoadState("networkidle");
    const cards = page.locator("article").filter({ has: page.locator("img") });
    await expect(cards.first()).toBeVisible();
    await expect(page.getByRole("tablist")).toHaveCount(0);
    await expect(page.getByText("Abrir el diario")).toHaveCount(0);
    if (page.viewportSize()!.width >= 1280) {
      const tops = await cards.evaluateAll((nodes) => nodes.slice(0, 3).map((node) => Math.round(node.getBoundingClientRect().top)));
      expect(new Set(tops).size, "first three cards share a row at 1280").toBe(1);
    }
  });

  test("Resumen de tu actividad stays on one row from tablet up", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
    await page.goto("/inversor");
    const row = page.locator("[data-activity-row]").first();
    await expect(row).toBeVisible();
    const tops = await row.locator(":scope > li").evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().top)));
    expect(tops.length).toBeGreaterThan(1);
    expect(new Set(tops).size, "tiles never wrap to a second row").toBe(1);
    const scrolls = await row.evaluate((node) => node.scrollWidth > node.clientWidth + 1);
    if (page.viewportSize()!.width >= 768) {
      expect(scrolls, "no sideways scroll at tablet/desktop").toBe(false);
    }
  });

  test("asesoramiento buttons are always clickable", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
    await page.goto("/asesoramiento");
    await page.waitForLoadState("networkidle");
    const request = page.getByRole("button", { name: /solicitar|pedir|contactar/i }).first();
    if (await request.count()) {
      await expect(request).toBeEnabled();
    }
  });

  test("S42: Mis procesos cards no longer carry Contacta con un asesor", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
    await page.goto("/procesos");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("[data-advisor-link]")).toHaveCount(0);
  });
});
