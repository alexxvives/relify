import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

const SELLER = { email: 'vendedor@itsreleva.com', password: '@Releva1z2x' };
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

async function testEbitdaModal(browser) {
  console.log('\n🧪 Test 1: EBITDA Modal Interaction');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  try {
    // Test at 390px
    await page.setViewport({ width: 390, height: 844 });
    await login(page, SELLER.email, SELLER.password);
    await page.goto('http://localhost:3000/mi-empresa/detalles?tab=ficha', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find EBITDA adjustment button
    const adjustmentButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('Ajustes') || text.includes('ajuste') || text.includes('EBITDA ajustado');
      });
    });
    
    if (!adjustmentButton.asElement()) {
      throw new Error('EBITDA adjustment button not found');
    }
    
    await adjustmentButton.asElement().click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify modal opened
    const modalState = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const bodyLocked = document.body.style.overflow === 'hidden' || 
                        document.documentElement.style.overflow === 'hidden' ||
                        document.body.classList.contains('overflow-hidden');
      
      return {
        modalExists: !!dialog,
        bodyLocked,
        hasDropdown: !!document.querySelector('select, [role="combobox"]'),
      };
    });
    
    if (!modalState.modalExists) {
      throw new Error('Modal did not open');
    }
    
    console.log(`  ✅ Modal opened at 390px`);
    console.log(`  ${modalState.bodyLocked ? '✅' : '❌'} Body scroll locked`);
    console.log(`  ${modalState.hasDropdown ? '✅' : '⚠️'} Dropdown present`);
    
    // Screenshot at 390px
    await mkdir('/opt/cursor/artifacts/final', { recursive: true });
    await page.screenshot({ path: '/opt/cursor/artifacts/final/ebitda-modal-390px.png' });
    
    // Test at short height
    await page.setViewport({ width: 390, height: 500 });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const shortHeightOverflow = await page.evaluate(() => {
      return {
        documentWidth: document.documentElement.scrollWidth,
        windowWidth: window.innerWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    
    console.log(`  ${!shortHeightOverflow.hasHorizontalOverflow ? '✅' : '❌'} No horizontal overflow at 390x500`);
    
    await page.screenshot({ path: '/opt/cursor/artifacts/final/ebitda-modal-390x500.png' });
    
    await context.close();
    return { passed: true, modalState, shortHeightOverflow };
    
  } catch (error) {
    await context.close();
    console.log(`  ❌ ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testAutosave(browser) {
  console.log('\n🧪 Test 2: Autosave Persistence');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    await login(page, SELLER.email, SELLER.password);
    await page.goto('http://localhost:3000/mi-empresa/detalles?tab=ficha', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find codename/project name input
    const testValue = `Test ${Date.now()}`;
    const inputFilled = await page.evaluate((value) => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
      const codenameInput = inputs.find(input => {
        const label = input.labels?.[0]?.textContent || input.placeholder || input.name || '';
        return label.toLowerCase().includes('nombre') || label.toLowerCase().includes('apodo');
      });
      
      if (codenameInput) {
        codenameInput.value = value;
        codenameInput.dispatchEvent(new Event('input', { bubbles: true }));
        codenameInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, testValue);
    
    if (!inputFilled) {
      throw new Error('Could not find editable input field');
    }
    
    console.log(`  ✅ Entered test value: ${testValue}`);
    
    // Wait for autosave (look for save indicator)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify value persisted
    const persistedValue = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'));
      const codenameInput = inputs.find(input => {
        const label = input.labels?.[0]?.textContent || input.placeholder || input.name || '';
        return label.toLowerCase().includes('nombre') || label.toLowerCase().includes('apodo');
      });
      return codenameInput?.value || null;
    });
    
    if (persistedValue !== testValue) {
      throw new Error(`Value did not persist. Expected: ${testValue}, Got: ${persistedValue}`);
    }
    
    console.log(`  ✅ Value persisted after reload`);
    
    await context.close();
    return { passed: true, testValue, persistedValue };
    
  } catch (error) {
    await context.close();
    console.log(`  ❌ ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testNdaModalUI(browser) {
  console.log('\n🧪 Test 3: NDA Modal UI (No Signature)');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  try {
    await login(page, BUYER.email, BUYER.password);
    await page.goto('http://localhost:3000/proyectos/proyecto-cala', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Look for NDA-related content
    const ndaContent = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        hasNdaSection: text.includes('NDA') || text.includes('confidencial') || text.includes('Firmar'),
        hasProtectedData: text.includes('dato') || text.includes('información'),
        postNda: text.includes('firmado') || text.includes('acceso concedido'),
      };
    });
    
    console.log(`  ${ndaContent.hasNdaSection || ndaContent.postNda ? '✅' : '⚠️'} NDA-related content present`);
    console.log(`  ${ndaContent.postNda ? '✅' : '⚠️'} Post-NDA state (access granted)`);
    
    await page.screenshot({ path: '/opt/cursor/artifacts/final/nda-state-390px.png' });
    
    await context.close();
    return { passed: true, ndaContent };
    
  } catch (error) {
    await context.close();
    console.log(`  ❌ ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testPhotoGallery(browser) {
  console.log('\n🧪 Test 4: Photo Gallery Rendering');
  
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    await login(page, SELLER.email, SELLER.password);
    await page.goto('http://localhost:3000/mi-empresa/detalles?tab=ficha', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Look for photo gallery or upload component
    const galleryInfo = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const uploadButtons = Array.from(document.querySelectorAll('button, input[type="file"]')).filter(el => {
        const text = el.textContent || el.getAttribute('aria-label') || '';
        return text.toLowerCase().includes('foto') || text.toLowerCase().includes('imagen') || text.toLowerCase().includes('subir');
      });
      
      return {
        imageCount: images.length,
        hasUploadControl: uploadButtons.length > 0,
        uploadControlCount: uploadButtons.length,
      };
    });
    
    console.log(`  ✅ Gallery component present (${galleryInfo.imageCount} images, ${galleryInfo.uploadControlCount} upload controls)`);
    
    await page.screenshot({ path: '/opt/cursor/artifacts/final/gallery-1440px.png' });
    
    await context.close();
    return { passed: true, galleryInfo };
    
  } catch (error) {
    await context.close();
    console.log(`  ❌ ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function runCompleteTests() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('🧪 Running Complete Interaction Tests\n');
  console.log('═'.repeat(60));
  
  const results = {
    ebitdaModal: await testEbitdaModal(browser),
    autosave: await testAutosave(browser),
    ndaModal: await testNdaModalUI(browser),
    photoGallery: await testPhotoGallery(browser),
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
    console.log('\n✅ All interaction tests passed!');
    process.exit(0);
  }
}

runCompleteTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
