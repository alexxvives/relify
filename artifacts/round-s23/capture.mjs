import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "artifacts/round-s23/after");
const widths = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const seller = { email: process.env.E2E_SELLER_EMAIL ?? "", password: process.env.E2E_SELLER_PASSWORD ?? "" };

if (!seller.email || !seller.password) {
  throw new Error("E2E seller credentials are required");
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
  const page = await browser.newPage({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  for (const width of widths) {
    await page.setViewportSize({ width: width.width, height: width.height });
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await ready(page);
    await shot(page, `${width.name}-01-hero`);

    await page.locator("#empresas-en-venta, #oferta").first().scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(400);
    await shot(page, `${width.name}-02-offer`);

    await page.locator("#caminos").evaluate((node) => node.scrollIntoView({ block: "start" })).catch(() => undefined);
    await page.waitForTimeout(500);
    const pathBtn = page.getByRole("button", { name: /^comprar$/i }).first();
    if ((await pathBtn.count()) > 0) {
      await pathBtn.click();
      await page.waitForTimeout(800);
    }
    await shot(page, `${width.name}-03-paths`);

    await page.locator(".releva-land-pipe").scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(700);
    await shot(page, `${width.name}-04-pipeline`);
  }

  const sellerPage = await browser.newPage({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  await signIn(sellerPage, seller);
  for (const width of widths) {
    await sellerPage.setViewportSize({ width: width.width, height: width.height });
    await sellerPage.goto("http://localhost:3000/mi-empresa/documentos", { waitUntil: "domcontentloaded" });
    await dismissCookies(sellerPage);
    await ready(sellerPage);
    await shot(sellerPage, `${width.name}-05-documentos`);
    const folder = sellerPage.locator("[role='button']").filter({ hasText: /Corporativo|Relify|Financiero/ }).first();
    if (await folder.count()) {
      await folder.click();
      await sellerPage.waitForTimeout(700);
      await shot(sellerPage, `${width.name}-06-folder`);
    }
    await sellerPage.goto("http://localhost:3000/mi-empresa/detalles", { waitUntil: "domcontentloaded" });
    await ready(sellerPage);
    await shot(sellerPage, `${width.name}-07-detalles`);
  }
} finally {
  await browser.close();
}
