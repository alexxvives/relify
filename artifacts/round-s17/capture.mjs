import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = "/workspace";
const phase = process.env.S17_SHOTS ?? "after";
const outDir = path.join(root, "artifacts/round-s17", phase);
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
      await page.waitForTimeout(350);
    }
  }
  const summary = page.locator("details summary").filter({ hasText: /ayuda|llámanos/i }).first();
  if (await summary.isVisible().catch(() => false)) {
    await summary.click();
    await page.waitForTimeout(250);
  }
}

async function captureSeller(page, width) {
  const compact = width.width < 1024;
  await page.setViewportSize({ width: width.width, height: width.height });
  await page.goto("http://localhost:3000/mi-empresa/detalles?tab=ficha", { waitUntil: "domcontentloaded" });
  await ready(page);
  const fichaTab = page.getByRole("tab", { name: /ficha pública/i }).or(page.getByRole("button", { name: /ficha pública/i }));
  if (await fichaTab.first().isVisible().catch(() => false)) {
    await fichaTab.first().click().catch(() => undefined);
    await ready(page);
  }
  await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("#panel-asking-price")];
    const el = nodes.find((node) => node instanceof HTMLElement && node.offsetParent !== null && getComputedStyle(node).display !== "none");
    el?.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(300);
  await shot(page, `${width.name}-01-ficha-metrics`);

  const editPrice = page.getByRole("button", { name: /editar precio de venta/i });
  const editCount = await editPrice.count();
  for (let i = 0; i < editCount; i += 1) {
    const btn = editPrice.nth(i);
    if (!(await btn.isVisible().catch(() => false))) {
      continue;
    }
    await btn.click({ timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(450);
    break;
  }
  if (await page.locator("[data-asking-price-sheet]").isVisible().catch(() => false)) {
    await shot(page, `${width.name}-02-precio-sheet`);
    const info = page.locator("[data-asking-price-sheet]").getByRole("button").filter({ has: page.locator("svg") }).first();
    if (await info.isVisible().catch(() => false)) {
      await info.click({ timeout: 3_000 }).catch(() => undefined);
      await page.waitForTimeout(350);
      await shot(page, `${width.name}-02b-precio-formula`);
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }

  await page.goto("http://localhost:3000/mi-empresa/documentos", { waitUntil: "domcontentloaded" });
  const teaser = page.locator("[data-teaser-card]");
  if (await teaser.count()) {
    await teaser.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }
  await shot(page, `${width.name}-03-documentos-teaser`);
  const preview = page.locator("[data-teaser-preview]");
  if (await preview.isVisible().catch(() => false)) {
    await preview.click();
    await page.waitForTimeout(700);
    await shot(page, `${width.name}-03b-teaser-modal`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }

  await page.goto("http://localhost:3000/mi-empresa", { waitUntil: "domcontentloaded" });
  await ready(page);
  await openHelp(page, compact);
  await shot(page, `${width.name}-04-help`);

  await page.goto("http://localhost:3000/cuenta", { waitUntil: "domcontentloaded" });
  await ready(page);
  await shot(page, `${width.name}-05-cuenta-dni`);
}

async function captureBuyer(page, width) {
  await page.setViewportSize({ width: width.width, height: width.height });
  psql(`
    INSERT INTO "project_access" (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at)
    SELECT gen_random_uuid()::text, p.id, u.id, now() - interval '2 days', now() - interval '1 day', NULL
    FROM "project" p, "user" u
    WHERE p.slug = 'int-consultoria-servicios' AND u.email = 'inversor@itsreleva.com'
    ON CONFLICT (project_id, investor_id) DO UPDATE SET nda_accepted_at = NULL, seller_accepted_at = COALESCE("project_access".seller_accepted_at, EXCLUDED.seller_accepted_at);
  `);
  await page.goto("http://localhost:3000/proyectos/int-consultoria-servicios", { waitUntil: "domcontentloaded" });
  await ready(page);
  await shot(page, `${width.name}-06-buyer-pre-nda`);
  const negocio = page.locator("#negocio");
  if (await negocio.count()) {
    await negocio.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await shot(page, `${width.name}-06b-buyer-negocio-aside`);
  }

  psql(`
    INSERT INTO "project_access" (id, project_id, investor_id, requested_at, seller_accepted_at, nda_accepted_at)
    SELECT gen_random_uuid()::text, p.id, u.id, now() - interval '2 days', now() - interval '1 day', now()
    FROM "project" p, "user" u
    WHERE p.slug = 'int-consultoria-servicios' AND u.email = 'inversor@itsreleva.com'
    ON CONFLICT (project_id, investor_id) DO UPDATE SET
      seller_accepted_at = COALESCE("project_access".seller_accepted_at, EXCLUDED.seller_accepted_at),
      nda_accepted_at = EXCLUDED.nda_accepted_at;
  `);
  await page.goto("http://localhost:3000/proyectos/int-consultoria-servicios", { waitUntil: "domcontentloaded" });
  await ready(page);
  await shot(page, `${width.name}-07-buyer-post-nda`);
  const evolucion = page.locator("#evolucion");
  if (await evolucion.count()) {
    await evolucion.locator("summary").click().catch(() => undefined);
    await page.waitForTimeout(350);
    await evolucion.scrollIntoViewIfNeeded();
    await shot(page, `${width.name}-07b-buyer-post-nda-charts`);
  }
  const detalle = page.locator("#detalle");
  if (await detalle.count()) {
    await detalle.locator("summary").click().catch(() => undefined);
    await page.waitForTimeout(300);
    await detalle.scrollIntoViewIfNeeded();
    await shot(page, `${width.name}-07c-buyer-post-nda-detalle`);
  }
}

const browser = await chromium.launch({ headless: true });
await mkdir(outDir, { recursive: true });
try {
  const sellerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  const sellerPage = await sellerCtx.newPage();
  await signIn(sellerPage, seller);
  for (const width of widths) {
    console.log(phase, "seller", width.name);
    await captureSeller(sellerPage, width);
  }
  await sellerCtx.close();

  const buyerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const buyerPage = await buyerCtx.newPage();
  await signIn(buyerPage, buyer);
  for (const width of widths) {
    console.log(phase, "buyer", width.name);
    await captureBuyer(buyerPage, width);
  }
  await buyerCtx.close();
  await writeFile(path.join(outDir, "notes.json"), `${JSON.stringify({ phase, at: new Date().toISOString() }, null, 2)}\n`);
} finally {
  await browser.close();
}
console.log("done", outDir);
