#!/usr/bin/env node
/* Baut die statischen Seiten im Wurzelverzeichnis aus src/pages/*.html und
   den gemeinsamen Partials in src/partials/. Nur Node-Bordmittel.

   Aufruf:  node tools/build/build.js            → alle Seiten
            node tools/build/build.js index      → nur src/pages/index.html

   Aufbau einer Seite (src/pages/<name>.html):
     ---
     title: Seitentitel – Werringloer Komponentenmanagement
     description: Meta-Beschreibung (eigene je Seite)
     nav: material-ersatzteile      (aktiver Menüpunkt, optional)
     group: leistungen | loesungen  (hebt das Dropdown hervor, optional)
     robots: noindex                (optional, z. B. danke/404/Weiterleitungen)
     og_title: …                    (optional, sonst title)
     og_description: …              (optional, sonst description)
     ---
     <!-- head --> … <!-- /head -->  (optional: JSON-LD o. Ä. im <head>)
     <main id="main"> … </main>

   Die Ausgabe <name>.html landet im Wurzelverzeichnis; fertige Seiten bleiben
   normales statisches HTML (GitHub Pages braucht keinen Build-Schritt). */

"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "src");
const BASE = "https://werringloer.de/";
// Cache-Version für CSS/JS: bei Änderungen erhöhen
const VERSION = "2026-42";

const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");
const partials = {
  head: read("partials/head-common.html"),
  header: read("partials/header.html"),
  footer: read("partials/footer.html"),
};

const escapeAttr = (s) => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, "&amp;").replace(/"/g, "&quot;");

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(file + ": Kopfbereich (---) fehlt");
  const meta = {};
  m[1].split("\n").forEach((line) => {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  let body = m[2].replace(/<!--\s*include:([a-z0-9-]+)\s*-->/g, (_, name) => read("partials/" + name + ".html").trim());
  let extraHead = "";
  const h = body.match(/<!--\s*head\s*-->([\s\S]*?)<!--\s*\/head\s*-->/);
  if (h) {
    extraHead = h[1].trim();
    body = body.replace(h[0], "");
  }
  return { meta, body: body.trim(), extraHead };
}

function build(name) {
  const file = path.join(SRC, "pages", name + ".html");
  const { meta, body, extraHead } = parse(file);
  ["title", "description"].forEach((k) => {
    if (!meta[k]) throw new Error(name + ": " + k + " fehlt");
  });
  const out = name + ".html";
  const canonical = BASE + (name === "index" ? "" : out);
  const head = partials.head
    .replace(/{{title}}/g, meta.title)
    .replace(/{{description}}/g, escapeAttr(meta.description))
    .replace(/{{og_title}}/g, escapeAttr(meta.og_title || meta.title))
    .replace(/{{og_description}}/g, escapeAttr(meta.og_description || meta.description))
    .replace(/{{canonical}}/g, canonical)
    .replace(/{{robots}}/g, meta.robots ? '<meta name="robots" content="' + meta.robots + '" />\n  ' : "")
    .replace(/{{version}}/g, VERSION);
  const header = partials.header
    .replace(/{{nav:([a-z0-9-]+)}}/g, (_, key) => (key === meta.nav ? ' aria-current="page"' : ""))
    .replace(/{{cur:([a-z0-9-]+)}}/g, (_, key) => (key === meta.group ? " is-current" : ""));
  const html =
    "<!doctype html>\n" +
    '<html lang="de">\n<head>\n  ' +
    head.trim() +
    (extraHead ? "\n  " + extraHead : "") +
    "\n</head>\n<body" +
    (meta.body_class ? ' class="' + meta.body_class + '"' : "") +
    ">\n  " +
    header.trim() +
    "\n\n  " +
    body +
    "\n\n  " +
    partials.footer.trim() +
    "\n\n" +
    '  <script src="js/main.js?v=' + VERSION + '"></script>\n' +
    '  <script src="js/wave.js?v=' + VERSION + '" defer></script>\n' +
    '  <script data-goatcounter="https://unknownde.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>\n' +
    "</body>\n</html>\n";
  fs.writeFileSync(path.join(ROOT, out), html);
  return out;
}

const only = process.argv[2];
const names = fs
  .readdirSync(path.join(SRC, "pages"))
  .filter((f) => f.endsWith(".html"))
  .map((f) => f.replace(/\.html$/, ""))
  .filter((n) => !only || n === only);
const built = names.map(build);
console.log("Gebaut: " + built.length + " Seite(n): " + built.join(", "));
