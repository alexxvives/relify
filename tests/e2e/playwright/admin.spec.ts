import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("admin", () => {
  test("empresas list and valoraciones queue", async ({ page }) => {
    test.skip(!roleCreds("admin"), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    const signedIn = await signInAs(page, "admin");
    expect(signedIn).toBe(true);
    await page.goto("/admin/empresas");
    await expect(page.locator("body")).toContainText(/empresa|publicad|borrador|pendiente/i);
    await page.goto("/admin/valoraciones");
    await expect(page.getByRole("heading", { name: /valoraciones/i })).toBeVisible();
    await page.goto("/valorar");
    await expect(page.locator('input[name="cif"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /solicitar valoración/i })).toBeVisible();
  });
});
