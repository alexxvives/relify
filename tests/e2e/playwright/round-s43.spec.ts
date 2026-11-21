import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

const tab = (id: string) => `[role="tab"][aria-controls="panel-${id}"]:visible`;

test.describe("S43 vendedor", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
  });

  test("process cards: no bubble on Ver la ficha, Tu turno on one line, Ir al proceso scrolls in place", async ({ page }) => {
    await page.goto("/mi-empresa/procesos");
    const ficha = page.getByRole("link", { name: /^Ver la ficha/ }).first();
    test.skip((await ficha.count()) === 0, "No open processes for this seller");
    await expect(ficha.locator("span")).toHaveCount(0);
    const cue = page.locator("[data-cue-line]").first();
    if ((await cue.count()) > 0 && (page.viewportSize()?.width ?? 0) >= 640) {
      await expect(cue).toHaveCSS("align-items", "center");
    }
    const jump = page.locator("[data-jump-process]").first();
    if ((await jump.count()) > 0) {
      const before = page.url();
      await jump.click();
      await expect(page.locator(".relify-marker").first()).toBeVisible();
      expect(page.url()).toBe(before);
    }
  });

  test("the ficha has Información de la empresa + Compradores, and the filter is centred in the tab bar", async ({ page }) => {
    await page.goto("/mi-empresa/procesos");
    const ficha = page.locator('a[href^="/mi-empresa/procesos/"]').first();
    test.skip((await ficha.count()) === 0, "No open processes for this seller");
    await ficha.click();
    await page.waitForURL(/\/mi-empresa\/procesos\/.+/);
    await expect(page.locator(tab("company")).first()).toBeVisible();
    await page.locator(tab("buyers")).first().click();
    await expect(page.locator("[data-counterparty-panel]").first()).toBeVisible();
    await expect(page.locator("[data-counterparty-meetings]").first()).toBeVisible();
    const filter = page.locator("[data-tab-actions] [data-buyer-filter]");
    if ((await filter.count()) > 0 && (page.viewportSize()?.width ?? 0) >= 640) {
      const bar = await page.locator('[role="tablist"]:visible').first().boundingBox();
      const box = await filter.first().boundingBox();
      if (bar && box) {
        expect(Math.abs(bar.y + bar.height / 2 - (box.y + box.height / 2))).toBeLessThan(6);
      }
    }
  });
});

test.describe("S43 asesor", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("advisor"), "Set E2E_ADVISOR_EMAIL and E2E_ADVISOR_PASSWORD");
    expect(await signInAs(page, "advisor")).toBe(true);
  });

  test("/mandatos/venta has no lanes line; an encargo has Comprador and Vendedor tabs", async ({ page }) => {
    await page.goto("/mandatos/venta");
    await expect(page.getByText(/compradores? en proceso/)).toHaveCount(0);
    const link = page.locator('a[href^="/mandatos/venta/"]').first();
    test.skip((await link.count()) === 0, "No paid encargos for this advisor");
    await link.click();
    await page.waitForURL(/\/mandatos\/venta\/.+/);
    await expect(page.locator(tab("buyer")).first()).toBeVisible();
    await page.locator(tab("seller")).first().click();
    await expect(page.locator('[role="tabpanel"]#panel-seller')).toBeVisible();
  });
});
