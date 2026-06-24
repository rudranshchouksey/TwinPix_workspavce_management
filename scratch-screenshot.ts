import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { chromium } from "playwright";

const INFLUENCER_ID = process.argv[2];

function parseFirstAdmin(): { email: string; password: string } {
  const raw = process.env.SEED_ADMINS || "";
  const first = raw.split(",")[0];
  const [, email, password] = first.split(":");
  return { email: email.trim(), password: password.trim() };
}

async function main() {
  const { email, password } = parseFirstAdmin();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });

  await page.goto("http://localhost:3000/login");
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15000 });
  console.log("post-login url:", page.url());

  await page.goto(`http://localhost:3000/influencers/${INFLUENCER_ID}`);
  await page.waitForTimeout(2500);

  const scrollMain = (y: number) =>
    page.evaluate((py) => {
      const el = document.getElementById("main-content");
      if (el) el.scrollTop = py;
    }, y);

  await page.screenshot({ path: "scratch-shot-1-hero.png", fullPage: false });

  await scrollMain(700);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scratch-shot-2-kpi.png", fullPage: false });

  await scrollMain(1700);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scratch-shot-3-ai.png", fullPage: false });

  await scrollMain(2900);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scratch-shot-4-campaigns.png", fullPage: false });

  await scrollMain(4200);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scratch-shot-5-gallery.png", fullPage: false });

  await scrollMain(5800);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scratch-shot-6-analytics.png", fullPage: false });

  await scrollMain(7400);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scratch-shot-7-collab.png", fullPage: false });

  await scrollMain(99999);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "scratch-shot-8-bottom.png", fullPage: false });

  // Full-page capture: temporarily make the scroll container size to its content
  await page.evaluate(() => {
    const el = document.getElementById("main-content");
    if (el) {
      el.style.overflow = "visible";
      el.style.height = "auto";
    }
    document.documentElement.style.overflow = "visible";
    document.body.style.overflow = "visible";
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "scratch-shot-full.png", fullPage: true });

  // Also check the influencer list page for clickable name
  await page.goto("http://localhost:3000/influencers");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "scratch-shot-list.png", fullPage: false });

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
