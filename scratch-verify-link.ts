import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { chromium } from "playwright";

function parseFirstAdmin() {
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
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 15000 });

  await page.goto("http://localhost:3000/influencers");
  await page.waitForTimeout(1500);

  const nameLink = page.getByRole("link", { name: "[TEST] Maya Creator" });
  await nameLink.hover();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "scratch-shot-hover.png", clip: { x: 150, y: 130, width: 500, height: 80 } });

  await nameLink.click();
  await page.waitForURL(/\/influencers\/[a-z0-9]+$/, { timeout: 10000 });
  console.log("navigated to:", page.url());

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
