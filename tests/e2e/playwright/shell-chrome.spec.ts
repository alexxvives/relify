import { expect, test } from "@playwright/test";
import { destinationsForRole } from "../../../src/lib/shell";
import {
  expectControlCenterTappable,
  expectFichaCompactS13b,
  expectLastContentControlAboveChrome,
  expectLastContentControlTappable,
  expectWindowScrolls,
  openAndClosePageSheets,
  placeJustAboveChrome,
  roleCreds,
  signInAs,
  type E2ERole,
} from "./helpers";

const extraPaths: Record<E2ERole, readonly string[]> = {
  seller: ["/cuenta"],
  investor: ["/cuenta"],
  advisor: ["/cuenta"],
  admin: ["/cuenta"],
};

test.describe("signed-in compact chrome", () => {
  for (const role of ["seller", "investor", "advisor", "admin"] as const) {
    test(`${role} last content control stays above the tab bar`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "mobile-390", "tab bar is compact-only");
      test.skip(!roleCreds(role), `Set E2E_${role.toUpperCase()}_EMAIL and password`);
      test.setTimeout(90_000);
      const signedIn = await signInAs(page, role);
      expect(signedIn).toBe(true);
      const paths = [...destinationsForRole(role).map((item) => item.href), ...extraPaths[role]];
      for (const path of paths) {
        await page.goto(path);
        const content = page.locator(".shell-content");
        if ((await content.count()) === 0) {
          continue;
        }
        await expect(content).toBeVisible();
        await expectLastContentControlAboveChrome(page).catch((error: unknown) => {
          throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`);
        });
      }
    });
  }
});

const compactWidths = [390, 375, 360] as const;

async function openFirstProject(page: Parameters<typeof signInAs>[0]): Promise<boolean> {
  await page.goto("/mercado");
  const applyFilters = page.getByRole("button", { name: /ver empresas/i });
  if (await applyFilters.isVisible().catch(() => false)) {
    await applyFilters.click();
  }
  const card = page.locator("a[href*='/proyectos/']").first();
  if ((await card.count()) === 0) {
    return false;
  }
  await card.click({ force: true });
  await expect(page).toHaveURL(/\/proyectos\//);
  return true;
}

test.describe("sticky CTA never covers inline controls", () => {
  test("seller teaser actions and last controls stay tappable at 390/375/360", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-1280", "compact chrome only");
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and password");
    test.setTimeout(120_000);
    const signedIn = await signInAs(page, "seller");
    expect(signedIn).toBe(true);
    for (const width of compactWidths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/mi-empresa");
      await expectLastContentControlTappable(page).catch((error: unknown) => {
        throw new Error(`/mi-empresa@${width}: ${error instanceof Error ? error.message : String(error)}`);
      });
      await page.goto("/mi-empresa/detalles?tab=ficha");
      await expect(page.locator("[data-teaser-card]")).toHaveCount(0);
      await page.goto("/cuenta");
      await expect(page.locator("[data-teaser-card]")).toHaveCount(0);
      await page.goto("/mi-empresa/documentos");
      const actions = page.locator("[data-teaser-actions]");
      if ((await actions.count()) > 0) {
        await expect(actions.first()).toBeVisible();
        await placeJustAboveChrome(page, actions.first());
        const download = actions.getByRole("link", { name: /descargar teaser/i });
        await expectControlCenterTappable(page, download);
        const more = actions.getByRole("button", { name: /más acciones/i });
        await more.click();
        const copy = page.getByRole("menuitem", { name: /copiar/i });
        const regenerate = page.getByRole("menuitem", { name: /regenerar/i });
        await expect(copy).toBeVisible();
        await expect(regenerate).toBeVisible();
        await page.keyboard.press("Escape");
      }
      await page.goto("/mi-empresa/detalles");
      await expectLastContentControlTappable(page).catch((error: unknown) => {
        throw new Error(`/mi-empresa/detalles@${width}: ${error instanceof Error ? error.message : String(error)}`);
      });
      await page.goto("/cuenta");
      await expectLastContentControlTappable(page).catch((error: unknown) => {
        throw new Error(`/cuenta@${width}: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
  });

  test("seller ficha at 390/375/360 clears sticky tabs, tab bar, titles, and INT badge", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-1280", "compact chrome only");
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and password");
    test.setTimeout(120_000);
    const signedIn = await signInAs(page, "seller");
    expect(signedIn).toBe(true);
    for (const width of compactWidths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/mi-empresa/detalles?tab=ficha");
      await expect(page.locator("#ficha-detalles")).toBeVisible({ timeout: 20_000 });
      await expectFichaCompactS13b(page).catch((error: unknown) => {
        throw new Error(`/mi-empresa/detalles?tab=ficha@${width}: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
  });

  test("investor ficha last control stays tappable at 390/375/360", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-1280", "compact chrome only");
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and password");
    test.setTimeout(120_000);
    const signedIn = await signInAs(page, "investor");
    expect(signedIn).toBe(true);
    for (const width of compactWidths) {
      await page.setViewportSize({ width, height: 844 });
      const opened = await openFirstProject(page);
      if (!opened) {
        continue;
      }
      const connect = page.locator("[data-sticky-twin]").first();
      if ((await connect.count()) > 0 && (await connect.isVisible().catch(() => false))) {
        await placeJustAboveChrome(page, connect);
        const control = connect.locator("a[href], button").first();
        if ((await control.count()) > 0) {
          await expectControlCenterTappable(page, control);
        }
      }
      await page.goto("/cuenta");
      await expectLastContentControlTappable(page).catch((error: unknown) => {
        throw new Error(`/cuenta@${width}: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
  });

  test("admin last control stays tappable at 390/375/360", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "desktop-1280", "compact chrome only");
    test.skip(!roleCreds("admin"), "Set E2E_ADMIN_EMAIL and password");
    test.setTimeout(120_000);
    const signedIn = await signInAs(page, "admin");
    expect(signedIn).toBe(true);
    for (const width of compactWidths) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/admin");
      await expectLastContentControlTappable(page).catch((error: unknown) => {
        throw new Error(`/admin@${width}: ${error instanceof Error ? error.message : String(error)}`);
      });
      await page.goto("/admin/empresas");
      await expectLastContentControlTappable(page).catch((error: unknown) => {
        throw new Error(`/admin/empresas@${width}: ${error instanceof Error ? error.message : String(error)}`);
      });
      const companyHref = await page.locator("a[href*='/admin/empresas/']").first().getAttribute("href");
      if (companyHref && companyHref !== "/admin/empresas") {
        await page.goto(companyHref);
        const actions = page.locator("[data-teaser-actions]");
        if ((await actions.count()) > 0 && (await actions.isVisible().catch(() => false))) {
          await placeJustAboveChrome(page, actions);
          const download = actions.getByRole("link", { name: /descargar teaser/i });
          await expectControlCenterTappable(page, download);
          const more = actions.getByRole("button", { name: /más acciones/i });
          await more.click();
          await expect(page.getByRole("menuitem", { name: /copiar/i })).toBeVisible();
          await expect(page.getByRole("menuitem", { name: /regenerar/i })).toBeVisible();
          await page.keyboard.press("Escape");
        }
        await expectLastContentControlTappable(page).catch((error: unknown) => {
          throw new Error(`admin company@${width}: ${error instanceof Error ? error.message : String(error)}`);
        });
      }
      await page.goto("/cuenta");
      await expectLastContentControlTappable(page).catch((error: unknown) => {
        throw new Error(`/cuenta@${width}: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
  });
});

test.describe("window scroll is not locked after sheets", () => {
  test("seller detalles, ficha, inicio and cuenta scroll at 390 and 1440", async ({ page }, testInfo) => {
    test.skip(!roleCreds("seller"), "Set E2E_SELLER_EMAIL and password");
    test.setTimeout(180_000);
    const width = testInfo.project.name === "desktop-1280" ? 1440 : 390;
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    const signedIn = await signInAs(page, "seller");
    expect(signedIn).toBe(true);
    const paths = ["/mi-empresa/detalles", "/mi-empresa/detalles?tab=ficha", "/mi-empresa", "/cuenta"] as const;
    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator(".shell-content")).toBeVisible({ timeout: 20_000 });
      await openAndClosePageSheets(page);
      await expectWindowScrolls(page, `${path}@${width}`).catch((error: unknown) => {
        throw new Error(`${path}@${width}: ${error instanceof Error ? error.message : String(error)}`);
      });
    }
  });

  test("marketplace /mercado scrolls at 390 and 1440", async ({ page }, testInfo) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and password");
    test.setTimeout(90_000);
    const width = testInfo.project.name === "desktop-1280" ? 1440 : 390;
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    const signedIn = await signInAs(page, "investor");
    expect(signedIn).toBe(true);
    await page.goto("/mercado");
    await expect(page.locator(".shell-content")).toBeVisible({ timeout: 20_000 });
    await openAndClosePageSheets(page);
    await expectWindowScrolls(page, `/mercado@${width}`).catch((error: unknown) => {
      throw new Error(`/mercado@${width}: ${error instanceof Error ? error.message : String(error)}`);
    });
  });
});
