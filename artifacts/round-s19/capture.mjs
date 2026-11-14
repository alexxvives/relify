import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "artifacts/round-s19/after");
const widths = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const seller = { email: "vendedor@itsreleva.com", password: "@Releva1z2x" };
const buyer = { email: "inversor@itsreleva.com", password: "@Releva1z2x" };

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

function sideBySide(left, right, dest) {
  try {
    execFileSync("ffmpeg", ["-y", "-i", left, "-i", right, "-filter_complex", "hstack=inputs=2", dest], {
      stdio: "ignore",
    });
    console.log("  ", dest);
  } catch (error) {
    console.warn("side-by-side skipped", error instanceof Error ? error.message : error);
  }
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

    await page.locator("#oferta").scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await shot(page, `${width.name}-02-offer`);

    await page.locator("#vender").scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await shot(page, `${width.name}-03-process`);

    await page.locator("#caminos").scrollIntoViewIfNeeded();
    await page.waitForTimeout(2800);
    await page.locator(".releva-hv-charts").first().scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(900);
    await shot(page, `${width.name}-04-paths`);
    const comprar = page.locator("#caminos").getByRole("button", { name: /comprar/i }).first();
    if ((await comprar.count()) > 0) {
      await comprar.click();
      await page.waitForTimeout(1200);
      await shot(page, `${width.name}-05-paths-comprar`);
    }

    await page.locator(".releva-land-pipe").scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(800);
    await shot(page, `${width.name}-06-pipeline`);

    await page.locator("#confidencialidad").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await shot(page, `${width.name}-07-privacy`);

    await page.locator("#actividad").scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(500);
    await shot(page, `${width.name}-08-activity`);

    await page.goto("http://localhost:3000/?v=2", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await ready(page);
    await shot(page, `${width.name}-09-hero-v2`);
  }
  await publicCtx.close();

  const sellerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const sellerPage = await sellerCtx.newPage();
  await signIn(sellerPage, seller);
  for (const width of widths) {
    await sellerPage.setViewportSize({ width: width.width, height: width.height });
    await sellerPage.goto("http://localhost:3000/mi-empresa/detalles?tab=ficha", { waitUntil: "domcontentloaded" });
    await ready(sellerPage);
    await sellerPage.locator("[data-company-ficha-view]").first().evaluate((el) => {
      el.scrollIntoView({ block: "start" });
    }).catch(() => undefined);
    await sellerPage.waitForTimeout(700);
    await shot(sellerPage, `${width.name}-10-seller-preview`);
    const banner = sellerPage.locator("[data-company-ficha-view] header").first();
    if ((await banner.count()) > 0) {
      await banner.screenshot({ path: path.join(outDir, `${width.name}-10b-seller-banner.png`) });
      console.log("  ", path.join(outDir, `${width.name}-10b-seller-banner.png`));
    }

    const price = sellerPage.locator("text=Precio de venta").first();
    await price.scrollIntoViewIfNeeded().catch(() => undefined);
    await sellerPage.waitForTimeout(400);
    await shot(sellerPage, `${width.name}-11-price-card`);

    await sellerPage.goto("http://localhost:3000/mi-empresa/detalles", { waitUntil: "domcontentloaded" });
    await ready(sellerPage);
    await sellerPage.locator("text=Precio de venta").first().scrollIntoViewIfNeeded().catch(() => undefined);
    await sellerPage.waitForTimeout(400);
    await shot(sellerPage, `${width.name}-11b-price-edit`);

    await sellerPage.goto("http://localhost:3000/mi-empresa/documentos", { waitUntil: "domcontentloaded" });
    await ready(sellerPage);
    await shot(sellerPage, `${width.name}-12-documentos`);
    const relify = sellerPage.getByRole("button", { name: /Relify/i }).first();
    if ((await relify.count()) > 0) {
      await relify.click();
      await sellerPage.waitForTimeout(700);
      await shot(sellerPage, `${width.name}-13-relify-folder`);
    }
  }
  await sellerCtx.close();

  const buyerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const buyerPage = await buyerCtx.newPage();
  await signIn(buyerPage, buyer);
  for (const width of widths) {
    await buyerPage.setViewportSize({ width: width.width, height: width.height });
    await buyerPage.goto("http://localhost:3000/proyectos/int-consultoria-servicios", {
      waitUntil: "domcontentloaded",
    });
    await ready(buyerPage);
    await buyerPage.locator("[data-company-ficha-view]").first().evaluate((el) => {
      el.scrollIntoView({ block: "start" });
    }).catch(() => undefined);
    await buyerPage.waitForTimeout(700);
    await shot(buyerPage, `${width.name}-14-buyer-ficha`);
    const banner = buyerPage.locator("[data-company-ficha-view] header").first();
    if ((await banner.count()) > 0) {
      await banner.screenshot({ path: path.join(outDir, `${width.name}-14b-buyer-banner.png`) });
      console.log("  ", path.join(outDir, `${width.name}-14b-buyer-banner.png`));
    }
  }
  await buyerCtx.close();

  for (const width of widths) {
    sideBySide(
      path.join(outDir, `${width.name}-10-seller-preview.png`),
      path.join(outDir, `${width.name}-14-buyer-ficha.png`),
      path.join(outDir, `${width.name}-15-seller-vs-buyer.png`),
    );
  }

  await writeFile(path.join(outDir, "notes.json"), `${JSON.stringify({ at: new Date().toISOString() }, null, 2)}\n`);
} finally {
  await browser.close();
}
console.log("done", outDir);
