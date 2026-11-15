import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "artifacts/round-s24/after");
const widths = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
];
const seller = { email: process.env.E2E_SELLER_EMAIL ?? "", password: process.env.E2E_SELLER_PASSWORD ?? "" };
const investor = { email: process.env.E2E_INVESTOR_EMAIL ?? "", password: process.env.E2E_INVESTOR_PASSWORD ?? "" };

if (!seller.email || !seller.password || !investor.email || !investor.password) {
  throw new Error("E2E seller and investor credentials are required");
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
  await page.waitForTimeout(350);
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
  const page = await browser.newPage({ locale: "es-ES", viewport: { width: 390, height: 844 } });
  for (const width of [{ name: "320", width: 320, height: 720 }, ...widths]) {
    await page.setViewportSize({ width: width.width, height: width.height });
    await page.goto("http://localhost:3000/registro", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await page.getByRole("radio", { name: "Comprador" }).click();
    await page.locator('input[name="password"]').fill("Abcdef1!");
    await page.locator('input[name="password"]').focus();
    await shot(page, `${width.name}-01-registro`);
  }

  const sellerPage = await browser.newPage({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  await signIn(sellerPage, seller);
  for (const width of widths) {
    await sellerPage.setViewportSize({ width: width.width, height: width.height });
    await sellerPage.goto("http://localhost:3000/cuenta", { waitUntil: "domcontentloaded" });
    await dismissCookies(sellerPage);
    await shot(sellerPage, `${width.name}-02-cuenta`);

    await sellerPage.goto("http://localhost:3000/mi-empresa", { waitUntil: "domcontentloaded" });
    await ready(sellerPage);
    await shot(sellerPage, `${width.name}-03-inicio`);

    await sellerPage.goto("http://localhost:3000/mi-empresa/detalles", { waitUntil: "domcontentloaded" });
    await ready(sellerPage);
    await shot(sellerPage, `${width.name}-04-detalles`);
    const financing = sellerPage.locator("#panel-seller-financing");
    if (await financing.count()) {
      await financing.scrollIntoViewIfNeeded();
      await sellerPage.waitForTimeout(250);
      await shot(sellerPage, `${width.name}-05-financiacion`);
    }
  }

  const investorPage = await browser.newPage({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  await signIn(investorPage, investor);
  for (const width of widths) {
    await investorPage.setViewportSize({ width: width.width, height: width.height });
    await investorPage.goto("http://localhost:3000/cuenta", { waitUntil: "domcontentloaded" });
    await dismissCookies(investorPage);
    await shot(investorPage, `${width.name}-06-perfil`);

    await investorPage.goto("http://localhost:3000/mercado", { waitUntil: "domcontentloaded" });
    await ready(investorPage);
    const filters = investorPage.getByRole("button", { name: /filtros/i });
    if (await filters.isVisible().catch(() => false)) {
      await filters.click();
      await investorPage.waitForTimeout(300);
    }
    await shot(investorPage, `${width.name}-07-mercado`);
  }
} finally {
  await browser.close();
}
