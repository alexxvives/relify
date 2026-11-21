import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S39 vendedor", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
  });

  test("a checklist deep link lands on its field title and marks it", async ({ page }) => {
    await page.goto("/mi-empresa/detalles?seccion=price&ancla=panel-asking-price");
    const title = page.locator("#panel-asking-price [data-field-title]").first();
    await expect(title).toHaveClass(/relify-marker/);
    await expect(title).toBeInViewport();
  });

  test("the DNI field has no Cambiar button", async ({ page }) => {
    await page.goto("/cuenta");
    await expect(page.locator("#account-national-id")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cambiar" })).toHaveCount(0);
  });
});
