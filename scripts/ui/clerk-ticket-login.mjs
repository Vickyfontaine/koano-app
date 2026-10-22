// Sign in with a Clerk sign-in token (minted via the Backend API on a DEV
// instance) and save the storage state for the screenshot harness.
//   node scripts/ui/clerk-ticket-login.mjs <ticket> <state.json> [cluster label]
import { chromium } from "playwright";
const BASE = process.env.KOANO_BASE ?? "http://localhost:3000";
const [ticket, STATE, clusterLabel = "Development intelligence"] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
async function dump(tag) {
  console.log(`[${tag}] ${page.url()}`);
  console.log("   " + (await page.innerText("body")).replace(/\s+/g, " ").slice(0, 300));
}
await page.goto(`${BASE}/login?__clerk_ticket=${encodeURIComponent(ticket)}`, { waitUntil: "load", timeout: 60000 });
for (let i = 0; i < 20 && !/\/(dashboard|onboarding)/.test(page.url()); i++) await page.waitForTimeout(1000);
await dump("after-ticket");
if (page.url().includes("/onboarding")) {
  await page.locator(`button:has-text("${clusterLabel}")`).first().click();
  for (let i = 0; i < 20 && !page.url().includes("/dashboard"); i++) await page.waitForTimeout(1000);
  await dump("after-onboarding");
}
await page.goto(BASE + "/dashboard", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);
await dump("dashboard");
await ctx.storageState({ path: STATE });
console.log("saved", STATE);
await browser.close();
