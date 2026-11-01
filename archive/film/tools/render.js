/* Rendert die neuen Filmszenen (film.html) als Bildfolge.
   Aufruf (Playwright muss global installiert sein):
     NODE_PATH=$(npm root -g) node tools/film/render.js still <block> <t1,t2,...> <ausgabeordner>
     NODE_PATH=$(npm root -g) node tools/film/render.js video <block> <ausgabe.mp4> <ffmpeg>
   Blöcke: n1 = Stahlguss + Pharma + Werkstatt, n2 = Handschlag + Analyse. 30 Bilder pro Sekunde. */
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

(async () => {
  const [mode, block, arg3, arg4] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
  await page.goto("file://" + path.resolve(__dirname, "film.html"));
  await page.evaluate(() => document.fonts.ready);
  const total = await page.evaluate((b) => window.TOTAL[b], block);
  if (mode === "still") {
    fs.mkdirSync(arg4, { recursive: true });
    for (const t of arg3.split(",").map(Number)) {
      await page.evaluate(([b, tt]) => window.setFrame(b, tt), [block, t]);
      await page.screenshot({ path: path.join(arg4, `${block}_${t.toFixed(2)}.png`) });
    }
  } else {
    const ff = spawn(arg4, ["-y", "-v", "error", "-f", "image2pipe", "-framerate", "30", "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", arg3], { stdio: ["pipe", "inherit", "inherit"] });
    const frames = Math.round(total * 30);
    for (let i = 0; i < frames; i++) {
      await page.evaluate(([b, tt]) => window.setFrame(b, tt), [block, i / 30]);
      const buf = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    }
    ff.stdin.end();
    await new Promise((r) => ff.on("close", r));
  }
  await browser.close();
})();
