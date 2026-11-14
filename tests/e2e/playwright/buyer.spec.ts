import { expect, test } from "@playwright/test";
import { expectNoIdentityLeak, roleCreds, signInAs } from "./helpers";

test.describe("buyer marketplace", () => {
  test("browse, filter, ficha, NDA gate, no identity leak", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    const signedIn = await signInAs(page, "investor");
    expect(signedIn).toBe(true);
    await page.goto("/mercado");
    await expect(page.locator("body")).toContainText(/facturación|ebitda|empresas/i);
    const filter = page.getByRole("button", { name: /filtro|sector|región/i }).first();
    if (await filter.count()) {
      await filter.click();
    }
    const applyFilters = page.getByRole("button", { name: /ver empresas/i });
    if (await applyFilters.isVisible().catch(() => false)) {
      await applyFilters.click();
    }
    const card = page.locator("a[href*='/proyectos/']").first();
    await expect(card).toBeAttached({ timeout: 15_000 });
    await card.click({ force: true });
    await expect(page).toHaveURL(/\/proyectos\//);
    await expectNoIdentityLeak(page);
    await expect(page.locator("body")).toContainText(/facturación|ebitda|conectar|solicitud/i);
  });

  test("LOI sign dialog skips DNI when national_id is already stored", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    const signedIn = await signInAs(page, "investor");
    expect(signedIn).toBe(true);
    await page.goto("/procesos");
    await expect(page.locator(".shell-content")).toBeVisible({ timeout: 20_000 });
    const loiButtons = page.getByRole("button", { name: /proceder al loi|firmar loi/i });
    const consultoria = page.locator("li").filter({ hasText: /consultoría servicios/i }).filter({ has: loiButtons }).first();
    const anyLoi = page.locator("li").filter({ has: loiButtons }).first();
    const scope = (await consultoria.count()) > 0 ? consultoria : anyLoi;
    await expect(scope).toBeVisible({ timeout: 15_000 });
    const proceed = scope.getByRole("button", { name: /proceder al loi/i });
    if (await proceed.isVisible().catch(() => false)) {
      await proceed.click();
    }
    await scope.getByRole("button", { name: /firmar loi/i }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: /carta de intenciones/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[name="nationalId"]')).toHaveCount(0);
    await expect(dialog.getByText(/dni\/nie/i)).toHaveCount(0);
  });
});
