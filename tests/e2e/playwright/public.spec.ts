import { expect, test } from "@playwright/test";
import { htmlContainsGtmContainer, readGtmContainerId } from "../../../src/lib/cookie-consent";
import { headContainsIconAndOgImage } from "../../../src/lib/seo-head";

test.describe("visitor landing and public forms", () => {
  test("landing loads and links to registro", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const register = page.getByRole("link", { name: /prueba gratis|crear cuenta|registro|publicar/i }).first();
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

  test("initial HTML puts favicon and og:image in <head>", async ({ request }) => {
    for (const path of ["/", "/valorar", "/lista-de-espera"]) {
      const response = await request.get(path);
      expect(response.ok()).toBe(true);
      const html = await response.text();
      expect(headContainsIconAndOgImage(html), path).toBe(true);
      expect(html).toMatch(/twitter:card|summary_large_image/);
      const gtmMatch = html.match(/GTM-[A-Z0-9]+/);
      const gtmId = readGtmContainerId() ?? (gtmMatch ? gtmMatch[0] : null);
      if (gtmId) {
        expect(htmlContainsGtmContainer(html, gtmId), `${path} GTM in raw HTML`).toBe(true);
        expect(html).toContain("wait_for_update");
        expect(html).toContain("ads_data_redaction");
      }
    }
  });

  test("cookie banner and /cookies list GA cookies", async ({ page }, testInfo) => {
    await page.goto("/");
    const banner = page.getByRole("dialog");
    await expect(banner.getByRole("heading", { name: /cookies en relify/i })).toBeVisible();
    await expect(banner.getByRole("button", { name: /^rechazar$/i })).toBeVisible();
    await expect(banner.getByRole("button", { name: /^aceptar$/i })).toBeVisible();
    if (testInfo.project.name === "mobile-390") {
      const box = await banner.boundingBox();
      expect(box, "cookie sheet is on screen").not.toBeNull();
      if (box) {
        expect(box.height).toBeLessThanOrEqual(Math.ceil(page.viewportSize()?.height ?? 844) * 0.35 + 8);
      }
      const rejectBox = await banner.getByRole("button", { name: /^rechazar$/i }).boundingBox();
      const acceptBox = await banner.getByRole("button", { name: /^aceptar$/i }).boundingBox();
      expect(rejectBox && acceptBox, "Rechazar and Aceptar sit side by side").toBeTruthy();
      if (rejectBox && acceptBox) {
        expect(Math.abs(rejectBox.y - acceptBox.y)).toBeLessThan(8);
      }
      const stickyBuy = page.locator(".releva-hero-actions a[href='/registro']");
      const stickyBox = await stickyBuy.boundingBox();
      expect(stickyBox, "hero CTA stays on screen with the cookie sheet").not.toBeNull();
      if (box && stickyBox) {
        expect(stickyBox.y + stickyBox.height).toBeLessThanOrEqual(box.y + 4);
      }
    }
    await expect(banner.getByRole("link", { name: /política de cookies/i })).toBeVisible();
    await expect(banner.getByRole("link", { name: /^privacidad$/i })).toHaveCount(0);
    await expect(banner.getByRole("link", { name: /^términos$/i })).toHaveCount(0);
    const register = page.getByRole("link", { name: /prueba gratis|crear cuenta|registro|publicar/i }).first();
    await expect(register).toBeVisible();
    await register.click();
    await expect(page).toHaveURL(/\/registro/);
    await page.goto("/");
    await banner.getByRole("link", { name: /política de cookies/i }).click();
    await expect(page).toHaveURL(/\/cookies/);
    await expect(page.getByText("_ga", { exact: true })).toBeVisible();
    await expect(page.getByText("_ga_*", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /google tag manager/i })).toBeVisible();
    await expect(page.locator("article").getByText(/cookieless/i).first()).toBeVisible();
  });

  test("privacy and terms pages are public Spanish legal docs", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^aceptar$/i }).click();
    await page.getByRole("link", { name: /^privacidad$/i }).first().click();
    await expect(page).toHaveURL(/\/privacidad/);
    await page.goto("/privacidad");
    await expect(page.getByRole("heading", { name: /política de privacidad/i })).toBeVisible();
    await expect(page.getByText(/TODO: razón social \(Alex\)/)).toBeVisible();
    await expect(page.getByText(/TODO: NIF \(Alex\)/)).toBeVisible();
    await expect(page.getByText(/info@itsrelify.com/).first()).toBeVisible();
    await expect(page.getByText(/AEPD/)).toBeVisible();
    await expect(page.getByText(/Cloudflare/)).toBeVisible();
    await page.goto("/terminos");
    await expect(page.getByRole("heading", { name: /términos de uso/i })).toBeVisible();
    await expect(page.getByText(/no es parte del contrato de compraventa/i)).toBeVisible();
    await expect(page.getByText(/notario/i).first()).toBeVisible();
    await expect(page.getByText(/ley española/i)).toBeVisible();
  });

  test("landing confidentiality has no catalog CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /confidencialidad en relify/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ver cómo se publica/i })).toHaveCount(0);
  });
});
