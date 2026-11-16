import { expect, test, type Page } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

async function box(page: Page, selector: string) {
  const found = await page.locator(selector).first().boundingBox();
  expect(found, selector).not.toBeNull();
  return found!;
}

test.describe("S31 seller pages", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
  });

  test("Detalles uses the full page width at 1600 and has no empty spacer at the end", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto("/mi-empresa/detalles");
    await page.waitForLoadState("networkidle");
    const panel = await box(page, "#panel-basic");
    expect(panel.x + panel.width, "panel reaches the right side").toBeGreaterThan(1600 - 64);
    expect(await page.evaluate(() => document.querySelectorAll('[class*="h-[40vh]"]').length)).toBe(0);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight }));
    const lastPanelBottom = await page.evaluate(() => {
      const panels = [...document.querySelectorAll('form section[id^="panel-"], form [id^="panel-"]')].filter((node) => node.getBoundingClientRect().height > 0);
      return Math.max(...panels.map((node) => node.getBoundingClientRect().bottom));
    });
    expect(900 - lastPanelBottom, "no tall empty block under the last panel").toBeLessThan(120);
  });

  test("Datos de la ficha: 3 × 2 metrics by column, tag in the price card corner, sheet without Cerrar", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto("/mi-empresa/detalles");
    await page.waitForLoadState("networkidle");
    const grid = page.locator("[data-ficha-metrics]");
    await grid.scrollIntoViewIfNeeded();
    const labels = ["Precio de venta", "Facturación", "EBITDA", "Margen EBITDA", "EBITDA ajustado", "Margen EBITDA ajustado"];
    const spots = await grid.evaluate((node, names) => {
      const tiles = [...node.children] as HTMLElement[];
      return names.map((name) => {
        const tile = tiles.find((item) => item.querySelector("span.font-semibold")?.textContent?.trim() === name);
        const rect = tile?.getBoundingClientRect();
        return rect ? { x: Math.round(rect.left), y: Math.round(rect.top) } : null;
      });
    }, labels);
    expect(spots.every(Boolean), JSON.stringify(spots)).toBe(true);
    const [price, revenue, ebitda, margin, adjusted, adjustedMargin] = spots as { x: number; y: number }[];
    expect(price.x).toBe(revenue.x);
    expect(ebitda.x).toBe(margin.x);
    expect(adjusted.x).toBe(adjustedMargin.x);
    expect(price.x).toBeLessThan(ebitda.x);
    expect(ebitda.x).toBeLessThan(adjusted.x);
    expect(price.y).toBe(ebitda.y);
    expect(ebitda.y).toBe(adjusted.y);
    expect(revenue.y).toBeGreaterThan(price.y);
    await expect(grid.getByText("EBITDA ajustado", { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]")).not.toContainText("—");

    const tag = page.locator("#panel-asking-price [data-price-standing]");
    if (await tag.count()) {
      const card = await box(page, "#panel-asking-price");
      const corner = (await tag.boundingBox())!;
      expect(card.x + card.width - (corner.x + corner.width), "tag hugs the right edge").toBeLessThan(24);
      expect(corner.y - card.y, "tag sits in the top row").toBeLessThan(32);
    }

    await page.getByRole("button", { name: "Editar Precio de venta" }).click();
    const sheet = page.locator("[data-asking-price-sheet]");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Cerrar" })).toHaveCount(1);
    await expect(sheet.locator("button", { hasText: /^Cerrar$/ })).toHaveCount(0);
    await sheet.getByRole("button", { name: "Cerrar" }).click();
    await expect(sheet).toBeHidden();
  });

  test("the metrics stack in pairs on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/mi-empresa/detalles");
    await page.waitForLoadState("networkidle");
    const grid = page.locator("[data-ficha-metrics]");
    await grid.scrollIntoViewIfNeeded();
    const order = await grid.evaluate((node) => [...node.children].map((item) => item.querySelector("span.font-semibold")?.textContent?.trim()));
    expect(order).toEqual(["Precio de venta", "Facturación", "EBITDA", "Margen EBITDA", "EBITDA ajustado", "Margen EBITDA ajustado"]);
    const width = await grid.evaluate((node) => node.scrollWidth - node.clientWidth);
    expect(width).toBeLessThanOrEqual(0);
  });

  test("the upload zone is the first tile with the size of a document sheet", async ({ page }) => {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/mi-empresa/documentos");
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: /Corporativo/ }).first().click();
      const tile = page.locator("[data-upload-tile]");
      await expect(tile).toBeVisible();
      expect(await tile.evaluate((node) => node.parentElement?.firstElementChild === node)).toBe(true);
      const zone = await box(page, "[data-upload-tile] .upl-zone");
      const cell = await box(page, "[data-upload-tile]");
      expect(Math.abs(zone.height / zone.width - 1.414)).toBeLessThan(0.03);
      // Same cap as .releva-doc-sheet: 11.5rem (the root font size is not always 16 px).
      const rem = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
      expect(Math.abs(zone.width - Math.min(11.5 * rem, cell.width))).toBeLessThan(1);
    }
  });

  test("the financial-data wait card is compact, untagged and centred", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/mi-empresa");
    await page.waitForLoadState("networkidle");
    const pending = page.locator("[data-financials-pending]");
    test.skip(!(await pending.count()), "this seller already has financials");
    const area = (await pending.boundingBox())!;
    expect(area.height).toBeLessThanOrEqual(360);
    const status = pending.getByRole("status");
    await expect(status).not.toContainText("Pendiente");
    const card = (await status.boundingBox())!;
    const button = (await status.getByRole("link", { name: "Detalles de empresa" }).boundingBox())!;
    expect(Math.abs(card.x + card.width / 2 - (button.x + button.width / 2))).toBeLessThan(3);
    const clock = (await status.locator("svg").first().boundingBox())!;
    const text = (await status.locator("p").first().locator("xpath=..").boundingBox())!;
    expect(Math.abs(clock.y + clock.height / 2 - (text.y + text.height / 2))).toBeLessThan(3);
  });
});
