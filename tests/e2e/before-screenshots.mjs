import puppeteer from 'puppeteer';
import { copyFile } from 'fs/promises';

const ACCOUNTS = {
  seller: { email: 'vendedor@itsreleva.com', password: '@Releva1z2x' },
  buyer: { email: 'inversor@itsreleva.com', password: '@Releva1z2x' },
};

const SCENARIOS = [
  { role: 'seller', path: '/mi-empresa/detalles', action: 'clickTab2', name: 'seller-details-tab2', widths: [390, 1440] },
  { role: 'seller', path: '/mi-empresa/detalles', action: 'openEbitdaModal', name: 'seller-ebitda-modal', widths: [390, 1440] },
  { role: 'seller', path: '/mi-empresa/detalles', action: 'shortHeight', name: 'seller-modal-short', widths: [{ width: 390, height: 500 }] },
  { role: 'buyer', path: '/mercado', action: 'none', name: 'buyer-mercado', widths: [390, 1440] },
  { role: 'buyer', path: '/proyectos/proyecto-cala', action: 'none', name: 'buyer-ficha', widths: [390, 1440] },
];

async function login(page, email, password) {
  await page.goto('http://localhost:3000/entrar', { waitUntil: 'networkidle0', timeout: 10000 });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function captureScenario(browser, scenario, outputDir) {
  console.log(`\n📸 ${scenario.name}`);
  
  for (const viewportConfig of scenario.widths) {
    const viewport = typeof viewportConfig === 'number' 
      ? { width: viewportConfig, height: 900 }
      : viewportConfig;
    
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(viewport);
    
    const widthLabel = viewport.height === 900 ? `${viewport.width}` : `${viewport.width}x${viewport.height}`;
    console.log(`  ${widthLabel}px...`);
    
    try {
      const account = ACCOUNTS[scenario.role];
      await login(page, account.email, account.password);
      
      await page.goto(`http://localhost:3000${scenario.path}`, { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Perform action if specified
      if (scenario.action === 'clickTab2') {
        // Find and click "Ficha pública" tab
        const tabs = await page.$$('button[role="tab"]');
        for (const tab of tabs) {
          const text = await tab.evaluate(el => el.textContent);
          if (text && text.includes('Ficha pública')) {
            await tab.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        }
      } else if (scenario.action === 'openEbitdaModal') {
        // Look for EBITDA ajustado button or "Ajustes" text
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await btn.evaluate(el => el.textContent);
          if (text && (text.includes('Ajustes') || text.includes('EBITDA'))) {
            await btn.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        }
      }
      
      const filename = `${outputDir}/${scenario.name}-${widthLabel}px.png`;
      await page.screenshot({ path: filename, fullPage: false });
      console.log(`  ✅ ${filename}`);
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
    
    await context.close();
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('📸 Capturing BEFORE screenshots\n');
  
  for (const scenario of SCENARIOS) {
    await captureScenario(browser, scenario, '/opt/cursor/artifacts/before');
  }

  await browser.close();
  console.log('\n✅ Before screenshots complete');
}

main().catch(console.error);
