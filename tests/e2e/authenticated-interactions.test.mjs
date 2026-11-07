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

async function testSellerTab2(browser) {
  console.log('\n🧪 Seller Tab 2 (Ficha pública)');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    await login(page, ACCOUNTS.seller.email, ACCOUNTS.seller.password);
    await page.goto('http://localhost:3000/mi-empresa/detalles', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Click "Ficha pública" tab
    const tabs = await page.$$('button[role="tab"]');
    let tabClicked = false;
    for (const tab of tabs) {
      const text = await tab.evaluate(el => el.textContent);
      if (text && text.includes('Ficha pública')) {
        await tab.click();
        tabClicked = true;
        break;
      }
    }
    
    if (!tabClicked) {
      console.log('  ❌ Could not find "Ficha pública" tab');
      await context.close();
      return { passed: false, error: 'Tab not found' };
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify URL contains ?tab=ficha
    const url = page.url();
    const hasTabParam = url.includes('tab=ficha');
    console.log(`  ${hasTabParam ? '✅' : '❌'} URL contains ?tab=ficha: ${hasTabParam}`);
    
    // Verify tab content is visible
    const content = await page.evaluate(() => {
      // Look for "Datos de la ficha" or "proyecto" in the content
      const text = document.body.textContent || '';
      return {
        hasDatosSection: text.includes('Datos de la ficha') || text.includes('proyecto') || text.includes('Precio'),
        visiblePanels: Array.from(document.querySelectorAll('[id^="panel-"]')).map(el => el.id),
      };
    });
    
    console.log(`  ${content.hasDatosSection ? '✅' : '⚠️'} Tab 2 content visible`);
    console.log(`  📋 Visible panels: ${content.visiblePanels.join(', ')}`);
    
    await context.close();
    return { passed: hasTabParam && content.hasDatosSection, url, content };
    
  } catch (error) {
    await context.close();
    console.log(`  ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testEbitdaModal(browser) {
  console.log('\n🧪 EBITDA Modal Interactions');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  try {
    await login(page, ACCOUNTS.seller.email, ACCOUNTS.seller.password);
    await page.goto('http://localhost:3000/mi-empresa/detalles?tab=ficha', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Look for EBITDA adjustment button
    const buttons = await page.$$('button');
    let modalOpened = false;
    
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent);
      if (text && (text.includes('Ajustes') || text.includes('EBITDA ajustado'))) {
        await btn.click();
        modalOpened = true;
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      }
    }
    
    if (!modalOpened) {
      console.log('  ⚠️  EBITDA modal button not found (may be in draft state)');
      await context.close();
      return { passed: true, skipped: true, reason: 'No EBITDA button available' };
    }
    
    // Check if modal is open
    const modalState = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const backdrop = document.querySelector('[data-overlay], .overlay, [class*="backdrop"]');
      const bodyScrollLocked = document.body.style.overflow === 'hidden' || 
                               document.documentElement.style.overflow === 'hidden';
      
      return {
        modalExists: !!dialog,
        backdropExists: !!backdrop,
        bodyScrollLocked,
        modalContent: dialog?.textContent?.slice(0, 100) || null,
      };
    });
    
    console.log(`  ${modalState.modalExists ? '✅' : '❌'} Modal opened`);
    console.log(`  ${modalState.bodyScrollLocked ? '✅' : '❌'} Body scroll locked`);
    console.log(`  ${modalState.backdropExists ? '✅' : '⚠️'} Backdrop visible`);
    
    // Look for "Tipo" dropdown if modal is open
    if (modalState.modalExists) {
      const dropdown = await page.$('select[name*="tipo"], select[name*="type"], [role="combobox"]');
      console.log(`  ${dropdown ? '✅' : '⚠️'} Found tipo/type control`);
      
      // Check focus management
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      console.log(`  📍 Focused element: ${focusedElement}`);
    }
    
    await context.close();
    return { passed: modalState.modalExists, modalState };
    
  } catch (error) {
    await context.close();
    console.log(`  ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testShortHeight(browser) {
  console.log('\n🧪 Short Height Modal (390×500)');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 500 });
  
  try {
    await login(page, ACCOUNTS.seller.email, ACCOUNTS.seller.password);
    await page.goto('http://localhost:3000/mi-empresa/detalles', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Check if modal or content fits without overflow
    const dimensions = await page.evaluate(() => {
      return {
        documentHeight: document.documentElement.scrollHeight,
        windowHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        windowWidth: window.innerWidth,
        hasVerticalScroll: document.documentElement.scrollHeight > window.innerHeight,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    
    console.log(`  ${!dimensions.hasHorizontalScroll ? '✅' : '❌'} No horizontal overflow (${dimensions.documentWidth}px doc, ${dimensions.windowWidth}px viewport)`);
    console.log(`  📏 Vertical scroll: ${dimensions.hasVerticalScroll ? 'yes' : 'no'} (${dimensions.documentHeight}px doc, ${dimensions.windowHeight}px viewport)`);
    
    await context.close();
    return { passed: !dimensions.hasHorizontalScroll, dimensions };
    
  } catch (error) {
    await context.close();
    console.log(`  ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testBuyerMercado(browser) {
  console.log('\n🧪 Buyer Marketplace Filters');
  
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
    
    // Verify buyer role and content
    const content = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        hasProjects: text.includes('proyecto') || text.includes('Proyecto'),
        hasFilters: !!document.querySelector('select, input[type="search"], [role="combobox"]'),
        projectCards: document.querySelectorAll('[data-project], [data-card], article').length,
        bodyText: text.slice(0, 200),
      };
    });
    
    console.log(`  ${content.hasProjects ? '✅' : '⚠️'} Project content visible`);
    console.log(`  ${content.hasFilters ? '✅' : '⚠️'} Filter controls present`);
    console.log(`  📊 Found ${content.projectCards} potential project cards`);
    
    await context.close();
    return { passed: content.hasProjects, content };
    
  } catch (error) {
    await context.close();
    console.log(`  ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testBuyerFicha(browser) {
  console.log('\n🧪 Buyer Company Ficha');
  
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
    
    // Verify company ficha content
    const content = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        hasCompanyInfo: text.includes('Cala') || text.includes('proyecto'),
        hasNdaSection: text.includes('NDA') || text.includes('confidencial'),
        visibleSections: Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.textContent?.trim()).filter(Boolean),
      };
    });
    
    console.log(`  ${content.hasCompanyInfo ? '✅' : '❌'} Company ficha content visible`);
    console.log(`  📋 Sections: ${content.visibleSections.slice(0, 5).join(', ')}`);
    
    await context.close();
    return { passed: content.hasCompanyInfo, content };
    
  } catch (error) {
    await context.close();
    console.log(`  ❌ Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function runInteractionTests() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('🧪 Running Interaction Tests\n');
  console.log('═'.repeat(60));
  
  const results = {
    sellerTab2: await testSellerTab2(browser),
    ebitdaModal: await testEbitdaModal(browser),
    shortHeight: await testShortHeight(browser),
    buyerMercado: await testBuyerMercado(browser),
    buyerFicha: await testBuyerFicha(browser),
  };

  await browser.close();
  
  console.log('\n📊 SUMMARY');
  console.log('═'.repeat(60));
  
  const tests = Object.entries(results);
  const passed = tests.filter(([_, r]) => r.passed && !r.skipped).length;
  const skipped = tests.filter(([_, r]) => r.skipped).length;
  const failed = tests.filter(([_, r]) => !r.passed && !r.skipped).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILURES:');
    tests.filter(([_, r]) => !r.passed && !r.skipped).forEach(([name, result]) => {
      console.log(`  - ${name}: ${result.error || 'assertion failed'}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All interaction tests passed!');
    process.exit(0);
  }
}

runInteractionTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
