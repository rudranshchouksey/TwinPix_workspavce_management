import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });

  await page.goto("http://localhost:3950/login");
  await page.fill('input[name="email"]', "rudranshchouksey@gmail.com");
  await page.fill('input[name="password"]', "Admin@TwinPix2025!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);

  await page.goto("http://localhost:3950/campaigns", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "scratch-verify-tabs.png" });

  await browser.close();
  console.log("Done");
}

main().catch((e) => { console.error(e); process.exit(1); });
