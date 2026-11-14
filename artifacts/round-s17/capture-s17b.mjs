import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "artifacts/round-s17/after");
const widths = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];

const seller = { email: "vendedor@itsreleva.com", password: "@Releva1z2x" };
const buyer = { email: "inversor@itsreleva.com", password: "@Releva1z2x" };

function psql(sql) {
  return execFileSync("psql", ["-h", "127.0.0.1", "-U", "releva", "-d", "releva", "-t", "-A", "-c", sql], {
    env: { ...process.env, PGPASSWORD: "releva" },
    encoding: "utf8",
  }).trim();
}

async function dismissCookies(page) {
  const reject = page.getByRole("dialog").getByRole("button", { name: /^rechazar$/i });
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
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
  await page.waitForTimeout(350);
}

async function shot(page, name) {
  await ready(page);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("  ", file);
}

async function openHelp(page, compact) {
  if (compact) {
    const more = page.getByRole("button", { name: /^más$/i });
    if (await more.isVisible().catch(() => false)) {
      await more.click();
      await page.waitForTimeout(400);
    }
  }
  const summary = page.locator("details summary").filter({ hasText: /necesitas ayuda/i }).first();
  await summary.waitFor({ state: "visible", timeout: 10_000 });
  await summary.click();
  await page.waitForTimeout(300);
}

async function captureHelp(page, width) {
  const compact = width.width < 1024;
  await page.setViewportSize({ width: width.width, height: width.height });
  await page.goto("http://localhost:3000/mi-empresa", { waitUntil: "domcontentloaded" });
  await ready(page);
  await openHelp(page, compact);
  await shot(page, `${width.name}-04-help`);
}

async function captureLoi(page, width) {
  await page.setViewportSize({ width: width.width, height: width.height });
  await page.goto("http://localhost:3000/procesos", { waitUntil: "domcontentloaded" });
  await ready(page);
  const loiButtons = page.getByRole("button", { name: /proceder al loi|firmar loi/i });
  const consultoria = page.locator("li").filter({ hasText: /consultoría servicios/i }).filter({ has: loiButtons }).first();
  const anyLoi = page.locator("li").filter({ has: loiButtons }).first();
  const scope = (await consultoria.count()) > 0 ? consultoria : anyLoi;
  const proceed = scope.getByRole("button", { name: /proceder al loi/i });
  if (await proceed.isVisible().catch(() => false)) {
    await proceed.click();
    await page.waitForTimeout(250);
  }
  await scope.getByRole("button", { name: /firmar loi/i }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: /carta de intenciones/i });
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForTimeout(250);
  await shot(page, `${width.name}-09-loi-no-dni`);
  await page.keyboard.press("Escape");
}

psql(`UPDATE "user" SET national_id = '12345678Z' WHERE email = 'inversor@itsreleva.com' AND (national_id IS NULL OR btrim(national_id) = '');`);
psql(`
  INSERT INTO "project_access" (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at)
  SELECT gen_random_uuid()::text, p.id, u.id, now() - interval '2 days', now() - interval '1 day', now()
  FROM "project" p, "user" u
  WHERE p.slug = 'int-consultoria-servicios' AND u.email = 'inversor@itsreleva.com'
  ON CONFLICT (project_id, investor_id) DO UPDATE SET
    seller_accepted_at = COALESCE("project_access".seller_accepted_at, EXCLUDED.seller_accepted_at),
    nda_accepted_at = COALESCE("project_access".nda_accepted_at, EXCLUDED.nda_accepted_at);
`);

const browser = await chromium.launch({ headless: true });
await mkdir(outDir, { recursive: true });
try {
  const sellerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  const sellerPage = await sellerCtx.newPage();
  await signIn(sellerPage, seller);
  for (const width of widths) {
    console.log("s17b help", width.name);
    await captureHelp(sellerPage, width);
  }
  await sellerCtx.close();

  const buyerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const buyerPage = await buyerCtx.newPage();
  await signIn(buyerPage, buyer);
  for (const width of widths) {
    console.log("s17b loi", width.name);
    await captureLoi(buyerPage, width);
  }
  await buyerCtx.close();
  await writeFile(path.join(outDir, "s17b-notes.json"), `${JSON.stringify({ at: new Date().toISOString() }, null, 2)}\n`);
} finally {
  await browser.close();
}
console.log("done", outDir);
