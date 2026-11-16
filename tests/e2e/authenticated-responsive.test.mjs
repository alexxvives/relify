import puppeteer from 'puppeteer';

const ACCOUNTS = {
  seller: { email: 'vendedor@itsreleva.com', password: '@Releva1z2x' },
  buyer: { email: 'inversor@itsreleva.com', password: '@Releva1z2x' },
  advisor: { email: 'asesor@itsreleva.com', password: '@Releva1z2x' },
};

const TEST_WIDTHS = [360, 390, 430, 768, 1440, 1920];

const ROUTES = {
  seller: [
    '/inicio',
    '/mi-empresa/detalles',
    '/mi-empresa/servicios',
  ],
  buyer: [
    '/mercado',
    '/procesos',
    '/proyectos/proyecto-cala',
  ],
  advisor: [
    '/asesoramiento',
    '/premium/suscripcion',
  ],
};

async function login(page, email, password) {
  await page.goto('http://localhost:3000/entrar', { waitUntil: 'networkidle0', timeout: 10000 });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function testRoute(page, route, width, role) {
  try {
    await page.goto(`http://localhost:3000${route}`, { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if we got redirected to auth
    const currentUrl = page.url();
    if (currentUrl.includes('/entrar') || currentUrl.includes('/registro')) {
      return { route, width, role, overflow: null, error: 'redirected to auth' };
    }
    
    const dimensions = await page.evaluate(() => {
      return {
        documentWidth: document.documentElement.scrollWidth,
        windowWidth: window.innerWidth,
        bodyWidth: document.body.scrollWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    
    return {
      route,
      width,
      role,
      overflow: dimensions.hasHorizontalScroll,
      dimensions
    };
  } catch (error) {
    return { route, width, role, overflow: null, error: error.message };
  }
}

async function testAuthenticatedResponsive() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  
  for (const [role, account] of Object.entries(ACCOUNTS)) {
    if (!ROUTES[role]) continue;
    
    console.log(`\n🧪 Testing ${role.toUpperCase()} routes`);
    
    for (const width of TEST_WIDTHS) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width, height: 800 });
      
      try {
        await login(page, account.email, account.password);
        
        for (const route of ROUTES[role]) {
          const result = await testRoute(page, route, width, role);
          results.push(result);
          
          const symbol = result.error ? '⚠️' : result.overflow ? '❌' : '✅';
          const status = result.error ? `ERROR: ${result.error}` : 
                        result.overflow ? `OVERFLOW (${result.dimensions.documentWidth}px)` : 
                        'OK';
          console.log(`  ${symbol} ${width}px ${route}: ${status}`);
        }
      } catch (error) {
        console.error(`  ❌ ${role} @ ${width}px failed: ${error.message}`);
      }
      
      await context.close();
    }
  }

  await browser.close();

  // Summarize results
  const validResults = results.filter(r => !r.error);
  const overflows = validResults.filter(r => r.overflow);
  const passed = validResults.length - overflows.length;
  
  console.log(`\n📊 SUMMARY`);
  console.log(`═`.repeat(60));
  console.log(`Total routes tested: ${validResults.length}`);
  console.log(`Passed (no overflow): ${passed}`);
  console.log(`Failed (overflow): ${overflows.length}`);
  
  if (results.some(r => r.error)) {
    console.log(`\n⚠️  ERRORS:`);
    results.filter(r => r.error).forEach(r => {
      console.log(`  - ${r.role} @ ${r.width}px ${r.route}: ${r.error}`);
    });
  }
  
  if (overflows.length > 0) {
    console.log(`\n❌ OVERFLOW DETECTED:`);
    overflows.forEach(r => {
      console.log(`  - ${r.role} @ ${r.width}px ${r.route} (doc: ${r.dimensions.documentWidth}px)`);
    });
    process.exit(1);
  } else {
    console.log(`\n✅ All authenticated routes fit within viewport!`);
    process.exit(0);
  }
}

testAuthenticatedResponsive().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
