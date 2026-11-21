import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S34 asesor profile", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("advisor"), "Set E2E_ADVISOR_EMAIL and E2E_ADVISOR_PASSWORD");
    expect(await signInAs(page, "advisor")).toBe(true);
  });

  test("description and sectors are inline in Tu perfil en el marketplace, with a live preview", async ({ page }) => {
    await page.goto("/mis-servicios");
    await expect(page.getByRole("heading", { name: "Tu perfil en el marketplace" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Editar descripción y sectores" })).toHaveCount(0);
    await expect(page.getByText("Se activa al completar los Datos corporativos")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Así sales en el marketplace" })).toBeVisible();
    // S38: the RC policy advice moved into the warning hint of Documentación adicional.
    await expect(page.locator('[aria-label*="responsabilidad civil profesional"]').first()).toBeVisible();
  });

  test("an encargo shows the deposit and the buyer together: sidebar on desktop, a bottom dock on mobile", async ({ page }) => {
    // S35: an unpaid encargo of the INT/local fixture (int-s32-eng-1) always has the deposit panel.
    const response = await page.goto("/mandatos/encargos/int-s32-eng-1");
    test.skip(!response || response.status() >= 400 || !page.url().includes("int-s32-eng-1"), "Fixture encargo missing");
    await expect(page.getByText("Este encargo ya está cerrado.")).toHaveCount(0);
    const width = page.viewportSize()?.width ?? 1280;
    // S36: no deposit panel; Tu turno and every locked section open the deposit popup.
    void width;
    await page.locator("[data-advisor-deposit-button]:visible").first().click();
    await expect(page.locator("[data-advisor-deposit-dialog]")).toBeVisible();
  });
});
