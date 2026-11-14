import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "artifacts/round-s20/after");
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
  await page.waitForTimeout(500);
}

async function shot(page, name) {
  await ready(page);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("  ", file);
}

async function measureCpu(page, label) {
  const samples = await page.evaluate(async () => {
    const start = performance.now();
    let frames = 0;
    await new Promise((resolve) => {
      const tick = () => {
        frames += 1;
        if (performance.now() - start < 1500) {
          requestAnimationFrame(tick);
        } else {
          resolve(undefined);
        }
      };
      requestAnimationFrame(tick);
    });
    const elapsed = performance.now() - start;
    return { frames, elapsed, fps: Math.round((frames / elapsed) * 1000) };
  });
  return { label, ...samples };
}

const browser = await chromium.launch({ headless: true });
await mkdir(outDir, { recursive: true });
const cpu = [];
try {
  const publicCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  const page = await publicCtx.newPage();
  for (const width of widths) {
    await page.setViewportSize({ width: width.width, height: width.height });
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await ready(page);
    await shot(page, `${width.name}-01-hero-gold`);
    await page.locator("header").first().screenshot({ path: path.join(outDir, `${width.name}-01b-header.png`) });

    await page.locator("#oferta").evaluate((node) => node.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(700);
    await shot(page, `${width.name}-02-offer-titles`);

    await page.locator("#vender").evaluate((node) => node.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(700);
    await shot(page, `${width.name}-03-process-no-tags`);

    await page.locator("#caminos").evaluate((node) => node.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(900);
    await shot(page, `${width.name}-04-paths`);
    const comprar = page.locator("#caminos").getByRole("button", { name: /comprar/i }).first();
    if ((await comprar.count()) > 0) {
      await comprar.click();
      await page.waitForTimeout(900);
      await shot(page, `${width.name}-05-paths-blur`);
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
    await page.waitForTimeout(width.width >= 1440 ? 1800 : 400);
    await shot(page, `${width.name}-09-v2-header`);
    await page.locator("header").first().screenshot({ path: path.join(outDir, `${width.name}-09b-v2-header.png`) });
    if (width.width >= 1440) {
      cpu.push(await measureCpu(page, "v2-desktop-electric"));
    }

    await page.goto("http://localhost:3000/lista-de-espera", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await ready(page);
    await shot(page, `${width.name}-10-waitlist-avatars`);
    await page.locator(".releva-wait-clock").scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(400);
    await shot(page, `${width.name}-11-waitlist-counter`);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await ready(page);
  cpu.push(await measureCpu(page, "default-desktop"));
  await publicCtx.close();

  const sellerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const sellerPage = await sellerCtx.newPage();
  await signIn(sellerPage, seller);
  for (const width of widths) {
    await sellerPage.setViewportSize({ width: width.width, height: width.height });
    await sellerPage.goto("http://localhost:3000/mi-empresa/documentos", { waitUntil: "domcontentloaded" });
    await ready(sellerPage);
    await shot(sellerPage, `${width.name}-12-relify-folder`);

  }
  await sellerCtx.close();

  const buyerCtx = await browser.newContext({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  const buyerPage = await buyerCtx.newPage();
  await signIn(buyerPage, buyer);
  for (const width of widths) {
    await buyerPage.setViewportSize({ width: width.width, height: width.height });
    await buyerPage.goto("http://localhost:3000/premium?changed=1", { waitUntil: "domcontentloaded" });
    await ready(buyerPage);
    await buyerPage.waitForTimeout(400);
    await shot(buyerPage, `${width.name}-13-toast`);
    await buyerPage.locator("[data-sticky-twin]").scrollIntoViewIfNeeded();
    await buyerPage.waitForTimeout(500);
    await shot(buyerPage, `${width.name}-14-pixel-plan`);
  }
  await buyerCtx.close();

  await writeFile(path.join(outDir, "notes.json"), `${JSON.stringify({ at: new Date().toISOString(), cpu }, null, 2)}\n`);
} finally {
  await browser.close();
}
console.log("done", outDir);
