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

test.describe("S27 Detalles de empresa manual save", () => {
  test("edits stay local until Guardar, leaving warns, Guardar shows the read-only view", async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/mi-empresa/detalles");
    const panel = page.locator("#panel-basic");
    const edit = panel.getByRole("button", { name: "Editar" });
    // The floating progress card can sit over the panel header, so open it with the keyboard.
    if (await edit.isVisible()) await edit.press("Enter");
    const year = panel.locator('input[name="foundedYear"]');
    await expect(year).toBeVisible();
    const original = await year.inputValue();
    const changed = original === "1999" ? "1998" : "1999";
    await year.fill(changed);
    await expect(panel.getByText("Cambios sin guardar")).toBeVisible();
    // No background save: leaving still warns after a pause.
    await page.waitForTimeout(1500);
    await page.getByRole("link", { name: /mis documentos/i }).first().click();
    await expect(page.getByRole("dialog")).toContainText("Tienes cambios sin guardar");
    await page.getByRole("button", { name: "Seguir editando" }).first().click();
    await expect(page).toHaveURL(/\/mi-empresa\/detalles/);
    await panel.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(panel.getByRole("button", { name: "Editar" })).toBeVisible({ timeout: 15_000 });
    await expect(panel.locator('input[name="foundedYear"]')).toHaveCount(0);
    await expect(panel).toContainText(changed);
    await page.reload();
    const again = page.locator("#panel-basic");
    await expect(again).toContainText(changed);
    const reopen = again.getByRole("button", { name: "Editar" });
    if (await reopen.isVisible()) await reopen.press("Enter");
    await again.locator('input[name="foundedYear"]').fill(original);
    await again.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(again.getByRole("button", { name: "Editar" })).toBeVisible({ timeout: 15_000 });
    await expect(again).toContainText(original || "—");
  });

  test("switching to Ficha pública with unsaved edits asks, and Descartar restores the saved value", async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/mi-empresa/detalles");
    const panel = page.locator("#panel-basic");
    const edit = panel.getByRole("button", { name: "Editar" });
    if (await edit.isVisible()) await edit.press("Enter");
    const year = panel.locator('input[name="foundedYear"]');
    const original = await year.inputValue();
    await year.fill(original === "1990" ? "1991" : "1990");
    await page.getByRole("tab", { name: "Ficha pública" }).or(page.getByRole("button", { name: "Ficha pública" })).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Tienes cambios sin guardar");
    await dialog.getByRole("button", { name: "Descartar" }).click();
    await page.getByRole("tab", { name: "Información empresa" }).or(page.getByRole("button", { name: "Información empresa" })).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const reopen = panel.getByRole("button", { name: "Editar" });
    if (await reopen.isVisible()) await reopen.press("Enter");
    await expect(panel.locator('input[name="foundedYear"]')).toHaveValue(original);
  });
});
