import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = "/workspace";
const phase = process.env.S17_LANDING ?? "before";
const outDir = path.join(root, "artifacts/round-s17", phase);
const widths = [
  { name: "360", width: 360, height: 780 },
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];

async function dismissCookies(page) {
  const reject = page.getByRole("dialog").getByRole("button", { name: /^rechazar$/i });
  await reject.waitFor({ state: "visible", timeout: 4_000 }).catch(() => undefined);
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
    await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 3_000 }).catch(() => undefined);
  }
}

async function ready(page) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(400);
}

async function shot(page, name) {
  await ready(page);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("  ", file);
}

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await mkdir(outDir, { recursive: true });

for (const width of widths) {
  await page.setViewportSize({ width: width.width, height: width.height });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await dismissCookies(page);
  await ready(page);
  await shot(page, `${width.name}-08-landing-hero`);
  if (width.width < 1024) {
    await page.getByRole("button", { name: /abrir menú/i }).click();
    await page.waitForTimeout(350);
    await shot(page, `${width.name}-08b-landing-menu`);
    await page.getByRole("button", { name: /cerrar menú/i }).click().catch(() => undefined);
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForTimeout(200);
  }
}

await browser.close();
console.log("landing shots done", phase);
