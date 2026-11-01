#!/usr/bin/env node
/* Rendert die Konzeptansichten (Beispieldaten) der WK-Apps nach assets/apps/.

   Aufruf:  node tools/mockups/render.js            → alle Vorlagen
            node tools/mockups/render.js material   → nur Dateien, die "material" enthalten

   Jede Vorlage tools/mockups/<app>-<ansicht>.html wird zu
   assets/apps/<app>-<ansicht>.webp:
     Desktop  920×575 CSS-px mit Faktor 1600/920 → 1600×1000
     Mobil    (<app>-mobile.html) 390×844 mit Faktor 1 → 390×844
   Die App-Hülle (Navigation, obere Leiste) baut shell.js.
   Vorlagen mit <div class="shot" data-shot="assets/platform/x.webp"> (WK SmartParts):
   An dieser Stelle wird der echte Screenshot unverändert, nur verkleinert
   (Lanczos), in die gerenderte Hülle eingesetzt.
   Playwright liefert PNG; Zusammensetzen und WebP-Umwandlung übernimmt
   Python/Pillow (python3 mit PIL muss installiert sein). */

"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const SRC = __dirname;
const OUT = path.join(ROOT, "assets/apps");
const QUALITY = 82;
const W = 920;
const H = 575;

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
      viewport: mobile ? { width: 390, height: 844 } : { width: W, height: H },
      deviceScaleFactor: mobile ? 1 : 1600 / W,
    });
    await page.goto("file://" + path.join(SRC, file));
    await page.evaluate(() => document.fonts.ready);
    const info = await page.evaluate(() => {
      const main = document.querySelector(".page, .m-body");
      const shot = document.querySelector("[data-shot]");
      const r = shot && shot.getBoundingClientRect();
      const keep = document.querySelector(".title-row");
      const k = keep ? keep.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
      return {
        overflow: !shot && main ? main.scrollHeight > main.clientHeight + 1 || main.scrollWidth > main.clientWidth + 1 : false,
        shot: shot ? [shot.getAttribute("data-shot"), r.left, r.top, r.width, r.height, k.left, k.top, k.width, k.height] : null,
      };
    });
    if (info.overflow) console.warn("Achtung: Inhalt läuft über – " + file);
    const png = path.join(tmp, file.replace(/\.html$/, ".png"));
    await page.screenshot({ path: png });
    await page.close();
    const scale = mobile ? 1 : 1600 / W;
    const shot = info.shot
      ? [path.join(ROOT, info.shot[0])].concat(info.shot.slice(1).map((v) => String(Math.round(v * scale))))
      : ["-", "0", "0", "0", "0", "0", "0", "0", "0"];
    jobs.push([png, path.join(OUT, file.replace(/\.html$/, ".webp"))].concat(shot));
  }
  await browser.close();
  /* Python: PNG → WebP; bei Vorlagen mit Screenshot diesen verkleinert einsetzen.
     Überlappt der (leere) Rand des Screenshots die Titelzeile, bleibt die Titelzeile
     sichtbar – vorausgesetzt, der überdeckte Rand ist einfarbig (sonst Warnung). */
  const py = [
    "import sys",
    "from PIL import Image",
    "q=int(sys.argv[1]); a=sys.argv[2:]",
    "for i in range(0,len(a),11):",
    "    png,webp,shot=a[i:i+3]; x,y,w,h,kx,ky,kw,kh=map(int,a[i+3:i+11])",
    "    im=Image.open(png).convert('RGB')",
    "    if im.size[0]>1000 and im.size!=(1600,1000): im=im.resize((1600,1000),Image.LANCZOS)",
    "    if shot!='-':",
    "        h=round(w*10/16); orig=im.copy()",
    "        sc=Image.open(shot).convert('RGB').resize((w,h),Image.LANCZOS)",
    "        im.paste(sc,(x,y))",
    "        if kw and ky+kh>y:",
    "            band=sc.crop((max(kx-x,0),0,min(kx+kw-x,w),ky+kh-y)).getextrema()",
    "            if max(e[1]-e[0] for e in band)>8: print('Achtung: Screenshot-Inhalt unter der Titelzeile – '+webp)",
    "            im.paste(orig.crop((kx,ky,kx+kw,ky+kh)),(kx,ky))",
    "        print('%s: Screenshot bei x=%d y=%d w=%d h=%d (Faktor %.4f)' % (webp.split('/')[-1],x,y,w,h,w/1600))",
    "    im.save(webp,'WEBP',quality=q,method=6)",
  ].join("\n");
  process.stdout.write(execFileSync("python3", ["-c", py, String(QUALITY)].concat(...jobs)));
  jobs.forEach(([, webp]) => {
    console.log(path.relative(ROOT, webp) + "  " + Math.round(fs.statSync(webp).size / 1024) + " KB");
  });
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
