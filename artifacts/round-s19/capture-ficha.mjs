import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";

const outDir = path.join(process.cwd(), "artifacts/round-s19/after");
const seller = { email: "vendedor@itsreleva.com", password: "@Releva1z2x" };
const buyer = { email: "inversor@itsreleva.com", password: "@Releva1z2x" };
const widths = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];

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
}

async function shot(page, name) {
  await page.waitForTimeout(400);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("  ", file);
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ locale: "es-ES", viewport: { width: 1440, height: 900 } });
  for (const width of widths) {
    await page.setViewportSize({ width: width.width, height: width.height });
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await page.locator("#caminos").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /escribe tu cif/i }).first().click().catch(() => undefined);
    await page.waitForTimeout(2200);
    await page.locator(".releva-hv-charts, .releva-hv-example").first().scrollIntoViewIfNeeded().catch(() => undefined);
    await page.waitForTimeout(600);
    await shot(page, `${width.name}-04-paths`);
  }
  await page.close();

  const sellerPage = await browser.newPage({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  await signIn(sellerPage, seller);
  for (const width of widths) {
    await sellerPage.setViewportSize({ width: width.width, height: width.height });
    await sellerPage.goto("http://localhost:3000/mi-empresa/detalles?tab=ficha", { waitUntil: "domcontentloaded" });
    await sellerPage.locator("[data-company-ficha-view]").first().evaluate((el) => el.scrollIntoView({ block: "start" }));
    await sellerPage.waitForTimeout(800);
    await shot(sellerPage, `${width.name}-10-seller-preview`);
    await sellerPage.locator("[data-company-ficha-view] header").first().screenshot({
      path: path.join(outDir, `${width.name}-10b-seller-banner.png`),
    });
  }
  await sellerPage.close();

  const buyerPage = await browser.newPage({ locale: "es-ES", viewport: { width: 1440, height: 900 }, hasTouch: true });
  await signIn(buyerPage, buyer);
  for (const width of widths) {
    await buyerPage.setViewportSize({ width: width.width, height: width.height });
    await buyerPage.goto("http://localhost:3000/proyectos/int-consultoria-servicios", { waitUntil: "domcontentloaded" });
    await buyerPage.locator("[data-company-ficha-view]").first().evaluate((el) => el.scrollIntoView({ block: "start" }));
    await buyerPage.waitForTimeout(800);
    await shot(buyerPage, `${width.name}-14-buyer-ficha`);
    await buyerPage.locator("[data-company-ficha-view] header").first().screenshot({
      path: path.join(outDir, `${width.name}-14b-buyer-banner.png`),
    });
  }
  await buyerPage.close();

  for (const width of widths) {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        path.join(outDir, `${width.name}-10-seller-preview.png`),
        "-i",
        path.join(outDir, `${width.name}-14-buyer-ficha.png`),
        "-filter_complex",
        "hstack=inputs=2",
        path.join(outDir, `${width.name}-15-seller-vs-buyer.png`),
      ],
      { stdio: "ignore" },
    );
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        path.join(outDir, `${width.name}-10b-seller-banner.png`),
        "-i",
        path.join(outDir, `${width.name}-14b-buyer-banner.png`),
        "-filter_complex",
        "hstack=inputs=2",
        path.join(outDir, `${width.name}-15b-banners.png`),
      ],
      { stdio: "ignore" },
    );
  }
} finally {
  await browser.close();
}
console.log("done ficha recapture");
