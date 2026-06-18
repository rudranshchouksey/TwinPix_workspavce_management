const { chromium } = require('playwright');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { chromium: chromiumExtra } = require('playwright-extra');

chromiumExtra.use(StealthPlugin());

async function main() {
  console.log("Launching browser...");
  const browser = await chromiumExtra.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log("Navigating to Instagram...");
  await page.goto('https://www.instagram.com/therock/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Wait a bit for JS to execute
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'ig_debug.png' });
  console.log("Screenshot saved to ig_debug.png");
  
  await browser.close();
}

main().catch(console.error);
