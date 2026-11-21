import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

const tab = (id: string) => `[role="tab"][aria-controls="panel-${id}"]:visible`;

test.describe("S41 vendedor", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
  });

  test("process cards keep their actions top right and the ficha filter swaps in place", async ({ page }, info) => {
    await page.goto("/mi-empresa/procesos");
    await page.getByRole("heading", { name: "Procesos activos" }).waitFor();
    const card = page.locator("[data-process-card-header]").first();
    test.skip((await card.count()) === 0, "No open processes for this seller");
    await expect(card.locator("[data-process-card-actions]")).toBeVisible();
    await card.locator('a[href^="/mi-empresa/procesos/"]').first().click();
    await page.waitForURL(/\/mi-empresa\/procesos\/.+/);
    // Información de la empresa: no buyer filter; the card starts open on desktop.
    await expect(page.locator("[data-buyer-filter]")).toHaveCount(0);
    if (info.project.name.startsWith("desktop")) {
      await expect(page.locator("[data-advisor-buyer-overlay]")).toHaveAttribute("data-open", "true");
    }
    await page.locator(tab("questions")).first().click();
    await expect(page.locator("[data-advisor-buyer-overlay]")).toHaveAttribute("data-open", "false");
    const filter = page.locator("[data-buyer-filter]");
    if ((await filter.count()) > 0) {
      await page.evaluate(() => ((window as unknown as { s41Marker: boolean }).s41Marker = true));
      const before = page.url();
      await filter.locator("button").first().click();
      await page.getByRole("option").nth(1).click();
      await expect.poll(() => page.url()).not.toBe(before);
      expect(await page.evaluate(() => (window as unknown as { s41Marker?: boolean }).s41Marker)).toBe(true);
    }
  });
});

test.describe("S41 comprador", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
  });

  test("Mis procesos cards have no Chat / Reuniones toggles", async ({ page }) => {
    await page.goto("/procesos");
    await expect(page.getByRole("button", { name: /^Chat \/ Documentos/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Reuniones/ })).toHaveCount(0);
  });
});
