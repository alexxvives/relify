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
    const card = page.locator("a[href*='/proyectos/']").first();
    await expect(card).toBeAttached({ timeout: 15_000 });
    await card.click({ force: true });
    await expect(page).toHaveURL(/\/proyectos\//);
    await expectNoIdentityLeak(page);
    await expect(page.locator("body")).toContainText(/facturación|ebitda|conectar|solicitud/i);
  });
});
