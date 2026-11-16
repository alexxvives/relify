import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S27", () => {
  test("blog index has a featured post and a filterable grid", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1, name: "Diario" })).toBeVisible();
    await expect(page.getByText("Destacado")).toBeVisible();
    const filter = page.getByRole("group", { name: "Filtrar por tema" });
    await filter.getByRole("button", { name: "Cuentas" }).click();
    await expect(filter.getByRole("button", { name: "Cuentas" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("section[aria-labelledby='blog-latest'] li").first()).toContainText("Cuentas");
  });

  test("blog post has meta, a table of contents, a CTA and related posts", async ({ page }) => {
    await page.goto("/blog/como-preparar-una-pyme-para-venderla");
    const toc = page.getByRole("navigation", { name: "En este artículo" });
    await expect(toc).toBeVisible();
    const first = toc.getByRole("link").first();
    const href = await first.getAttribute("href");
    expect(href).toMatch(/^#[a-z0-9-]+$/);
    await expect(page.locator(href ?? "#missing")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Vender mi empresa" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sigue leyendo" })).toBeVisible();
  });

  test("deep health check is hidden without a token and the basic one stays public", async ({ request }) => {
    const basic = await request.get("/api/health");
    expect([200, 503]).toContain(basic.status());
    expect(await basic.json()).toHaveProperty("db");
    const deep = await request.get("/api/health/deep");
    expect([401, 404]).toContain(deep.status());
  });

  test("Tendencias is a menu entry and /cuenta has no Guardar button", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/inversor");
    await expect(page.getByRole("link", { name: "Tendencias" }).first()).toBeVisible();
    await page.goto("/cuenta");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /^guardar$/i })).toHaveCount(0);
    await expect(page.getByText("Guardado", { exact: false })).toHaveCount(0);
  });
});
