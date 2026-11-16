import { expect, test, type Page } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

async function openDetails(page: Page, width: number) {
  await page.setViewportSize({ width, height: width < 640 ? 844 : 900 });
  await page.goto("/mi-empresa/detalles");
  await page.waitForLoadState("networkidle");
  const panel = page.locator("#panel-basic");
  const edit = panel.getByRole("button", { name: "Editar" });
  if (await edit.isVisible()) await edit.click();
  await expect(panel.locator('textarea[name="description"]')).toBeVisible();
  return panel;
}

test.describe("S30 Detalles de empresa", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
  });

  test("no Falta para publicar block, no Ubicación info hint, one label style", async ({ page }) => {
    const panel = await openDetails(page, 1280);
    await expect(page.getByText("Falta para publicar")).toHaveCount(0);
    await expect(page.locator("#panel-location [role=button]")).toHaveCount(0);
    await expect(panel.getByText("CNAE principal", { exact: true })).toBeVisible();
    await expect(panel.getByText("CNAEs secundarios", { exact: true })).toBeVisible();
    const styles = await page.evaluate(() => {
      const label = (text: string) => [...document.querySelectorAll("#panel-basic span.mb-1, #panel-basic p.mb-1")].find((node) => node.firstChild?.textContent?.trim() === text);
      const pick = (node: Element | undefined) => {
        if (!node) return null;
        const style = getComputedStyle(node);
        const field = node.nextElementSibling ?? node.parentElement?.nextElementSibling;
        const gap = field ? field.getBoundingClientRect().top - node.getBoundingClientRect().bottom : -1;
        return { size: style.fontSize, weight: style.fontWeight, color: style.color, gap: Math.round(gap) };
      };
      return { name: pick(label("Nombre")), description: pick(label("Descripción de la empresa")), principal: pick(label("CNAE principal")), secondary: pick(label("CNAEs secundarios")) };
    });
    expect(styles.name).not.toBeNull();
    for (const key of ["description", "principal", "secondary"] as const) {
      expect(styles[key]?.size, key).toBe(styles.name?.size);
      expect(styles[key]?.weight, key).toBe(styles.name?.weight);
      expect(styles[key]?.color, key).toBe(styles.name?.color);
    }
    expect(styles.principal?.gap).toBeLessThanOrEqual(8);
    expect(styles.secondary?.gap).toBeLessThanOrEqual(8);
  });

  test("Tu progreso floats over the page: opening or minimising it never moves the content", async ({ page }) => {
    for (const width of [390, 1280, 1600]) {
      const panel = await openDetails(page, width);
      const before = await panel.boundingBox();
      // S31: a popover at every width (the slim bar on phones, the round pill from 1024).
      await page.getByRole("button", { name: /^Mostrar tu progreso/ }).click();
      await expect(page.getByRole("navigation", { name: "Tu progreso" })).toBeVisible();
      expect(await panel.boundingBox(), `opened at ${width}`).toEqual(before);
      await page.getByRole("button", { name: "Minimizar tu progreso" }).click();
      await expect(page.getByRole("navigation", { name: "Tu progreso" })).toBeHidden();
      expect(await panel.boundingBox(), `content moved at ${width}`).toEqual(before);
    }
  });
});
