// Create/sign in a Clerk DEV-instance test user (an email with +clerk_test and
// the fixed OTP 424242; Clerk only honors these on development instances) and
// save the browser storage state for the screenshot harness.
//   node scripts/ui/clerk-test-login.mjs <state.json>
import { chromium } from "playwright";
const BASE = process.env.KOANO_BASE ?? "http://localhost:3000";
const EMAIL = process.env.KOANO_TEST_EMAIL ?? "ui.sprint+clerk_test@koano.co";
const PASSWORD = process.env.KOANO_TEST_PASSWORD ?? "Koano-ui-sprint-2026!";
const STATE = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const vis = (sel) => page.locator(`${sel}:visible`).first();
async function dump(tag) {
  console.log(`[${tag}] ${page.url()}`);
  console.log("   " + (await page.innerText("body")).replace(/\s+/g, " ").slice(0, 400));
}
async function otp() {
  const code = vis('input[name="code"], input[autocomplete="one-time-code"]');
  if (await code.count()) {
    await code.fill("424242");
    await page.waitForTimeout(4000);
    return true;
  }
  return false;
}
await page.goto(BASE + "/login", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);
await dump("login");
const id = vis('input[name="identifier"]');
if (await id.count()) {
  await id.fill(EMAIL);
  await vis('.cl-formButtonPrimary').click();
  await page.waitForTimeout(3000);
  await dump("after-identifier");
  const pw = vis('input[name="password"]');
  if (await pw.count()) {
    await pw.fill(PASSWORD);
    await vis('.cl-formButtonPrimary').click();
    await page.waitForTimeout(4000);
  }
  await otp();
  await dump("after-signin");
}
if (!/\/(dashboard|onboarding)/.test(page.url())) {
  await page.goto(BASE + "/signup", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  await dump("signup");
  await vis('input[name="emailAddress"]').fill(EMAIL);
  const pw = vis('input[name="password"]');
  if (await pw.count()) await pw.fill(PASSWORD);
  await vis('.cl-formButtonPrimary').click();
  await page.waitForTimeout(4000);
  await dump("after-signup-submit");
  await otp();
  await dump("after-code");
}
if (page.url().includes("/onboarding")) {
  await vis('button:has-text("Development intelligence")').click();
  await page.waitForTimeout(5000);
  await dump("after-onboarding");
}
await page.goto(BASE + "/dashboard", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);
await dump("dashboard");
await ctx.storageState({ path: STATE });
console.log("saved", STATE);
await browser.close();
