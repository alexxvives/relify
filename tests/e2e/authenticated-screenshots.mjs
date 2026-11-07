import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const ACCOUNTS = {
  seller: { email: 'vendedor@itsreleva.com', password: '@Releva1z2x' },
  buyer: { email: 'inversor@itsreleva.com', password: '@Releva1z2x' },
  advisor: { email: 'asesor@itsreleva.com', password: '@Releva1z2x' },
};

const WIDTHS = [
  { width: 360, height: 640, name: '360' },
  { width: 390, height: 844, name: '390' },
  { width: 430, height: 932, name: '430' },
  { width: 768, height: 1024, name: '768' },
  { width: 1440, height: 900, name: '1440' },
  { width: 1920, height: 1080, name: '1920' },
];

const PRIMARY_WIDTHS = ['390', '1440'];
const CHECK_WIDTHS = ['360', '430', '768', '1920'];

const SELLER_ROUTES = [
  { path: '/inicio', name: 'seller-inicio' },
  { path: '/mi-empresa/detalles', name: 'seller-detalles-tab1' },
  { path: '/mi-empresa/servicios', name: 'seller-servicios' },
];

const BUYER_ROUTES = [
  { path: '/mercado', name: 'buyer-mercado' },
  { path: '/procesos', name: 'buyer-procesos' },
  { path: '/proyectos/proyecto-cala', name: 'buyer-ficha-prenDA' },
];

const ADVISOR_ROUTES = [
  { path: '/asesoramiento', name: 'advisor-listing' },
  { path: '/premium/suscripcion', name: 'advisor-subscription' },
];

async function login(page, email, password) {
  console.log(`  🔐 Logging in as ${email}...`);
  
  await page.goto('http://localhost:3000/entrar', { waitUntil: 'networkidle0' });
  
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
    page.click('button[type="submit"]'),
  ]);
  
  console.log(`  ✅ Logged in successfully`);
}

async function takeScreenshot(page, name, width) {
  const dir = `/workspace/screenshots/authenticated`;
  await mkdir(dir, { recursive: true });
  const filename = `${dir}/${name}-${width}px.png`;
  await page.screenshot({ path: filename, fullPage: false });
  return filename;
}

async function captureRoutes(page, routes, role, widths) {
  const screenshots = [];
  
  for (const route of routes) {
    console.log(`    📄 ${route.path}`);
    
    try {
      await page.goto(`http://localhost:3000${route.path}`, { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
      
      // Wait a bit for any client-side rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we got redirected (e.g., authentication failed)
      const currentUrl = page.url();
      if (currentUrl.includes('/entrar') || currentUrl.includes('/registro')) {
        console.log(`    ⚠️  Redirected to auth - skipping`);
        continue;
      }
      
      for (const width of widths) {
        const filename = await takeScreenshot(page, `${role}-${route.name}`, width);
        screenshots.push({ role, route: route.name, width, filename });
      }
      
    } catch (error) {
      console.error(`    ❌ Error: ${error.message}`);
    }
  }
  
  return screenshots;
}

async function testAuthenticatedFlows() {
  await mkdir('/workspace/screenshots/authenticated', { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  console.log('🚀 Browser launched\n');
  const allScreenshots = [];

  // Test Seller Flow
  console.log('👤 SELLER FLOW');
  console.log('═'.repeat(50));
  
  for (const viewportConfig of WIDTHS) {
    if (!PRIMARY_WIDTHS.includes(viewportConfig.name) && !CHECK_WIDTHS.includes(viewportConfig.name)) {
      continue;
    }
    
    // Use incognito context for clean session
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(viewportConfig);
    
    console.log(`\n📱 Width: ${viewportConfig.name}px`);
    
    try {
      await login(page, ACCOUNTS.seller.email, ACCOUNTS.seller.password);
      const screenshots = await captureRoutes(page, SELLER_ROUTES, 'seller', [viewportConfig.name]);
      allScreenshots.push(...screenshots);
    } catch (error) {
      console.error(`  ❌ Seller flow failed: ${error.message}`);
    }
    
    await context.close();
  }

  // Test Buyer Flow
  console.log('\n👤 BUYER FLOW');
  console.log('═'.repeat(50));
  
  for (const viewportConfig of WIDTHS) {
    if (!PRIMARY_WIDTHS.includes(viewportConfig.name) && !CHECK_WIDTHS.includes(viewportConfig.name)) {
      continue;
    }
    
    // Use incognito context for clean session
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(viewportConfig);
    
    console.log(`\n📱 Width: ${viewportConfig.name}px`);
    
    try {
      await login(page, ACCOUNTS.buyer.email, ACCOUNTS.buyer.password);
      const screenshots = await captureRoutes(page, BUYER_ROUTES, 'buyer', [viewportConfig.name]);
      allScreenshots.push(...screenshots);
    } catch (error) {
      console.error(`  ❌ Buyer flow failed: ${error.message}`);
    }
    
    await context.close();
  }

  // Test Advisor Flow
  console.log('\n👤 ADVISOR FLOW');
  console.log('═'.repeat(50));
  
  for (const viewportConfig of WIDTHS) {
    if (!PRIMARY_WIDTHS.includes(viewportConfig.name) && !CHECK_WIDTHS.includes(viewportConfig.name)) {
      continue;
    }
    
    // Use incognito context for clean session
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(viewportConfig);
    
    console.log(`\n📱 Width: ${viewportConfig.name}px`);
    
    try {
      await login(page, ACCOUNTS.advisor.email, ACCOUNTS.advisor.password);
      const screenshots = await captureRoutes(page, ADVISOR_ROUTES, 'advisor', [viewportConfig.name]);
      allScreenshots.push(...screenshots);
    } catch (error) {
      console.error(`  ❌ Advisor flow failed: ${error.message}`);
    }
    
    await context.close();
  }

  await browser.close();
  
  console.log('\n📊 SUMMARY');
  console.log('═'.repeat(50));
  console.log(`✅ ${allScreenshots.length} authenticated screenshots captured`);
  console.log(`📁 Location: /workspace/screenshots/authenticated/`);
  
  return allScreenshots;
}

testAuthenticatedFlows().catch(console.error);
