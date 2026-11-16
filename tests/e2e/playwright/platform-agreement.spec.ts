import { expect, test } from "@playwright/test";
import pg from "pg";
import { roleCreds, signInAs } from "./helpers";

/**
 * S26b regression: one signature of the Acuerdo con Relify closes the dialog (success state, welcome)
 * and it never comes back after a reload, even for an account created minutes ago.
 *
 * Mutates the investor demo account, so it only runs against a local database given explicitly in
 * E2E_AGREEMENT_DATABASE_URL (never INT or prod). The original created_at is restored afterwards.
 */
const databaseUrl = process.env.E2E_AGREEMENT_DATABASE_URL ?? "";

test.describe("platform agreement", () => {
  test("signing once closes the dialog and it stays closed after reload", async ({ page }) => {
    const creds = roleCreds("investor");
    test.skip(!creds || databaseUrl.length === 0, "needs investor creds and E2E_AGREEMENT_DATABASE_URL (local DB)");
    test.skip(!/localhost|127\.0\.0\.1/.test(databaseUrl), "local database only");

    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    const before = await client.query<{ created_at: Date }>(`select created_at from "user" where email = $1`, [creds?.email]);
    const createdAt = before.rows[0]?.created_at ?? null;
    try {
      // A fresh, unsigned account: created now, no acceptance, no signature.
      await client.query(
        `update "user" set terms_accepted_at = null, signature_png = null, created_at = now() where email = $1`,
        [creds?.email],
      );

      await signInAs(page, "investor");
      const dialog = page.locator("dialog[open]");
      await expect(dialog.getByRole("heading", { name: "Acuerdo con Relify" })).toBeVisible();

      const pad = dialog.locator("canvas");
      await pad.scrollIntoViewIfNeeded();
      const box = await pad.boundingBox();
      if (!box) {
        throw new Error("signature pad has no box");
      }
      await page.mouse.move(box.x + 20, box.y + box.height / 2);
      await page.mouse.down();
      for (let step = 1; step <= 10; step += 1) {
        await page.mouse.move(box.x + 20 + (step * (box.width - 40)) / 10, box.y + box.height / 2 + (step % 2 ? 14 : -14));
      }
      await page.mouse.up();
      await dialog.getByRole("button", { name: /acepto el acuerdo/i }).click();

      await expect(page.getByRole("heading", { name: "Acuerdo firmado" })).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("dialog[open]")).toHaveCount(0, { timeout: 10_000 });
      await expect(page.getByText("¡Bienvenido a Relify!")).toBeVisible();

      const row = await client.query<{ signed: boolean }>(
        `select terms_accepted_at is not null and signature_png is not null as signed from "user" where email = $1`,
        [creds?.email],
      );
      expect(row.rows[0]?.signed).toBe(true);

      await page.reload();
      await page.locator(".shell-content").waitFor({ state: "visible" });
      await page.waitForTimeout(1_000);
      await expect(page.locator("dialog[open]")).toHaveCount(0);
    } finally {
      if (createdAt) {
        await client.query(`update "user" set created_at = $2 where email = $1`, [creds?.email, createdAt]);
      }
      await client.end();
    }
  });
});
