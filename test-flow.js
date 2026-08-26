const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

async function signupAndSetType(browser, username, password, mbtiType) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?mode=signup`);
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForURL("**/profile"), page.click('button:has-text("Create account")')]);
  await page.selectOption('select[name="mbtiType"]', mbtiType);
  await Promise.all([page.waitForURL("**/profile"), page.click('button:has-text("Save my type")')]);
  const text = await page.textContent("body");
  console.log(`[${username}] profile loaded, contains type label:`, text.includes(mbtiType));
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });

  const alice = await signupAndSetType(browser, "Alice", "hello123", "INTJ");
  const bob = await signupAndSetType(browser, "Bob", "hello123", "ENFP");

  // Alice guesses Bob
  await alice.page.goto(`${BASE}/guess`);
  await alice.page.selectOption('select[name="guessedUsername"]', "Bob");
  await alice.page.selectOption('select[name="guessedType"]', "ENFP");
  await alice.page.fill('textarea[name="reasoning"]', "Bob is always full of energy in meetings.");
  await Promise.all([alice.page.waitForURL("**/guess"), alice.page.click('button:has-text("Save guess")')]);
  const guessText = await alice.page.textContent("body");
  console.log("Alice's guess saved, shows Bob + ENFP:", guessText.includes("Bob") && guessText.includes("ENFP"));

  // Alice edits the guess
  await alice.page.goto(`${BASE}/guess?edit=Bob`);
  await alice.page.selectOption('select[name="guessedType"]', "ENTP");
  await Promise.all([alice.page.waitForURL("**/guess"), alice.page.click('button:has-text("Update guess")')]);
  const editedText = await alice.page.textContent("body");
  console.log("Alice's guess updated to ENTP:", editedText.includes("ENTP"));

  // Alice runs Quick Match with Bob
  await alice.page.goto(`${BASE}/match?with=Bob`);
  const matchText = await alice.page.textContent("body");
  console.log("Quick Match rendered strengths section:", matchText.includes("Strengths working together"));
  console.log("Quick Match shows both types:", matchText.includes("INTJ") && matchText.includes("ENFP"));

  // Admin roster page + self delete for Bob
  await bob.page.goto(`${BASE}/admin`);
  const rosterText = await bob.page.textContent("body");
  console.log("Roster shows both users:", rosterText.includes("Alice") && rosterText.includes("Bob"));

  // Logout Alice
  await alice.page.goto(`${BASE}/profile`);
  await Promise.all([alice.page.waitForURL(BASE + "/"), alice.page.click('button:has-text("Log out")')]);
  const loggedOutText = await alice.page.textContent("body");
  console.log("Logged out, shows login form:", loggedOutText.includes("Log in"));

  await browser.close();
  console.log("\nAll checks complete.");
})().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
