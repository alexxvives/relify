import { expect, test } from "@playwright/test";
import pg from "pg";
import { roleCreds, signInAs } from "./helpers";

const databaseUrl = process.env.E2E_AGREEMENT_DATABASE_URL ?? "";

test.describe("S29b", () => {
  test("the process track has seven steps and no Revisión or Seguir a documentación", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
    await page.goto("/procesos");
    const track = page.locator('ol[aria-label="Recorrido del proceso"]').first();
    test.skip(!(await track.count()), "no active process for this account");
    await expect(track.locator(":scope > li")).toHaveCount(7);
    await expect(page.getByText("Revisión", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Seguir a documentación" })).toHaveCount(0);
  });

  test("the landing timeline shows seven steps", async ({ page }) => {
    await page.goto("/");
    const steps = page.locator(".releva-land-pipe-step");
    await steps.first().scrollIntoViewIfNeeded();
    await expect(steps).toHaveCount(7);
  });

  test("asesor cards show Desde X € instead of a range", async ({ page }) => {
    test.skip(!roleCreds("investor"), "Set E2E_INVESTOR_EMAIL and E2E_INVESTOR_PASSWORD");
    expect(await signInAs(page, "investor")).toBe(true);
    await page.goto("/asesoramiento");
    await page.waitForLoadState("networkidle");
    const cards = page.locator("article");
    test.skip(!(await cards.count()), "no listed asesores");
    const text = (await cards.allTextContents()).join(" ");
    expect(text).not.toMatch(/\d €\s*–\s*\d/);
    expect(text).toMatch(/Desde \d|\d €/);
  });

  test("an account without a DNI/NIE completes it in onboarding; the agreement never asks for it", async ({ page }) => {
    const creds = roleCreds("investor");
    test.skip(!creds || databaseUrl.length === 0, "needs investor creds and E2E_AGREEMENT_DATABASE_URL (local DB)");
    test.skip(!/localhost|127\.0\.0\.1/.test(databaseUrl), "local database only");

    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    const before = await client.query<{
      national_id: string | null;
      terms_accepted_at: Date | null;
      signature_png: Buffer | null;
      created_at: Date;
    }>(`select national_id, terms_accepted_at, signature_png, created_at from "user" where email = $1`, [creds?.email]);
    const original = before.rows[0] ?? null;
    try {
      await client.query(
        `update "user" set national_id = null, terms_accepted_at = null, signature_png = null, created_at = now() where email = $1`,
        [creds?.email],
      );

      await signInAs(page, "investor");
      await page.goto("/inversor");
      await page.waitForURL((url) => url.pathname === "/onboarding" && url.searchParams.get("paso") === "dni");
      await expect(page.getByRole("heading", { name: "Falta tu DNI/NIE" })).toBeVisible();
      await page.goto("/acuerdo");
      await page.waitForURL((url) => url.pathname === "/onboarding");

      // Synthetic DNI with a valid control letter (90000001 % 23 = 12 → N).
      await page.locator('input[name="nationalId"]').fill("90000001N");
      await page.getByRole("button", { name: "Guardar y continuar" }).click();
      await page.waitForURL((url) => url.pathname !== "/onboarding", { timeout: 20_000 });

      const dialog = page.locator("dialog[open]");
      await expect(dialog.getByRole("heading", { name: "Acuerdo con Relify" })).toBeVisible();
      await expect(dialog.locator('input[name="nationalId"]')).toHaveCount(0);
      await expect(dialog.locator("[data-stored-national-id]")).toHaveCount(1);
      await expect(dialog.locator("[data-stored-national-id]")).not.toContainText("90000001N");
    } finally {
      if (original) {
        await client.query(
          `update "user" set national_id = $2, terms_accepted_at = $3, signature_png = $4, created_at = $5 where email = $1`,
          [creds?.email, original.national_id, original.terms_accepted_at, original.signature_png, original.created_at],
        );
      }
      await client.end();
    }
  });
});
