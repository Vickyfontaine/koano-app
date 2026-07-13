// Headless-Chrome diagnosis/verification harness (dev tooling only).
// Requires: npm install --no-save puppeteer-core (uses system Chrome).
// Usage: node scripts/browser-check.js <url> [viewportWidth] [screenshotPath] [waitMs]
// Prints console errors, page errors, failed requests, and whether the
// neural-map loading text is still present after settling.

const puppeteer = require("puppeteer-core");

const [, , url, widthArg, shot, waitArg] = process.argv;
const width = Number(widthArg || 1440);
const waitMs = Number(waitArg || 8000);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("[console.error] " + msg.text());
  });
  page.on("pageerror", (err) => errors.push("[pageerror] " + err.message));
  page.on("requestfailed", (req) =>
    errors.push("[requestfailed] " + req.url().slice(0, 120) + " — " + req.failure()?.errorText),
  );

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, waitMs));

  const state = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return {
      stuckLoading: bodyText.includes("Loading neural map"),
      errorFallback: bodyText.includes("Neural map visualization"),
      hasCanvas: !!document.querySelector("canvas"),
      hasIframe: !!document.querySelector("iframe"),
    };
  });

  console.log("STATE:", JSON.stringify(state));
  console.log(errors.length ? "ERRORS:\n" + errors.slice(0, 12).join("\n") : "ERRORS: none");

  if (shot) {
    await page.screenshot({ path: shot, fullPage: false });
    console.log("screenshot:", shot);
  }
  await browser.close();
})();
