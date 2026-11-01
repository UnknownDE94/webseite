# Komponenten & Seitenbau

Alle Seiten entstehen aus `src/pages/<name>.html` mit `node tools/build/build.js [name]`.
Header, Footer und `<head>` kommen aus `src/partials/`. Fertige Seiten liegen als
statisches HTML im Wurzelverzeichnis (nicht von Hand bearbeiten – sie werden überschrieben).

## Seitengerüst
```html
---
title: Seitentitel – Werringloer Komponentenmanagement
description: Eigene Meta-Beschreibung (140–160 Zeichen)
nav: <seitenname>          # markiert Menüpunkt (index→start, sonst Dateiname ohne .html)
group: leistungen|loesungen  # hebt Dropdown hervor
robots: noindex            # nur danke, 404, Weiterleitungen
---
<!-- head --> optional: JSON-LD <!-- /head -->
<main id="main">
  <section class="page-hero" data-wave="hero"> … </section>
  <section class="section" data-wave="calm"> … </section>
</main>
```
`<!-- include:map-de -->`, `<!-- include:process-curve -->`, `<!-- include:sequence-3d -->`
fügen Partials aus `src/partials/` ein.

## Wellen-Zustände (`data-wave` am direkten Kind von `<main>`)
hero · calm · flow · grid · pulse · surge · flat · **orbit** (Kugel) · **vortex** (Wirbel) ·
**ribbon** (Datenband) · **tunnel** · **dunes** (Landschaft). Erste Section = hero, CTA = surge.

## Partikel-Motive (`<div class="wave-slot wave-slot--icon" data-shape="…" aria-hidden="true"></div>`)
logo · bars · modules · talk · scan · fork · gear · database · euro · truck · shield ·
check · 404 · mobile · offline · local-ai · migrate · cad · network.
Größen: `wave-slot--logo` (16:10), `wave-slot--icon` (1:1), `wave-slot--wide` (2:1).
Wechsel im Takt einer Liste: `data-shape-cycle="a b c" data-cycle-steps="<id der ol>"`.
Reiter mit `data-shape` + Container `data-shape-target="<slot-id>"`.

## Bausteine (Vorlagen 1, 4–10)
| Baustein | Klassen |
|---|---|
| Startseiten-Hero (V1) | `.hero > .container > .hero__grid > .hero__copy + .hero__visual`, darunter `ul.hero-points` |
| Unterseiten-Kopf | `.page-hero > .container > .page-hero__grid` (Text + Motiv), `.breadcrumb`, `.eyebrow`, `h1`, `.lead`, `.actions` |
| Abschnittskopf | `.section-head` (`--center`, `--row` mit Button rechts) |
| Leistungskacheln (V4) | `.tiles` (`--4`, `--3`) > `a.tile` (Icon, h3, p) |
| Prozessweg (V5) | `.process > include:process-curve + ol.process__steps[style=--steps:6]` |
| Produktbühne (V6) | `.product-stage` (Text + `.showcase-app`), darunter `ul.feature-strip` |
| App-Animation | `.showcase-app[data-showcase] > .showcase-app__stage > .window > .showcase-app__screen > img…` + `.callout[data-for=n]` (Ausschnitt per `background-image:url(…)`, `--pos`, `--zoom`, `--w`, `--ar`, Lage mit left/right/top/bottom) + `.showcase-app__dots` + `p.note` „Darstellung mit Beispieldaten.“ |
| Bauteil-Sequenz (V7) | `include:sequence-3d` |
| Region (V8) | `.region` (Text + `.region__map` mit include:map-de), `.info-cards > .info-card` |
| Kennzahlen (V9) | `.kpis > .kpi(--ok/--warn/--crit) > .kpi__value + .kpi__label + .kpi__trend` |
| Abschluss / Kontakt (V10) | `.closing > .closing__grid`, `.cta-split` + `.form-card`, `ul.contact-row` |
| Karten | `.card` (flach), `.card--glass` (nur Kennzahlen/Produkt/CTA), `.grid-2/3/4`, `.trio` |
| Listen | `.checklist`, `.dotlist(--cols)`, `.chips`, `ol.chain` (A → B → C), `ul.matrix` (Problem → Einstieg) |
| Status | `span.status.status--geplant|pilot|entwicklung|verfuegbar` (immer mit Text) |
| Tabelle | `.table-wrap > table.table` |
| Ampel | `.traffic > .t-ok/.t-warn/.t-crit` |
| Gegenüberstellung | `.versus > .card + .versus__mid + .card` |
| FAQ | `.faq > details > summary + div` |
| Reiter | `[data-tabs] .tabs-bar [role=tab][aria-controls]` + `.tab-panel` |
| Rechenbeispiel | `#kapitalrechner` (siehe material-ersatzteile) |
| Smartphone | `.phone > img` |
| Zielgruppen | `.audience > a` |

Icons: `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#name"/></svg>` –
Namen siehe `assets/icons.svg` (keine Personen-Symbole). Buttons nur `.btn--primary`,
`.btn--secondary`, `.link-arrow`. Glas nur für Kennzahlen, Produktfenster, CTA.
