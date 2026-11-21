import { expect, test } from "@playwright/test";

test.describe("S42 landing and marketplace", () => {
  test("the header pill is opaque and Prueba gratis goes to the lista de espera", async ({ page }, info) => {
    await page.goto("/");
    const pill = page.locator("[data-releva-menu]");
    const background = await pill.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(background).toMatch(/0\.86\)$/);
    if (info.project.name.startsWith("desktop")) {
      await expect(pill.getByRole("link", { name: "Prueba gratis" })).toHaveAttribute("href", "/lista-de-espera");
    }
  });
});
