/* Rendert das Vorschaubild für Social Media (assets/og-image.jpg, 1200 × 630)
   aus og.html – mit der echten Partikelwelle der Website.
   Aufruf (Playwright muss installiert sein):
     node tools/og/render.js            → schreibt assets/og-image.jpg */
const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
  await page.goto("file://" + path.resolve(__dirname, "og.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  const out = path.resolve(__dirname, "../../assets/og-image.jpg");
  await page.screenshot({ path: out, type: "jpeg", quality: 88 });
  console.log("geschrieben:", out);
  await browser.close();
})();
