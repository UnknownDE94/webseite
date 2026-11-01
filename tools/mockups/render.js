#!/usr/bin/env node
/* Rendert die Konzeptansichten (Beispieldaten) der WK-Apps nach assets/apps/.

   Aufruf:  node tools/mockups/render.js            → alle Vorlagen
            node tools/mockups/render.js material   → nur Dateien, die "material" enthalten

   Jede Vorlage tools/mockups/<app>-<ansicht>.html wird zu
   assets/apps/<app>-<ansicht>.webp:
     Desktop  800×500 CSS-px mit Faktor 2 → 1600×1000
     Mobil    (<app>-mobile.html) 390×844 mit Faktor 1 → 390×844
   Playwright liefert PNG; die WebP-Umwandlung übernimmt Python/Pillow
   (python3 mit PIL muss installiert sein). */

"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const SRC = __dirname;
const OUT = path.join(ROOT, "assets/apps");
const QUALITY = 84;

const filter = process.argv[2] || "";
const files = fs
  .readdirSync(SRC)
  .filter((f) => f.endsWith(".html") && f.includes(filter))
  .sort();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wk-mockups-"));
  const browser = await chromium.launch();
  const jobs = [];
  for (const file of files) {
    const mobile = file.endsWith("-mobile.html");
    const page = await browser.newPage({
      viewport: mobile ? { width: 390, height: 844 } : { width: 800, height: 500 },
      deviceScaleFactor: mobile ? 1 : 2,
    });
    await page.goto("file://" + path.join(SRC, file));
    await page.evaluate(() => document.fonts.ready);
    const png = path.join(tmp, file.replace(/\.html$/, ".png"));
    await page.screenshot({ path: png });
    await page.close();
    jobs.push([png, path.join(OUT, file.replace(/\.html$/, ".webp"))]);
  }
  await browser.close();
  const py =
    "import sys\nfrom PIL import Image\nq=int(sys.argv[1])\nargs=sys.argv[2:]\n" +
    "for i in range(0,len(args),2):\n" +
    "    Image.open(args[i]).convert('RGB').save(args[i+1],'WEBP',quality=q,method=6)\n";
  execFileSync("python3", ["-c", py, String(QUALITY)].concat(...jobs));
  jobs.forEach(([, webp]) => {
    console.log(path.relative(ROOT, webp) + "  " + Math.round(fs.statSync(webp).size / 1024) + " KB");
  });
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
