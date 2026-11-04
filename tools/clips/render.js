#!/usr/bin/env node
/* Rendert kurze, stumme App-Clips (Endlosschleife) aus den Konzeptansichten.

   Aufruf:  node tools/clips/render.js            → alle Clips
            node tools/clips/render.js material   → nur ein Clip

   Ablauf je Clip: Ansicht → sanfter Zoom auf den Schwerpunkt mit Lime-Rahmen →
   Mauszeiger klickt in der Seitenleiste auf den nächsten Bereich → Überblendung.
   Klickziele (aktiver Menüpunkt) und Schwerpunkte werden direkt aus den
   Vorlagen in tools/mockups/*.html gemessen. Bilder: assets/apps/*.webp.
   Ausgabe: assets/clips/<app>.mp4 (H.264) + <app>-poster.webp.
   Voraussetzungen: Playwright, ffmpeg, Python 3 mit Pillow. */

"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "assets/clips");
const W = 1280, H = 800, CSS_W = 920, K = W / CSS_W; // Vorlagen: 920×575 CSS-px
const FPS = 25, D = 3.6, FADE = 0.35;

// Szenen je App: Vorlage + Schwerpunkt (Selektor in der Vorlage, optional Bruchteil [x, y, b, h])
const CLIPS = {
  smartparts: [
    { m: "smartparts-dashboard-kennzahlen", f: ".shot", frac: [0, 0.04, 1, 0.3] },
    { m: "smartparts-bestandsrisiko-ampel", f: ".shot", frac: [0, 0.18, 1, 0.42] },
    { m: "smartparts-datenqualitaet", f: ".shot", frac: [0, 0.04, 1, 0.34] },
  ],
  material: [
    { m: "material-fahrzeuge", f: ".veh" },
    { m: "material-inventur", f: "table" },
    { m: "material-bestandswert", f: ".kpis" },
  ],
  instandhaltung: [
    { m: "instandhaltung-stoerungen", f: "table" },
    { m: "instandhaltung-historie", f: ".tl" },
    { m: "instandhaltung-jahre", f: ".kpis" },
  ],
  finance: [
    { m: "finance-jahre", f: ".kpis" },
    { m: "finance-archiv", f: ".grid .card:last-child" },
    { m: "finance-vertraege", f: "table" },
  ],
  "3d": [
    { m: "3d-bibliothek", f: ".tiles", frac: [0, 0, 1, 0.5] },
    { m: "3d-bauteil", f: ".card" },
    { m: "3d-versionen", f: ".card" },
  ],
};

async function measure(browser, scenes) {
  const page = await browser.newPage({ viewport: { width: CSS_W, height: 575 } });
  for (const s of scenes) {
    await page.goto("file://" + path.join(ROOT, "tools/mockups", s.m + ".html"));
    await page.waitForTimeout(150);
    const r = await page.evaluate((sc) => {
      const box = (el) => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
      const on = document.querySelector(".side .nav-item.on");
      const el = document.querySelector(sc.f) || document.querySelector(".page");
      let f = box(el);
      if (sc.frac) f = [f[0] + f[2] * sc.frac[0], f[1] + f[3] * sc.frac[1], f[2] * sc.frac[2], f[3] * sc.frac[3]];
      return { nav: on ? box(on) : [20, 80, 140, 28], focus: f };
    }, s);
    s.nav = r.nav.map((v) => v * K);
    s.focus = r.focus.map((v) => v * K);
  }
  await page.close();
}

function clipHtml(scenes) {
  const imgs = scenes.map((s, i) => '<img id="i' + i + '" src="file://' + path.join(ROOT, "assets/apps", s.m + ".webp") + '">').join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#f1f3f2}
    .st{position:absolute;inset:0;overflow:hidden}
    .st img{position:absolute;inset:0;width:${W}px;height:${H}px;opacity:0;transform-origin:0 0}
    #hl{position:absolute;z-index:5;border:2.5px solid #9cc22a;border-radius:10px;box-shadow:0 0 0 4px rgba(212,236,95,.35),0 0 30px rgba(156,194,42,.45);opacity:0}
    #cur{position:absolute;z-index:10;width:26px;height:26px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
    #rip{position:absolute;z-index:9;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;background:rgba(26,94,58,.35);opacity:0}
  </style></head><body><div class="st">${imgs}<div id="hl"></div></div><div id="rip"></div>
  <svg id="cur" viewBox="0 0 24 24"><path d="M4 2.5v17l4.6-4.4 3 6.6 2.8-1.3-3-6.4h6.4z" fill="#fff" stroke="#1c2420" stroke-width="1.4" stroke-linejoin="round"/></svg>
  <script>
    const S=${JSON.stringify(scenes.map((s) => ({ nav: s.nav, focus: s.focus })))}, D=${D}, F=${FADE}, N=S.length;
    const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, cl=(v,a,b)=>Math.max(a,Math.min(b,v)), seg=(u,a,b)=>cl((u-a)/(b-a),0,1);
    const restOf=i=>{const n=S[i].nav;return [n[0]+n[2]*0.45,n[1]+n[3]*0.55]};
    window.render=function(t){
      const c=Math.floor(t/D)%N, u=t-Math.floor(t/D)*D, p=(c-1+N)%N, nx=(c+1)%N;
      // Zoom auf den Schwerpunkt (hin und zurück)
      const z=1+0.1*ease(seg(u,0.5,1.9))-0.1*ease(seg(u,2.1,2.7));
      S.forEach((s,i)=>{const el=document.getElementById('i'+i);let o=0;
        if(i===c)o=u<F?ease(u/F):1; else if(i===p&&u<F)o=1;
        const f=S[i].focus, cx=f[0]+f[2]/2, cy=f[1]+f[3]/2, zz=i===c?z:1;
        el.style.opacity=o; el.style.zIndex=i===c?2:1;
        el.style.transform='translate('+(cx-cx*zz)+'px,'+(cy-cy*zz)+'px) scale('+zz+')';});
      const f=S[c].focus, cx=f[0]+f[2]/2, cy=f[1]+f[3]/2, hl=document.getElementById('hl');
      const ho=seg(u,0.9,1.3)-seg(u,1.95,2.3);
      hl.style.opacity=ho; hl.style.left=(cx-(cx-f[0]+6)*z)+'px'; hl.style.top=(cy-(cy-f[1]+6)*z)+'px';
      hl.style.width=((f[2]+12)*z)+'px'; hl.style.height=((f[3]+12)*z)+'px';
      // Mauszeiger: ruht auf dem eben geklickten Menüpunkt, fährt dann zum nächsten
      const a=restOf(c), b=restOf(nx), m=ease(seg(u,2.5,3.25));
      const x=a[0]+(b[0]-a[0])*m, y=a[1]+(b[1]-a[1])*m - Math.sin(Math.PI*m)*40;
      const cur=document.getElementById('cur'); cur.style.left=x+'px'; cur.style.top=y+'px';
      const r=seg(u,3.25,3.6), rip=document.getElementById('rip');
      rip.style.left=b[0]+'px'; rip.style.top=b[1]+'px'; rip.style.opacity=r>0?(1-r):0; rip.style.transform='scale('+(0.4+r*1.4)+')';
      cur.style.transform='scale('+(u>3.22&&u<3.4?0.86:1)+')';
    };
  </script></body></html>`;
}

(async () => {
  const only = process.argv[2];
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [name, scenes] of Object.entries(CLIPS)) {
    if (only && name !== only) continue;
    await measure(browser, scenes);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wk-clip-"));
    const htmlFile = path.join(tmp, "clip.html");
    fs.writeFileSync(htmlFile, clipHtml(scenes));
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.goto("file://" + htmlFile);
    await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete));
    const T = scenes.length * D, frames = Math.round(T * FPS);
    for (let k = 0; k < frames; k++) {
      // Start nach der Überblendung: erstes Bild = Szene 1 vollständig, Schleife nahtlos
      await page.evaluate((t) => window.render(t), FADE + k / FPS);
      await page.screenshot({ path: path.join(tmp, "f" + String(k).padStart(4, "0") + ".jpg"), type: "jpeg", quality: 92 });
    }
    await page.close();
    const mp4 = path.join(OUT, name + ".mp4");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(tmp, "f%04d.jpg"),
      "-c:v", "libx264", "-preset", "slow", "-crf", "29", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4]);
    execFileSync("python3", ["-c", "import sys;from PIL import Image;Image.open(sys.argv[1]).save(sys.argv[2],'WEBP',quality=82)",
      path.join(tmp, "f0000.jpg"), path.join(OUT, name + "-poster.webp")]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(path.relative(ROOT, mp4) + "  " + Math.round(fs.statSync(mp4).size / 1024) + " KB · " + T.toFixed(1) + " s");
  }
  await browser.close();
})();
