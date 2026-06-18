import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "playwright";

// Setup stealth plugin
chromium.use(StealthPlugin());

export interface BrowserSession {
  browser: Browser;
  page: Page;
  close: () => Promise<void>;
}

/**
 * Initializes a new Playwright Chromium browser instance with stealth evasion techniques.
 */
export async function createBrowserSession(): Promise<BrowserSession> {
  const browser = await chromium.launch({
    headless: true, // Run in background
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    // We can inject session cookies here if provided in process.env
  });

  // Inject session cookie if available
  if (process.env.INSTAGRAM_SESSION_ID) {
    await context.addCookies([
      {
        name: "sessionid",
        value: process.env.INSTAGRAM_SESSION_ID,
        domain: ".instagram.com",
        path: "/",
      },
    ]);
  }

  const page = await context.newPage();

  return {
    browser,
    page,
    close: async () => {
      await browser.close();
    },
  };
}
