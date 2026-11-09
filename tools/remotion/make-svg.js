// Liest die SVG-Grafik aus src/partials/sequence-3d.html und schreibt sie als JS-Modul.
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "../../src/partials/sequence-3d.html"), "utf8");
const svg = html.match(/<svg class="morph__art"[\s\S]*?<\/svg>/)[0]
  .replace(/ role="img" aria-label="[^"]*"/, "").replace('class="morph__art" ', 'width="100%" height="100%" ');
fs.writeFileSync(path.join(__dirname, "src/svg.js"), "export default " + JSON.stringify(svg) + ";\n");
