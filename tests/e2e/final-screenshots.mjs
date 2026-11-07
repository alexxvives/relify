import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const BUYER = { email: 'inversor@itsreleva.com', password: '@Releva1z2x' };

async function login(page, email, password) {
  await page.goto('http://localhost:3000/entrar', { waitUntil: 'networkidle0', timeout: 10000 });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function captureMarketplace(browser, outputDir, label) {
  console.log(`\n📸 Capturing marketplace ${label}`);
  
  await mkdir(outputDir, { recursive: true });
  
  // 390px - Filters closed
  const context1 = await browser.createBrowserContext();
  const page1 = await context1.newPage();
  await page1.setViewport({ width: 390, height: 844 });
  
  await login(page1, BUYER.email, BUYER.password);
  await page1.goto('http://localhost:3000/mercado', { 
    waitUntil: 'networkidle0',
    timeout: 10000 
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await page1.screenshot({ path: `${outputDir}/mercado-390-closed.png` });
  console.log(`  ✅ 390px filters closed`);
  
  // 390px - Filters open
  const filtrosButton = await page1.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(btn => btn.textContent?.includes('Filtros'));
  });
  if (filtrosButton) {
    await page1.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Filtros'));
      if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 300));
    await page1.screenshot({ path: `${outputDir}/mercado-390-open.png` });
    console.log(`  ✅ 390px filters open`);
  }
  
  await context1.close();
  
  // 1440px
  const context2 = await browser.createBrowserContext();
  const page2 = await context2.newPage();
  await page2.setViewport({ width: 1440, height: 900 });
  
  await login(page2, BUYER.email, BUYER.password);
  await page2.goto('http://localhost:3000/mercado', { 
    waitUntil: 'networkidle0',
    timeout: 10000 
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await page2.screenshot({ path: `${outputDir}/mercado-1440.png` });
  console.log(`  ✅ 1440px desktop`);
  
  await context2.close();
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('📸 Capturing Final Screenshots');
  
  await captureMarketplace(browser, '/opt/cursor/artifacts/final', 'feature branch');

  await browser.close();
  console.log('\n✅ Screenshots complete');
}

main().catch(console.error);
