import puppeteer from 'puppeteer';

const ACCOUNTS = {
  seller: { email: 'vendedor@itsreleva.com', password: '@Releva1z2x' },
  buyer: { email: 'inversor@itsreleva.com', password: '@Releva1z2x' },
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

async function verifyNoBlockingDialog(page, routeName) {
  const hasAgreementDialog = await page.evaluate(() => {
    const text = document.body.textContent || '';
    return text.includes('Acuerdo con Relify') || text.includes('Platform Agreement');
  });
  
  if (hasAgreementDialog) {
    throw new Error(`❌ ${routeName}: Blocked by platform agreement dialog`);
  }
}

async function testBuyerMercado(browser) {
  console.log('\n🧪 Buyer Marketplace - Content Verification');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  try {
    await login(page, ACCOUNTS.buyer.email, ACCOUNTS.buyer.password);
    await page.goto('http://localhost:3000/mercado', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // FAIL if agreement dialog is present
    await verifyNoBlockingDialog(page, 'Mercado');
    
    // Verify actual marketplace content
    const content = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        hasProyecto: text.includes('Proyecto') || text.includes('proyecto'),
        hasFilters: !!document.querySelector('select, input[type="search"]'),
        hasCards: document.querySelectorAll('[data-testid*="project"], article, [class*="card"]').length > 0,
        headings: Array.from(document.querySelectorAll('h1, h2')).map(h => h.textContent?.trim()).filter(Boolean).slice(0, 5),
      };
    });
    
    if (!content.hasProyecto) {
      throw new Error('❌ Mercado: No project content visible');
    }
    
    console.log(`  ✅ Marketplace content visible`);
    console.log(`  ✅ Filters present: ${content.hasFilters}`);
    console.log(`  📋 Headings: ${content.headings.join(', ')}`);
    
    // Take screenshot
    await page.screenshot({ path: '/opt/cursor/artifacts/after/buyer-mercado-390px.png' });
    
    await context.close();
    return { passed: true, content };
    
  } catch (error) {
    await context.close();
    console.log(`  ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testBuyerFicha(browser) {
  console.log('\n🧪 Buyer Company Ficha - Content Verification');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    await login(page, ACCOUNTS.buyer.email, ACCOUNTS.buyer.password);
    await page.goto('http://localhost:3000/proyectos/proyecto-cala', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // FAIL if agreement dialog is present
    await verifyNoBlockingDialog(page, 'Ficha');
    
    // Verify company ficha content
    const content = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        hasProjectName: text.includes('Cala') || text.includes('Proyecto'),
        hasNdaSection: text.includes('NDA') || text.includes('datos confidenciales') || text.includes('Firmar'),
        sections: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean).slice(0, 10),
      };
    });
    
    if (!content.hasProjectName) {
      throw new Error('❌ Ficha: No company content visible');
    }
    
    console.log(`  ✅ Company ficha content visible`);
    console.log(`  📋 Sections: ${content.sections.join(', ')}`);
    
    // Take screenshot
    await page.screenshot({ path: '/opt/cursor/artifacts/after/buyer-ficha-1440px.png' });
    
    await context.close();
    return { passed: true, content };
    
  } catch (error) {
    await context.close();
    console.log(`  ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testSellerTab2(browser) {
  console.log('\n🧪 Seller Tab 2 - Content and URL Verification');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    await login(page, ACCOUNTS.seller.email, ACCOUNTS.seller.password);
    await page.goto('http://localhost:3000/mi-empresa/detalles', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    await verifyNoBlockingDialog(page, 'Seller Details');
    
    // Click tab 2
    const tabs = await page.$$('button[role="tab"]');
    for (const tab of tabs) {
      const text = await tab.evaluate(el => el.textContent);
      if (text && text.includes('Ficha pública')) {
        await tab.click();
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check URL parameter
    const url = page.url();
    const hasTabParam = url.includes('tab=ficha');
    
    if (!hasTabParam) {
      throw new Error('❌ Tab URL bug: ?tab=ficha not added to URL after tab click');
    }
    
    console.log(`  ✅ Tab URL parameter present`);
    
    // Take screenshot
    await page.screenshot({ path: '/opt/cursor/artifacts/after/seller-details-tab2-1440px.png' });
    
    await context.close();
    return { passed: true, url };
    
  } catch (error) {
    await context.close();
    console.log(`  ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function runContentVerification() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('🧪 Content Verification Tests\n');
  console.log('═'.repeat(60));
  
  const results = {
    buyerMercado: await testBuyerMercado(browser),
    buyerFicha: await testBuyerFicha(browser),
    sellerTab2: await testSellerTab2(browser),
  };

  await browser.close();
  
  console.log('\n📊 SUMMARY');
  console.log('═'.repeat(60));
  
  const tests = Object.entries(results);
  const passed = tests.filter(([_, r]) => r.passed).length;
  const failed = tests.filter(([_, r]) => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILURES:');
    tests.filter(([_, r]) => !r.passed).forEach(([name, result]) => {
      console.log(`  - ${name}: ${result.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All content verification tests passed!');
    process.exit(0);
  }
}

runContentVerification().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
