import { expect, test } from "@playwright/test";
import { roleCreds, signInAs } from "./helpers";

test.describe("S27", () => {
  test("blog index has a featured post and a filterable grid", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
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
    if (await edit.isVisible()) await edit.click();
    const year = panel.locator('input[name="foundedYear"]');
    await expect(year).toBeVisible();
    const original = await year.inputValue();
    const changed = original === "1999" ? "1998" : "1999";
    await year.fill(changed);
    await expect(panel.getByRole("button", { name: "Guardar" })).toBeVisible();
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
    if (await reopen.isVisible()) await reopen.click();
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
    if (await edit.isVisible()) await edit.click();
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
    if (await reopen.isVisible()) await reopen.click();
    await expect(panel.locator('input[name="foundedYear"]')).toHaveValue(original);
  });

  test("a short description saves; the read-only view shows what the server stored and Tu progreso keeps it", async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/mi-empresa/detalles");
    await page.waitForLoadState("networkidle");
    const panel = page.locator("#panel-basic");
    const edit = panel.getByRole("button", { name: "Editar" });
    if (await edit.isVisible()) await edit.click();
    const field = panel.locator('textarea[name="description"]');
    const original = await field.inputValue();
    const short = `Obrador de barrio, prueba ${Date.now() % 100000}.`;
    // Trailing spaces show the stored (trimmed) text is what comes back, not what was typed.
    // Clear first and confirm the form is hydrated (an early fill is reset by hydration).
    await field.fill("");
    await expect(field).toHaveValue("");
    await field.fill(`${short}   `);
    await expect(field).toHaveValue(`${short}   `);
    await panel.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(panel.getByRole("button", { name: "Editar" })).toBeVisible({ timeout: 15_000 });
    await expect(panel).toContainText(short);
    await expect(page.locator("form [role=alert]")).toHaveCount(0);
    // S30: the inline Falta para publicar block is gone; the Tu progreso card lists the field instead.
    await expect(page.locator("[data-publish-missing]")).toHaveCount(0);
    await expect(page.locator("[data-section-tracker]")).toContainText("Descripción");
    await page.reload();
    await page.waitForLoadState("networkidle");
    const again = page.locator("#panel-basic");
    await expect(again).toContainText(short);
    const reopen = again.getByRole("button", { name: "Editar" });
    if (await reopen.isVisible()) await reopen.click();
    await expect(again.locator('textarea[name="description"]')).toHaveValue(short);
    await again.locator('textarea[name="description"]').fill(original);
    await expect(again.locator('textarea[name="description"]')).toHaveValue(original);
    await again.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(again.getByRole("button", { name: "Editar" })).toBeVisible({ timeout: 15_000 });
  });

  test("the Tu progreso pill never covers a control at 1024, 1280, 1440, 1536 and 1600", async ({ page }) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD");
    expect(await signInAs(page, "seller")).toBe(true);
    for (const width of [1024, 1280, 1440, 1536, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/mi-empresa/detalles");
      await page.waitForLoadState("networkidle");
      const panel = page.locator("#panel-basic");
      const cancel = panel.getByRole("button", { name: "Cancelar" });
      if (await cancel.isVisible()) await cancel.click();
      const edit = panel.getByRole("button", { name: "Editar" });
      await expect(edit).toBeVisible();
      // S31: the card is a popover at every width; closed, only the round pill shows and it covers no control.
      const covered = await page.evaluate(() => {
        const pill = [...document.querySelectorAll('[data-progress-toggle="expand"]')].find((node) => node.getBoundingClientRect().width > 0);
        if (!pill) return ["no pill"];
        const box = pill.getBoundingClientRect();
        return [...document.querySelectorAll("form button, form a, form input, form textarea, form select")]
          .map((node) => ({ node, rect: node.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 0 && rect.left < box.right && rect.right > box.left && rect.top < box.bottom && rect.bottom > box.top)
          .map(({ node }) => (node.getAttribute("aria-label") ?? node.textContent ?? node.tagName).trim());
      });
      expect(covered, `covered at ${width}`).toEqual([]);
      await page.getByRole("button", { name: "Mostrar tu progreso" }).click();
      await expect(page.getByRole("navigation", { name: "Tu progreso" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("navigation", { name: "Tu progreso" })).toBeHidden();
      await edit.click();
      await expect(panel.locator('input[name="foundedYear"]')).toBeVisible();
    }
  });
});
