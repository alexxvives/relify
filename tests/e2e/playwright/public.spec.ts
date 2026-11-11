import { expect, test } from "@playwright/test";

test.describe("visitor landing and public forms", () => {
  test("landing loads and links to registro", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const register = page.getByRole("link", { name: /crear cuenta|registro|publicar/i }).first();
    await expect(register).toBeVisible();
  });

  test("registro shows email, password and role", async ({ page }) => {
    await page.goto("/registro");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /crear cuenta/i })).toBeVisible();
  });

  test("waitlist form is present and does not submit unless E2E_ALLOW_MUTATION", async ({ page }) => {
    await page.goto("/lista-de-espera");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    if (process.env.E2E_ALLOW_MUTATION === "1") {
      await page.locator('input[name="name"]').fill("E2E Visitante");
      await page.locator('input[name="email"]').fill(`e2e-waitlist-${Date.now()}@example.com`);
      await page.getByRole("button", { name: /apuntarme/i }).click();
      await expect(page.getByText(/estás dentro|ya está en la lista/i)).toBeVisible({ timeout: 15_000 });
    }
  });

  test("valorar validates CIF and only submits when mutation is allowed", async ({ page }) => {
    await page.goto("/valorar");
    await expect(page.locator('input[name="cif"]')).toBeVisible();
    await expect(page.locator('input[name="contactName"]')).toBeVisible();
    await expect(page.locator('input[name="contactEmail"]')).toBeVisible();
    await page.locator('input[name="cif"]').fill("B12345678");
    await page.locator('input[name="contactName"]').fill("E2E Visitante");
    await page.locator('input[name="contactEmail"]').fill("e2e-valorar@example.com");
    await page.getByRole("button", { name: /solicitar valoración/i }).click();
    await expect(page.getByText(/cif no es correcto/i)).toBeVisible();
    if (process.env.E2E_ALLOW_MUTATION === "1") {
      await page.locator('input[name="cif"]').fill("B12345674");
      await page.getByRole("button", { name: /solicitar valoración/i }).click();
      await expect(page.getByText(/hemos recibido tu solicitud/i)).toBeVisible({ timeout: 15_000 });
    }
  });

  test("/archivo is a Relify 404 without Ver empresas", async ({ page }) => {
    const response = await page.goto("/archivo");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /no está en relify/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ir al inicio/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ver empresas/i })).toHaveCount(0);
  });

  test("/sd is the same Relify 404", async ({ page }) => {
    const response = await page.goto("/sd");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /no está en relify/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ver empresas/i })).toHaveCount(0);
  });

  test("valorar has SEO FAQ and the CIF form", async ({ page }) => {
    await page.goto("/valorar");
    await expect(page.locator('input[name="cif"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: /preguntas frecuentes/i })).toBeVisible();
    await expect(page.getByText(/¿cuánto vale mi empresa\?/i)).toBeVisible();
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd.first()).toBeAttached();
    const payload = await jsonLd.first().textContent();
    expect(payload).toMatch(/FAQPage/);
    expect(payload).toMatch(/Service/);
  });

  test("landing confidentiality has no catalog CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /confidencialidad en relify/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ver cómo se publica/i })).toHaveCount(0);
  });
});
