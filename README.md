# Webseite – Werringloer Komponentenmanagement

Statische Website (HTML/CSS/JS, kein Framework). **Smart. Effizient. Sicher.** –
technische und digitale Lösungen für Handwerk und Industrie.

## Arbeitsweise

Seiten werden aus Quelldateien gebaut; die fertigen `*.html` im Wurzelverzeichnis
sind normales statisches HTML (GitHub Pages braucht keinen Build-Schritt).

```bash
node tools/build/build.js          # alle Seiten aus src/pages/ bauen
node tools/build/build.js index    # nur eine Seite
python3 -m http.server 8000        # lokal ansehen: http://localhost:8000
```

**Nie die Root-HTML-Dateien direkt bearbeiten** – Änderungen gehören nach
`src/pages/` (Inhalt) bzw. `src/partials/` (Kopf, Header, Footer).

## Struktur

```
src/pages/*.html        Seiteninhalte mit Kopfbereich (title, description, nav …)
src/partials/           head-common, header (Navigation mit Dropdowns), footer,
                        map-de (Deutschlandkarte), process-curve, sequence-3d
css/style.css           Designsystem (Tokens, Bausteine, Responsive) – siehe docs/komponenten.md
js/main.js              Theme, Navigation, Einblendungen, Reiter, App-Showcase,
                        Motivwechsel, Kennzahlen, Rechenbeispiel, Kontaktformular
js/wave.js              Partikelwelle (WebGL): Zustände, Raumformen, Partikel-Motive
assets/                 Logo, Icons (icons.svg), Schriften, Screenshots (platform/, apps/)
tools/build/            Build-Skript (nur Node-Bordmittel)
tools/og/               Vorlage + Skript für assets/og-image.jpg
tools/visuals/          Wellen-Vorschau und Erzeugung der JPEG-Empfehlungen
tools/mockups/          App-Ansichten als Vollfenster mit Navigation (shell.js); SmartParts = echte Screens in nachgestellter Hülle
docs/                   Masterplan, Entscheidungen (offene Punkte!), Komponenten, Empfehlungen
archive/                Alte Entwürfe, Film/Video (nicht veröffentlicht)
```

## Partikelwelle

`data-wave` am Abschnitt wählt den Zustand der Welle: `hero`, `calm`, `flow`, `grid`, `surge`, `flat` (immer dieselbe Wellenfläche). Leere Platzhalter mit `data-shape` lassen Punkte
ein Motiv formen (z. B. `logo`, `mobile`, `offline`, `local-ai`, `migrate`, `cad`,
`network`, `bars`, `check`, `404`). Vorschau: `tools/visuals/wave-preview.html?state=calm&shape=bearing`.
Der Schalter im Header (barrierefreie Ansicht) blendet Welle, Motive und Animationen aus.
Bei `prefers-reduced-motion` steht alles still; ohne WebGL bleibt der CSS-Hintergrund.

## Offene Punkte

Alle offenen Entscheidungen (Firmierung, Quick-Check-Preis, Produktstatus,
Betriebsmodelle, Hoster, Analytics, 3D-Partner …) stehen in
[`docs/entscheidungen.md`](docs/entscheidungen.md). Was dort offen ist, darf auf
der Website nicht als Fakt erscheinen.

## Deployment

Vorgesehen für GitHub Pages (`_config.yml` schließt `src`, `tools`, `docs`,
`archive` aus). Vor Go-live: Impressum und Datenschutz juristisch prüfen.
