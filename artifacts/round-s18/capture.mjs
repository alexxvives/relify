import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = "/workspace";
const outDir = path.join(root, "artifacts/round-s18/after");
const widths = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const buyer = { email: "inversor@itsreleva.com", password: "@Releva1z2x" };

function psql(sql) {
  return execFileSync("psql", ["-h", "127.0.0.1", "-U", "releva", "-d", "releva", "-t", "-A", "-c", sql], {
    env: { ...process.env, PGPASSWORD: "releva" },
    encoding: "utf8",
  }).trim();
}

async function dismissCookies(page) {
  const reject = page.getByRole("dialog").getByRole("button", { name: /^rechazar$/i });
  await reject.waitFor({ state: "visible", timeout: 4_000 }).catch(() => undefined);
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
    await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 3_000 }).catch(() => undefined);
  }
}

async function signIn(page, creds) {
  await page.goto("http://localhost:3000/entrar", { waitUntil: "domcontentloaded" });
  await dismissCookies(page);
  await page.locator('input[name="email"]').fill(creds.email);
  await page.locator('input[name="password"]').fill(creds.password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar"), { timeout: 20_000 });
  await dismissCookies(page);
}

async function ready(page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.locator(".animate-pulse").first().waitFor({ state: "hidden", timeout: 6_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
}

async function shot(page, name) {
  await ready(page);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("  ", file);
}

const browser = await chromium.launch({ headless: true });
await mkdir(outDir, { recursive: true });
try {
  const publicCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  const page = await publicCtx.newPage();
  for (const width of widths) {
    await page.setViewportSize({ width: width.width, height: width.height });
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await ready(page);
    await shot(page, `${width.name}-01-hero-default`);

    await page.goto("http://localhost:3000/?v=2", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await ready(page);
    await shot(page, `${width.name}-02-hero-v2`);

    await page.locator("#cifras").scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(900);
    await shot(page, `${width.name}-03-cifras-v2`);

    await page.locator("#oferta").scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(700);
    await shot(page, `${width.name}-04-offer-v2`);
  }
  await publicCtx.close();

  psql(`
    INSERT INTO "project_access" (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at)
    SELECT gen_random_uuid()::text, p.id, u.id, now() - interval '2 days', now() - interval '1 day', now()
    FROM "project" p, "user" u
    WHERE p.slug = 'int-consultoria-servicios' AND u.email = 'inversor@itsreleva.com'
    ON CONFLICT (project_id, investor_id) DO UPDATE SET
      seller_accepted_at = COALESCE("project_access".seller_accepted_at, EXCLUDED.seller_accepted_at),
      nda_accepted_at = EXCLUDED.nda_accepted_at;
  `);
  const buyerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const buyerPage = await buyerCtx.newPage();
  await signIn(buyerPage, buyer);
  for (const width of widths) {
    await buyerPage.setViewportSize({ width: width.width, height: width.height });
    await buyerPage.goto("http://localhost:3000/proyectos/int-consultoria-servicios", { waitUntil: "domcontentloaded" });
    await ready(buyerPage);
    await shot(buyerPage, `${width.name}-05-banner-dossier`);
  }
  await buyerCtx.close();
  await writeFile(path.join(outDir, "notes.json"), `${JSON.stringify({ at: new Date().toISOString() }, null, 2)}\n`);
} finally {
  await browser.close();
}
console.log("done", outDir);
