import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const WIDTHS = [
  { width: 360, height: 640, name: '360px-phone' },
  { width: 390, height: 844, name: '390px-phone' },
  { width: 430, height: 932, name: '430px-phone' },
  { width: 768, height: 1024, name: '768px-tablet' },
  { width: 1440, height: 900, name: '1440px-desktop' },
];

const PAGES = [
  { url: '/', name: 'landing', needsAuth: false },
  { url: '/registro', name: 'registro', needsAuth: false },
  { url: '/entrar', name: 'login', needsAuth: false },
  { url: '/mercado', name: 'marketplace', needsAuth: true },
];

async function takeScreenshots() {
  await mkdir('/workspace/screenshots', { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  console.log('Browser launched');

  for (const viewport of WIDTHS) {
    console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const page = await browser.newPage();
    await page.setViewport(viewport);

    for (const pageInfo of PAGES) {
      if (pageInfo.needsAuth) {
        console.log(`  ⏭️  Skipping ${pageInfo.name} (requires auth)`);
        continue;
      }

      try {
        const url = `http://localhost:3000${pageInfo.url}`;
        console.log(`  📸 Capturing ${pageInfo.name}...`);
        
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
        
        const filename = `/workspace/screenshots/${pageInfo.name}-${viewport.name}.png`;
        await page.screenshot({ path: filename, fullPage: false });
        
        console.log(`  ✅ Saved ${filename}`);
      } catch (error) {
        console.error(`  ❌ Error capturing ${pageInfo.name}: ${error.message}`);
      }
    }

    await page.close();
  }

  await browser.close();
  console.log('\n✅ All screenshots complete!');
}

takeScreenshots().catch(console.error);
