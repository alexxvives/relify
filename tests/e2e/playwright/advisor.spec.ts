import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("advisor workspace", () => {
  test("profile and mandatos, quote request surface", async ({ page }) => {
    test.skip(!roleCreds("advisor"), "Set E2E_ADVISOR_EMAIL and E2E_ADVISOR_PASSWORD");
    const signedIn = await signInAs(page, "advisor");
    expect(signedIn).toBe(true);
    await page.goto("/mandatos");
    await expect(page.locator("body")).toContainText(/mandato|encargo|asesor/i);
    await page.goto("/cuenta");
    await expect(page.locator("body")).toContainText(/cuenta|perfil|nombre/i);
  });
});
