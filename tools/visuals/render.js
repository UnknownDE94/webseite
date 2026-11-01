/* Erzeugt die visuellen Empfehlungen als JPEG (docs/empfehlungen/).
   Aufruf: node tools/visuals/render.js [wellen|motive|seiten|apps|kacheln|alle]
   (seiten/apps brauchen einen lokalen Server: python3 -m http.server 8765)
   Rendert jede Wellenform/jedes Motiv mit der echten wave.js und setzt sie
   mit Beschriftung zu einer Übersichtstafel zusammen. */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "docs/empfehlungen");
const TMP = path.join(require("os").tmpdir(), "wk-visuals");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const WELLEN = [
  ["hero", "Hero", "Startseite und Seitenköpfe. Hoch, rechts versetzt, hält die Textspalte frei.", "Im Einsatz"],
  ["calm", "Calm", "Textabschnitte. Flach und dezent am unteren Rand.", "Im Einsatz"],
  ["flow", "Flow", "Prozesse und Abläufe. Etwas dichter und bewegter.", "Im Einsatz"],
  ["grid", "Grid", "Daten- und Produktabschnitte. Ruhig, gleichmäßig.", "Im Einsatz"],
  ["surge", "Surge", "Abschluss und Handlungsaufforderung. Kräftiger Wellenberg.", "Im Einsatz"],
  ["flat", "Flat", "Footer und Rechtstexte. Fast still.", "Im Einsatz"],
];
const MOTIVE = [
  ["bearing", "Kugellager", "Material & Ersatzteile – das klassische Ersatzteil"],
  ["gears", "Zahnradpaar", "Instandhaltung, Über uns – Mechanik, die ineinandergreift"],
  ["nameplate", "Typenschild", "Teileaufnahme, KI-Werkstatt (Typenschild-/OCR-Erkennung)"],
  ["shelf", "Lagerregal", "WK Material, Lageraudit – ein Fach ist markiert"],
  ["motor", "Elektromotor", "Obsoleszenz – abgekündigte Antriebe und Komponenten"],
  ["server", "Server vor Ort", "Lokale KI, On-Premises, Sicherheit & Betriebsmodelle"],
  ["scan3d", "3D-Scan", "Bauteil mit Laserlinie und Messpunkten – intern gescannt"],
  ["printer", "3D-Druck", "Schichtaufbau im eigenen Drucker – intern gefertigt"],
  ["explode", "Explosionszeichnung", "WK 3D – Baugruppe in Einzelteilen"],
  ["document", "Datenblatt", "Handwerk, Document AI – Zeichnung mit Bemaßung"],
  ["maintenance", "Wartungsplan", "WK Instandhaltung – Termine und Aufträge"],
  ["invoice", "Beleg", "WK Finance, Handwerk – Rechnungen und Belege"],
  ["plant", "Fertigungsanlage", "Industrie – Maschine, Förderband, Werkstücke"],
  ["toolbox", "Werkzeugkoffer", "Handwerk – Werkzeuge statt IT-Jargon"],
  ["exchange", "Alternativteil", "Original gegen geprüfte Alternative tauschen"],
];

async function shots(browser, list, withShape) {
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
  const files = [];
  for (const [key] of list) {
    const q = withShape ? "state=calm&shape=" + key : "state=" + key;
    await page.goto("file://" + path.join(__dirname, "wave-preview.html") + "?" + q);
    await page.waitForTimeout(withShape ? 3800 : 3600);
    const f = path.join(TMP, (withShape ? "m-" : "w-") + key + ".png");
    await page.screenshot({ path: f });
    files.push(f);
  }
  await page.close();
  return files;
}

function board(title, intro, items, files, cols, fit) {
  const cards = items
    .map((it, i) => `<figure><img src="file://${files[i]}" alt=""><figcaption><b>${it[1]}</b>${it[3] ? `<em class="${it[3] === "Neu" ? "new" : ""}">${it[3]}</em>` : ""}<span>${it[2]}</span></figcaption></figure>`)
    .join("");
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="file://${ROOT}/css/style.css"><style>
    body{margin:0;padding:56px 64px 64px;background:#070b09;color:#f2f5f3;width:${cols * 460 + 128}px}
    body::before{display:none}
    h1{font-size:44px;margin:0 0 10px} p.i{color:#b4bdb8;max-width:900px;margin:0 0 36px;font-size:17px}
    .g{display:grid;grid-template-columns:repeat(${cols},440px);gap:20px}
    figure{margin:0;border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;background:#0c1310}
    img{width:440px;height:274px;object-fit:${fit || "cover"};display:block;background:#070b09}
    figcaption{padding:14px 16px 18px;margin:0;color:#b4bdb8;font-size:14px;line-height:1.45}
    figcaption b{color:#f2f5f3;font-size:16px;margin-right:8px} figcaption span{display:block;margin-top:4px}
    em{font-style:normal;font:500 11px "JetBrains Mono";letter-spacing:.08em;text-transform:uppercase;border:1px solid rgba(255,255,255,.2);border-radius:99px;padding:2px 8px;color:#b4bdb8}
    em.new{color:#0b130e;background:#d4ec5f;border-color:#d4ec5f}
    .eyebrow{display:block}
    ${fit ? ".g{grid-template-columns:repeat(" + cols + ",760px)} img{width:760px !important;height:300px !important} body{width:" + (cols * 780 + 128) + "px}" : ""}
  </style></head><body><span class="eyebrow">Werringloer · Visuelle Empfehlung</span><h1>${title}</h1><p class="i">${intro}</p><div class="g">${cards}</div></body></html>`;
}

async function renderBoard(browser, html, out) {
  const f = path.join(TMP, "board.html");
  fs.writeFileSync(f, html);
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  await page.goto("file://" + f);
  await page.waitForTimeout(600);
  await page.screenshot({ path: out, type: "jpeg", quality: 86, fullPage: true });
  await page.close();
  console.log("geschrieben:", path.relative(ROOT, out));
}

(async () => {
  const what = process.argv[2] || "alle";
  const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--allow-file-access-from-files"] });
  if (what === "wellen" || what === "alle") {
    const files = await shots(browser, WELLEN, false);
    await renderBoard(browser, board("Wellen-Varianten",
      "Eine Welle, sechs Stimmungen: Die Partikelwelle bleibt immer dieselbe Fläche und ändert je Abschnitt nur Höhe, Tempo und Helligkeit. Sonderformen wie Kugel, Wirbel oder Tunnel sind entfernt. Über den Schalter im Header lässt sich die Welle samt Motiven ganz ausblenden.",
      WELLEN, files, 3), path.join(OUT, "01-wellen-varianten.jpg"));
  }
  if (what === "motive" || what === "alle") {
    const files = await shots(browser, MOTIVE, true);
    await renderBoard(browser, board("Partikel-Motive",
      "Fachlich konkrete Motive statt allgemeiner Symbole: Ein Teil der Punkte löst sich aus der Welle und formt Bauteile, Werkzeuge und Arbeitsmittel aus Instandhaltung, Lager, 3D-Technik und Verwaltung. Silberne und limettengrüne Anteile trennen Bauteil und Hervorhebung.",
      MOTIVE.map((m) => [m[0], m[1], m[2], "Neu"]), files, 3), path.join(OUT, "02-partikel-motive.jpg"));
  }
  if (what === "seiten" || what === "alle") {
    // Erwartet einen lokalen Server: python3 -m http.server 8765 (im Repo)
    const SEITEN = [
      ["index", "Startseite", "Vorlage 1 – Claim, Logo aus Partikeln, vier Leitbegriffe"],
      ["leistungen", "Leistungen", "Vorlage 4 – fünf Leistungswelten, Problem → Einstieg"],
      ["analyse-bis-umsetzung", "So arbeiten wir", "Vorlage 5 – Prozessweg in sechs Schritten"],
      ["smartparts", "WK SmartParts", "Vorlage 6 – Produktbühne mit echten Screens"],
      ["3d-technik", "3D-Technik", "Vorlage 7 – Original, Scan, CAD, Fertigung"],
      ["ueber-uns", "Über uns", "Vorlage 8 – Erfahrung und Region"],
      ["material-ersatzteile", "Material & Ersatzteile", "Vorlage 9 – Kennzahlen und Rechenbeispiel"],
      ["kontakt", "Kontakt", "Vorlage 10 – Formular, nächste Schritte"],
      ["mobile-offline", "Mobile & Offline", "Plattformen, Offline-Situationen, Status"],
    ];
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const files = [];
    for (const [name] of SEITEN) {
      await page.goto("http://localhost:8765/" + name + ".html", { waitUntil: "networkidle" });
      await page.evaluate(() => { try { localStorage.setItem("theme", "dark"); } catch (e) {} });
      await page.waitForTimeout(3200);
      const f = path.join(TMP, "s-" + name + ".png");
      await page.screenshot({ path: f });
      files.push(f);
    }
    await page.close();
    await renderBoard(browser, board("Layout-Übersicht",
      "Alle Seiten folgen einem Muster aus den Vorlagen 1 und 4–10: dunkler, ruhiger Grund, Limette als einziger Akzent, Linien-Icons, Partikelwelle mit wechselnder Raumform. Ausschnitte im Desktop-Format (1440 px).",
      SEITEN.map((x) => [x[0], x[1], x[2], ""]), files, 3), path.join(OUT, "03-layout-uebersicht.jpg"));
  }
  if (what === "apps" || what === "alle") {
    const APPS = [["smartparts", "WK SmartParts", "Echte Screens"], ["wk-material", "WK Material", "Konzeptansicht"], ["wk-instandhaltung", "WK Instandhaltung", "Konzeptansicht"], ["wk-finance", "WK Finance", "Konzeptansicht"], ["wk-3d", "WK 3D", "Konzeptansicht"], ["index", "Startseite – SmartParts-Bühne", "Echte Screens"]];
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const files = [];
    for (const [name] of APPS) {
      await page.goto("http://localhost:8765/" + name + ".html", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const ok = await page.evaluate(() => {
        const el = document.querySelector("[data-showcase]");
        if (!el) return false;
        const r = el.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + r.top + r.height / 2 - innerHeight / 2);
        return true;
      });
      await page.waitForTimeout(ok ? 3400 : 500);
      const f = path.join(TMP, "a-" + name + ".png");
      await page.screenshot({ path: f });
      files.push(f);
    }
    await page.close();
    await renderBoard(browser, board("App-Animationen",
      "Jede WK-App mit derselben Inszenierung: geneigtes Produktfenster, wechselnde Bildschirme mit Glanzlicht, schwebende Detailkarten, leichte Neigung mit der Maus. Konzeptansichten sind als Beispieldaten gekennzeichnet.",
      APPS.map((x) => [x[0], x[1], x[2], ""]), files, 3), path.join(OUT, "04-app-animationen.jpg"));
  }
  if (what === "kacheln" || what === "alle") {
    // Ausschnitte mit Kachelflächen (lokaler Server nötig)
    const KACHELN = [
      ["index", ".tiles", "Leistungswelten", "Startseite – fünf Kacheln als eine Fläche"],
      ["index", ".trio", "Drei Kernaussagen", "Startseite – Lokale KI / Offline / Datenhoheit"],
      ["quick-check", ".traffic", "Ampel", "Quick-Check – Status als farbige Oberkante"],
      ["handwerk", ".grid-3", "Karten-Raster", "Handwerk – Problemkarten als eine Fläche"],
      ["smartparts", ".kpis", "Kennzahlen", "SmartParts – Kennzahlen (Beispieldaten)"],
      ["index", ".audience", "Zielgruppen", "Startseite – Einstiege Handwerk / Industrie"],
    ];
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const files = [];
    for (const [name, sel] of KACHELN) {
      await page.goto("http://localhost:8765/" + name + ".html", { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      await page.evaluate((s) => {
        const el = document.querySelector(s);
        if (el) el.scrollIntoView({ block: "center" });
        document.querySelectorAll("[data-anim]").forEach((e) => e.classList.add("in"));
      }, sel);
      await page.waitForTimeout(2200);
      const box = await page.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const y = Math.max(0, r.top - 24);
        return { x: Math.max(0, r.left - 24), y: y, width: Math.min(r.width + 48, 1440), height: Math.min(r.height + 48, 900 - y) };
      }, sel);
      const f = path.join(TMP, "k-" + name + "-" + files.length + ".png");
      await page.screenshot(box ? { path: f, clip: box } : { path: f });
      files.push(f);
    }
    await page.close();
    await renderBoard(browser, board("Kacheln stilgerecht integriert",
      "Zusammengehörige Kacheln bilden eine gemeinsame, deckende Fläche mit feinen Trennlinien – wie ein technisches Datenblatt. Kein Schweben, kein Durchscheinen der Welle; verlinkte Kacheln zeigen beim Überfahren eine Limette-Oberkante.",
      KACHELN.map((k) => [k[0], k[2], k[3], ""]), files, 2, "contain"), path.join(OUT, "05-kachel-integration.jpg"));
  }
  await browser.close();
})();
