import { expect, test } from "@playwright/test";

test.describe("password reset", () => {
  test("forgot-password page accepts an email without revealing whether it exists", async ({ page }) => {
    await page.goto("/olvide-contrasena");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    if (process.env.E2E_ALLOW_MUTATION === "1") {
      await page.locator('input[name="email"]').fill("nobody-e2e@example.com");
      await page.getByRole("button", { name: /enviar enlace/i }).click();
      await expect(page.getByText(/si hay una cuenta/i)).toBeVisible({ timeout: 15_000 });
    }
  });
});
