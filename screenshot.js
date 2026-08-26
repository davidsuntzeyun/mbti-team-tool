const { chromium } = require("playwright");
const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/?mode=signup`);
  await page.screenshot({ path: "/tmp/shot-signup.png" });

  await page.fill('input[name="username"]', "Carol");
  await page.fill('input[name="password"]', "hello123");
  await Promise.all([page.waitForURL("**/profile"), page.click('button:has-text("Create account")')]);

  await page.selectOption('select[name="mbtiType"]', "ENFJ");
  await Promise.all([page.waitForURL("**/profile"), page.click('button:has-text("Save my type")')]);
  await page.screenshot({ path: "/tmp/shot-profile.png", fullPage: true });

  await page.goto(`${BASE}/guess`);
  await page.screenshot({ path: "/tmp/shot-guess.png", fullPage: true });

  await page.goto(`${BASE}/match?with=Alice`);
  await page.screenshot({ path: "/tmp/shot-match.png", fullPage: true });

  await browser.close();
  console.log("Screenshots saved.");
})();
