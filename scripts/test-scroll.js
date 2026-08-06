const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8081/product/1157');
  await page.waitForTimeout(4000);
  
  // Scroll down in the main scroll container
  await page.evaluate(() => {
    const scrollables = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    });
    scrollables.forEach(el => {
      el.scrollTop = 900;
    });
    window.scrollTo(0, 900);
  });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/pc/.gemini/antigravity-cli/brain/5fd569b1-6916-48bc-b294-c4795b4e2d32/scrolled_banner.png' });
  await browser.close();
  console.log('Done screenshot');
})();
