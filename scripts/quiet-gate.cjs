// Quiet chrome pass: fresh profile (no pin) - chrome greets, retires to the
// hint tab, wakes on hint, pins persist; hint never covers text at 320/390.
const pptr = require("puppeteer-core");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
(async () => {
  let server, browser;
  try {
    const url = "http://127.0.0.1:8795";
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "8795"], { stdio: "ignore" });
    for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }
    browser = await pptr.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--enable-unsafe-swiftshader"] });
    for (const motion of ["reduce", "no-preference"]) {
      const ctx = await browser.createBrowserContext();
      const p = await ctx.newPage();
      await p.setViewport({ width: 390, height: 844 });
      await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: motion }]);
      await p.goto(url, { waitUntil: "domcontentloaded" });
      await p.waitForSelector(".toolbar", { timeout: 30000 });
      assert(await p.$eval(".toolbar", (e) => getComputedStyle(e).visibility) === "visible", "chrome greets visible");
      await new Promise((r) => setTimeout(r, 3400));
      assert(await p.$eval(".toolbar", (e) => getComputedStyle(e).opacity) === "0", "chrome retires");
      assert(await p.$eval(".chrome-hint", (e) => !e.hidden), "hint shows");
      if (motion === "reduce") assert(await p.$eval(".toolbar", (e) => getComputedStyle(e).transitionDuration) === "0s", "reduced motion kills transitions");
      await p.$eval(".chrome-hint", (e) => e.dispatchEvent(new MouseEvent("click", { bubbles: true })));
      await new Promise((r) => setTimeout(r, 300));
      assert(await p.$eval(".toolbar", (e) => getComputedStyle(e).opacity) === "1", "hint wakes chrome");
      await p.$eval("#pin-controls", (e) => e.click());
      await p.reload({ waitUntil: "domcontentloaded" });
      await p.waitForSelector(".toolbar", { timeout: 30000 });
      await new Promise((r) => setTimeout(r, 3400));
      assert(await p.$eval(".toolbar", (e) => getComputedStyle(e).opacity) === "1", "pin persists");
      await ctx.close();
    }
    // Overlap gate: hint rect must not intersect any visible text/link rect at 320 and 390
    for (const w of [320, 390]) {
      const ctx = await browser.createBrowserContext();
      const p = await ctx.newPage();
      await p.setViewport({ width: w, height: 844 });
      await p.goto(url, { waitUntil: "domcontentloaded" });
      await p.waitForSelector(".toolbar", { timeout: 30000 });
      await new Promise((r) => setTimeout(r, 3600));
      const hits = await p.evaluate(() => {
        const h = document.querySelector(".chrome-hint").getBoundingClientRect();
        const bad = [];
        const inter = (r) => !(r.right < h.left || r.left > h.right || r.bottom < h.top || r.top > h.bottom);
        for (const el of document.querySelectorAll("a,p,h1,h2,h3,span,button")) {
          if (el.classList.contains("chrome-hint")) continue; const cr = el.closest(".chrome"); if (cr && !cr.classList.contains("chrome-on")) continue;
          const r = el.getBoundingClientRect();
          if (r.width && r.height && inter(r) && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).opacity !== "0") bad.push(el.tagName + "." + el.className);
        }
        return bad;
      });
      assert.deepEqual(hits, [], "hint overlap at " + w + ": " + hits.join(","));
      await ctx.close();
    }
    console.log("quiet chrome pass OK");
  } finally { await browser?.close(); server?.kill(); }
})().catch((e) => { console.error(e); process.exit(1); });
