import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S29", () => {
  test("Avisos panel is ~360 px on desktop and spans the screen on phones", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
    await page.goto("/inversor");
    await page.waitForLoadState("networkidle");
    await page.locator('button[aria-label*="avisos"]:visible').first().click();
    const panel = page.getByText("Avisos", { exact: true }).locator("xpath=ancestor::*[contains(@class,'fixed')][1]");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    const width = page.viewportSize()!.width;
    if (width >= 640) {
      expect(box!.width).toBeLessThanOrEqual(361);
    } else {
      expect(box!.width).toBeGreaterThan(width - 30);
    }
  });

  test("activity tile labels fit one line (Solicitudes, not Solicitudes enviadas)", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
    await page.goto("/inversor");
    const row = page.locator("[data-activity-row]").first();
    await expect(row.getByText("Solicitudes", { exact: true })).toBeVisible();
    const lines = await row.locator(":scope > li").evaluateAll((items) =>
      items.map((li) => {
        const label = li.querySelectorAll("p")[1] as HTMLElement;
        return Math.round(label.getBoundingClientRect().height / parseFloat(getComputedStyle(label).lineHeight));
      }),
    );
    if (page.viewportSize()!.width >= 768) {
      expect(lines.every((count) => count === 1), `label lines ${lines.join(",")}`).toBe(true);
    }
  });

  test("landing activity cards show only the industry tag, level with the Interés line", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const section = page.locator("#actividad");
    await section.evaluate((node) => node.scrollIntoView({ block: "center" }));
    const result = await section.evaluate((node) => {
      const card = node.querySelector("article");
      if (!card) return null;
      const tags = card.querySelectorAll("[data-sector-tag]");
      const tag = tags[0]?.getBoundingClientRect();
      const line = card.querySelector("p")?.getBoundingClientRect();
      return {
        tags: tags.length,
        ebitda: (card.textContent ?? "").includes("EBITDA"),
        delta: tag && line ? Math.abs(tag.top - line.top) : 99,
      };
    });
    expect(result).not.toBeNull();
    expect(result!.tags).toBe(1);
    expect(result!.ebitda).toBe(false);
    expect(result!.delta, "tag top level with the Interés / Conexión line").toBeLessThan(4);
  });
});
