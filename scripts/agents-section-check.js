// Geometry verification for the homepage agents section (dev tooling only).
// Requires: npm install --no-save puppeteer-core (uses system Chrome).
// Usage: node scripts/agents-section-check.js <baseUrl> <viewportWidth> <screenshotPath>
// Checks: (a) connector line terminates at the synthesis dot center,
// (b) each outlined dot is vertically centered on its card,
// (c) output chips stay inside their cards. Exits 1 on any failure.

const puppeteer = require("puppeteer-core");

const [, , base, widthArg, shot] = process.argv;
const width = Number(widthArg || 1440);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(base + "/", { waitUntil: "networkidle2", timeout: 60000 });

  // Scroll the section into view and let the framer entrance finish.
  await page.evaluate(() => {
    document.getElementById("agents-section")?.scrollIntoView({ block: "start" });
  });
  await new Promise((r) => setTimeout(r, 2500));

  const report = await page.evaluate(() => {
    const section = document.getElementById("agents-section");
    const cards = Array.from(section.querySelectorAll(".card"));
    const failures = [];

    // (b) + (c): per-card dot centering and chip containment
    cards.forEach((card, i) => {
      const row = card.parentElement; // the motion row
      const dot = row.querySelector(":scope > div"); // first abs child = dot
      const cardRect = card.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const dotCenterY = dotRect.top + dotRect.height / 2;
      if (Math.abs(cardCenterY - dotCenterY) > 1.5) {
        failures.push(
          `card ${i + 1}: dot centerY ${dotCenterY.toFixed(1)} vs card centerY ${cardCenterY.toFixed(1)}`,
        );
      }
      const chip = card.querySelector(".data-chip");
      const chipRect = chip.getBoundingClientRect();
      if (
        chipRect.right > cardRect.right + 0.5 ||
        chipRect.left < cardRect.left - 0.5 ||
        chipRect.bottom > cardRect.bottom + 0.5
      ) {
        failures.push(
          `card ${i + 1}: chip overflows (chip R ${chipRect.right.toFixed(1)} vs card R ${cardRect.right.toFixed(1)}, chip B ${chipRect.bottom.toFixed(1)} vs card B ${cardRect.bottom.toFixed(1)})`,
        );
      }
    });

    // (a): line must end at the synthesis dot center, not past it.
    // The line is the absolutely-positioned 1px-wide div inside the cards wrapper.
    const wrapper = cards[0].parentElement.parentElement; // cards wrapper
    const line = wrapper.querySelector(":scope > div:first-child");
    const lineRect = line.getBoundingClientRect();
    // synthesis dot: the 14px filled dot after the wrapper
    const synthDot = wrapper.nextElementSibling.querySelector(":scope > div");
    const synthRect = synthDot.getBoundingClientRect();
    const synthCenterY = synthRect.top + synthRect.height / 2;
    if (lineRect.bottom > synthCenterY + 1.5) {
      failures.push(
        `line bottom ${lineRect.bottom.toFixed(1)} runs past synthesis dot center ${synthCenterY.toFixed(1)}`,
      );
    }
    if (lineRect.bottom < synthRect.top - 1.5) {
      failures.push(
        `line bottom ${lineRect.bottom.toFixed(1)} stops short of synthesis dot top ${synthRect.top.toFixed(1)}`,
      );
    }

    // horizontal overflow check for the whole page at this width
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (overflow > 1) failures.push(`page horizontal overflow: ${overflow}px`);

    return { cards: cards.length, failures };
  });

  console.log(`width ${width}: ${report.cards} cards checked`);
  if (report.failures.length) {
    console.log("FAILURES:\n" + report.failures.join("\n"));
  } else {
    console.log("ALL GEOMETRY CHECKS PASS");
  }

  if (shot) {
    const el = await page.$("#agents-section");
    await el.screenshot({ path: shot });
    console.log("screenshot:", shot);
  }
  await browser.close();
  process.exit(report.failures.length ? 1 : 0);
})();
