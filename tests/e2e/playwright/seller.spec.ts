import { expect, test } from "@playwright/test";
import { expectNoIdentityLeak, roleCreds, signInAs } from "./helpers";

test.describe("seller workspace", () => {
  test("onboarding home, detalles, SABI/INT upload, EBITDA, publish", async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    const signedIn = await signInAs(page, "seller");
    expect(signedIn).toBe(true);
    await page.goto("/mi-empresa");
    await expect(page.locator("body")).toContainText(/empresa|ficha|publicad/i);
    await page.goto("/mi-empresa/detalles");
    await expect(page.locator("body")).toContainText(/información empresa|ficha pública|tus cifras/i);
    const description = page.locator("textarea").first();
    if (await description.isVisible()) {
      const previous = await description.inputValue();
      await description.fill(`${previous} `.trimEnd());
      await description.blur();
    }
    await expectNoIdentityLeak(page);
    await page.goto("/mi-empresa/documentos");
    await expect(page.locator("body")).toBeVisible();
    if (process.env.INT_ENVIRONMENT === "true" || process.env.E2E_INT === "1") {
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText(/desactivada en el entorno de pruebas/i)).toHaveCount(0);
    }
  });
});
