import puppeteer from 'puppeteer';

const WIDTHS = [360, 390, 430, 768, 1440];
const PAGES = [
  { url: '/', name: 'Landing' },
  { url: '/registro', name: 'Registration' },
  { url: '/entrar', name: 'Login' },
];

async function testResponsive() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const width of WIDTHS) {
    console.log(`\n📏 Testing width: ${width}px`);
    
    const page = await browser.newPage();
    await page.setViewport({ width, height: 800 });

    for (const pageInfo of PAGES) {
      try {
        await page.goto(`http://localhost:3000${pageInfo.url}`, { 
          waitUntil: 'networkidle0',
          timeout: 10000 
        });

        // Check for horizontal overflow
        const dimensions = await page.evaluate(() => {
          return {
            documentWidth: document.documentElement.scrollWidth,
            windowWidth: window.innerWidth,
            bodyWidth: document.body.scrollWidth,
            hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
          };
        });

        const overflow = dimensions.hasHorizontalScroll;
        const symbol = overflow ? '❌' : '✅';
        
        console.log(`  ${symbol} ${pageInfo.name}: ${overflow ? 'OVERFLOW' : 'OK'} (doc: ${dimensions.documentWidth}px, viewport: ${dimensions.windowWidth}px)`);
        
        results.push({
          width,
          page: pageInfo.name,
          overflow,
          dimensions
        });
      } catch (error) {
        console.error(`  ❌ Error testing ${pageInfo.name}: ${error.message}`);
      }
    }

    await page.close();
  }

  await browser.close();

  const overflows = results.filter(r => r.overflow);
  console.log(`\n📊 Summary: ${results.length - overflows.length}/${results.length} tests passed`);
  
  if (overflows.length > 0) {
    console.log('\n❌ Pages with overflow:');
    overflows.forEach(r => {
      console.log(`  - ${r.page} at ${r.width}px (${r.dimensions.documentWidth}px document width)`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All pages fit within viewport - no horizontal overflow detected!');
    process.exit(0);
  }
}

testResponsive().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
