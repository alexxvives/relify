import puppeteer from "puppeteer";
import { mkdir, readFile } from "node:fs/promises";

const origin = "http://localhost:3000";
const dir = process.argv[2];
if (!dir) {
  console.error("usage: node tmp-round-n-shots.mjs <outdir>");
  process.exit(1);
}

const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
];

function assertText(haystack, needle, present, where) {
  const found = haystack.includes(needle);
  if (found !== present) {
    throw new Error(`${where}: expected ${present ? "to contain" : "not to contain"} ${JSON.stringify(needle)}`);
  }
}

async function sellerPasswords() {
  const fromEnv = process.env.INT_SELLER_PASSWORD;
  if (fromEnv) {
    return [fromEnv];
  }
  const passwords = ["IntFixture-local-only-not-prod"];
  try {
    const access = await readFile("/opt/cursor/artifacts/relify-int-test-access.txt", "utf8");
    const match = access.match(/SELLER \(seller-sabi\):\s+Email:.*\n\s+Password: (.+)/);
    if (match?.[1] && !passwords.includes(match[1].trim())) {
      passwords.push(match[1].trim());
    }
  } catch {
    /* fixture password is enough */
  }
  return passwords;
}

async function login(page, password) {
  await page.goto(`${origin}/entrar`, { waitUntil: "networkidle2", timeout: 30000 });
  await page.waitForSelector('input[name="email"]', { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.click('input[name="email"]', { clickCount: 3 });
  await page.type('input[name="email"]', "int-vendedor-sabi@test.local");
  await page.click('input[name="password"]', { clickCount: 3 });
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes("/entrar"), { timeout: 20000 }).catch(() => null);
}

async function shot(page, name, fullPage = true) {
  const file = `${dir}/${name}.png`;
  await page.screenshot({ path: file, fullPage });
  console.log(file);
}

async function openFicha(page) {
  const tab = await page.waitForSelector('button[role="tab"][data-tab="deal"]', { timeout: 15000 });
  await tab.click();
  await page.waitForFunction(
    () => document.body.innerText.includes("Cómo se verán los detalles de mi empresa"),
    { timeout: 25000 },
  );
  await new Promise((r) => setTimeout(r, 800));
}

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
page.setDefaultNavigationTimeout(45000);

try {
  await mkdir(dir, { recursive: true });
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  const passwords = await sellerPasswords();
  let signedIn = false;
  for (const password of passwords) {
    await login(page, password);
    if (!page.url().includes("/entrar")) {
      signedIn = true;
      break;
    }
    const alert = await page.evaluate(() => document.querySelector('[role="alert"]')?.textContent ?? "");
    console.log("login attempt failed", alert ? "with alert" : "without alert");
  }
  console.log("logged in", page.url());
  if (!signedIn) {
    throw new Error("login did not leave /entrar");
  }

  await page.goto(`${origin}/mi-empresa/detalles`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("h1", { timeout: 20000 });

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    const companyTab = await page.$('button[role="tab"][data-tab="company"]');
    if (companyTab) {
      await companyTab.click();
      await new Promise((r) => setTimeout(r, 500));
    }
    await page.waitForSelector("h1", { timeout: 20000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 500));
    const structure = await page.$("#panel-structure button[aria-expanded='false']");
    if (structure) {
      await structure.click();
      await new Promise((r) => setTimeout(r, 400));
    }
    const body = await page.evaluate(() => document.body.innerText);
    assertText(body, "Negociable", false, `detalles ${vp.name}`);
    assertText(body, "Lo rellenamos nosotros", false, `detalles ${vp.name}`);
    assertText(body, "Cifras de las cuentas anuales depositadas", true, `detalles ${vp.name}`);
    assertText(body, "Contratos, cuotas o clientes que repiten cada mes", true, `detalles ${vp.name}`);
    await shot(page, `detalles-${vp.name}`);

    const financing = await page.$("#panel-seller-financing");
    if (financing) {
      await financing.evaluate((el) => el.scrollIntoView({ block: "center" }));
      const radios = await page.$$('#panel-seller-financing button[role="radio"]');
      const labels = [];
      for (const radio of radios) {
        const label = await radio.evaluate((el) => (el.textContent ?? "").trim());
        labels.push(label);
        if (label === "Sí") {
          await radio.click();
        }
      }
      if (labels.includes("Negociable")) {
        throw new Error(`financing ${vp.name} still lists Negociable`);
      }
      if (!labels.includes("Sí") || !labels.includes("No")) {
        throw new Error(`financing ${vp.name} missing Sí/No: ${labels.join(",")}`);
      }
      await new Promise((r) => setTimeout(r, 300));
      const terms = await page.evaluate(() => {
        const pct = document.querySelector('#panel-seller-financing input[aria-label="Porcentaje del precio financiado"]');
        const years = document.querySelector('#panel-seller-financing input[aria-label="Plazo de la financiación en años"]');
        return { pct: Boolean(pct), years: Boolean(years) };
      });
      if (!terms.pct || !terms.years) {
        throw new Error(`financing ${vp.name} did not reveal % and años after Sí`);
      }
      await shot(page, `financing-${vp.name}`, false);
    }

    const figuresAlt = (
      await page.evaluateHandle(() => {
        const nodes = [...document.querySelectorAll("h2")];
        const title = nodes.find((node) => (node.textContent ?? "").includes("Tus cifras"));
        return title?.closest("section, div.rounded-2xl, div") ?? null;
      })
    ).asElement();
    if (figuresAlt) {
      await figuresAlt.evaluate((el) => el.scrollIntoView({ block: "start" }));
      await new Promise((r) => setTimeout(r, 250));
      await shot(page, `cifras-${vp.name}`, false);
    }

    await openFicha(page);
    const fichaText = await page.evaluate(() => document.body.innerText);
    assertText(fichaText, "Negociable", false, `ficha ${vp.name}`);
    await shot(page, `ficha-${vp.name}`);
    const resumen = await page.$("#resumen");
    if (resumen) {
      await resumen.evaluate((el) => {
        if (el instanceof HTMLDetailsElement && !el.open) el.open = true;
        el.scrollIntoView({ block: "start" });
      });
      await new Promise((r) => setTimeout(r, 400));
      const resumenText = await page.evaluate((el) => el.textContent ?? "", resumen);
      if (/\d,[0-9]M €/.test(resumenText) && !/\d,[0-9]+ M €/.test(resumenText)) {
        throw new Error(`resumen ${vp.name} still glues M without a space`);
      }
      await shot(page, `resumen-${vp.name}`, false);
    }
  }
} finally {
  await browser.close();
}
