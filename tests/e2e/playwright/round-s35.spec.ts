import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S35 asesor", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("advisor"), "Set E2E_ADVISOR_EMAIL and E2E_ADVISOR_PASSWORD");
    expect(await signInAs(page, "advisor")).toBe(true);
  });

  test("Inicio shows the seller-style publish status and the mandatory subscription step", async ({ page }) => {
    await page.goto("/mandatos");
    await expect(page.locator("[data-advisor-publish]")).toHaveText(/Tu perfil (no )?está publicado/);
    await expect(page.getByText("Con la ficha lista sales en el marketplace de asesores.")).toHaveCount(0);
    await expect(page.getByText("Suscripción de asesor", { exact: true })).toBeVisible();
    await expect(page.getByText(/Sin suscripción activa/)).toHaveCount(0);
  });

  test("encargos list has no deposit tag and the encargo has no subscription block", async ({ page }) => {
    await page.goto("/mandatos/encargos");
    await expect(page.getByText("Depósito pendiente", { exact: true })).toHaveCount(0);
    const link = page.locator('a[href^="/mandatos/encargos/"]').first();
    test.skip((await link.count()) === 0, "No encargos for this advisor");
    await link.click();
    await expect(page.getByText("Las cifras completas están en las carpetas que te abre el vendedor.")).toHaveCount(0);
    await expect(page.getByText("Solo empieza con tu primer encargo aceptado", { exact: false })).toHaveCount(0);
  });

  test("Mis servicios drops the publish block", async ({ page }) => {
    await page.goto("/mis-servicios");
    await expect(page.getByText(/Para publicarlo falta/)).toHaveCount(0);
  });
});
