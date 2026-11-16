import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "artifacts/round-s22/after");
const widths = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const seller = { email: process.env.E2E_SELLER_EMAIL ?? "", password: process.env.E2E_SELLER_PASSWORD ?? "" };
const buyer = { email: process.env.E2E_INVESTOR_EMAIL ?? "", password: process.env.E2E_INVESTOR_PASSWORD ?? "" };

if (!seller.email || !seller.password || !buyer.email || !buyer.password) {
  throw new Error("E2E seller/investor credentials are required");
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
  await page.waitForTimeout(500);
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
    await shot(page, `${width.name}-01-hero`);
    await page.locator("header").first().screenshot({ path: path.join(outDir, `${width.name}-01b-nav.png`) });

    await page.locator("#caminos").evaluate((node) => node.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(600);
    const pathBtn = page.getByRole("button", { name: /^comprar$/i }).first();
    if ((await pathBtn.count()) > 0) {
      await pathBtn.click();
      await page.waitForTimeout(900);
    }
    await shot(page, `${width.name}-02-paths`);

    await page.locator(".releva-land-pipe").scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(700);
    await shot(page, `${width.name}-03-pipeline`);

    const activity = page.locator("#actividad, [id*='actividad']").first();
    if (await activity.count()) {
      await activity.evaluate((node) => node.scrollIntoView({ block: "start" }));
    } else {
      await page.getByRole("heading", { name: /así se ve una operación/i }).scrollIntoViewIfNeeded();
    }
    await page.waitForTimeout(700);
    await shot(page, `${width.name}-04-activity`);

    await page.goto("http://localhost:3000/registro", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await ready(page);
    await shot(page, `${width.name}-05-registro`);
  }
  await publicCtx.close();

  const sellerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const sellerPage = await sellerCtx.newPage();
  await signIn(sellerPage, seller);
  for (const width of widths) {
    await sellerPage.setViewportSize({ width: width.width, height: width.height });
    await sellerPage.goto("http://localhost:3000/mi-empresa/documentos", { waitUntil: "domcontentloaded" });
    await ready(sellerPage);
    await shot(sellerPage, `${width.name}-06-documentos`);
    const relify = sellerPage.getByRole("button", { name: /relify/i }).first();
    if ((await relify.count()) > 0) {
      await relify.click();
      await sellerPage.waitForTimeout(800);
      await shot(sellerPage, `${width.name}-07-documentos-folder`);
    }
    await sellerPage.goto("http://localhost:3000/mi-empresa/detalles?tab=ficha", { waitUntil: "domcontentloaded" });
    await ready(sellerPage);
    await shot(sellerPage, `${width.name}-08-seller-ficha`);
  }
  await sellerCtx.close();

  const buyerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const buyerPage = await buyerCtx.newPage();
  await signIn(buyerPage, buyer);
  for (const width of widths) {
    await buyerPage.setViewportSize({ width: width.width, height: width.height });
    await buyerPage.goto("http://localhost:3000/proyectos/int-consultoria-servicios", { waitUntil: "domcontentloaded" });
    await ready(buyerPage);
    await shot(buyerPage, `${width.name}-09-buyer-ficha`);
    const chat = buyerPage.getByRole("tab", { name: /chat/i }).first();
    if ((await chat.count()) > 0) {
      await chat.click();
      await buyerPage.waitForTimeout(600);
      await shot(buyerPage, `${width.name}-10-buyer-chat`);
    }
    await buyerPage.goto("http://localhost:3000/premium", { waitUntil: "domcontentloaded" });
    await ready(buyerPage);
    await buyerPage.locator("[data-sticky-twin]").scrollIntoViewIfNeeded().catch(() => undefined);
    await buyerPage.waitForTimeout(400);
    await shot(buyerPage, `${width.name}-11-plans`);
  }
  await buyerCtx.close();

  await writeFile(path.join(outDir, "notes.json"), `${JSON.stringify({ at: new Date().toISOString() }, null, 2)}\n`);
} finally {
  await browser.close();
}
console.log("done", outDir);
