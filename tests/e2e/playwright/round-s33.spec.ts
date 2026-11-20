import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S33 Rellenar con tu web", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
  });

  test("the button opens the website field and never overwrites the description on a failure", async ({ page }) => {
    await page.goto("/mi-empresa/detalles");
    await page.waitForLoadState("networkidle");
    const button = page.locator("[data-website-describe]").first();
    await button.scrollIntoViewIfNeeded();
    const textarea = page.locator('textarea[name="description"]');
    const before = (await textarea.count()) > 0 ? await textarea.inputValue() : null;
    await button.click();
    const field = page.getByLabel("Web de tu empresa");
    await expect(field).toBeVisible();
    // A private address is refused before any fetch or AI call (and next dev has no AI binding at all).
    await field.fill("http://127.0.0.1");
    page.once("dialog", (dialog) => void dialog.accept());
    await page.getByRole("button", { name: "Rellenar", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: /web|redacción/ }).first()).toBeVisible();
    if (before !== null) expect(await textarea.inputValue()).toBe(before);
  });
});

test.describe("S33 asesor profile", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!roleCreds("advisor"), "Set E2E_ADVISOR_EMAIL and E2E_ADVISOR_PASSWORD");
    expect(await signInAs(page, "advisor")).toBe(true);
  });

  test("description, sectors and services live in Tu perfil en el marketplace; RC insurance is recommended", async ({ page }) => {
    await page.goto("/mis-servicios");
    await expect(page.getByRole("heading", { name: "Tu perfil en el marketplace" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Descripción y sectores" })).toBeVisible();
    await expect(page.getByText("Lo que se ve en el marketplace")).toHaveCount(0);
    await expect(page.getByText(/seguro de responsabilidad civil/)).toBeVisible();
  });
});
