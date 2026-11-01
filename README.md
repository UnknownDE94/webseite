# Webseite – Werringloer Komponentenmanagement

Statische Website (reines HTML/CSS/JS, kein Build-Prozess) für die
Dienstleistungen und Eigenvermarktung von Werringloer Komponentenmanagement.

## Struktur

```
index.html                          Startseite
leistungen.html                     Leistungsbereiche & Pakete
smartparts.html                     WK SmartParts (Plattform-Einblick mit Ansichten aus der Plattform)
ueber-mich.html                     Über uns
kontakt.html                        Kontaktformular (mailto) & Kontaktdaten
impressum.html                      Impressum (Entwurf – vor Veröffentlichung prüfen)
datenschutz.html                    Datenschutzerklärung (Entwurf – vor Veröffentlichung prüfen)
css/style.css                       Gemeinsames Stylesheet (Design 2026: Creme, Waldgrün, Limette; Hell/Dunkel)
js/main.js                          Theme, mobiles Menü, Einblend-Animationen, Reiter, Bildwechsel, Kontaktformular
js/wave.js                          Seitenweite 3D-Partikelwelle (WebGL, ohne Bibliothek); Zustand je Abschnitt über data-wave
assets/logo.png                     Logo (freigestellt, transparent)
assets/logo-mark.webp               Bildmarke für Header/Footer
assets/logo-mark-lg.webp            Große Bildmarke für die dunklen Aktionsflächen
assets/favicon.png, favicon.ico     Favicons, apple-touch-icon.png für iOS
assets/og-image.jpg                 Vorschaubild für Social Media (1200×630)
assets/platform/                    Ansichten aus WK SmartParts (Beispieldaten, 16:10, einheitlicher Rahmen)
assets/media/                       Erklärfilm und Poster (derzeit nicht eingebunden; ersetzt durch die Partikelwelle)
assets/fonts/                       Lokal gehostete Schriften (Archivo, Inter, JetBrains Mono, Montserrat; SIL OFL)
```

## Partikelwelle (js/wave.js)

Ein fest stehendes WebGL-Canvas liegt hinter allen Inhalten. Jeder direkte
Abschnitt in `<main>` kann den Zustand der Welle wählen:

| `data-wave` | Wirkung                                           | Standard für             |
|-------------|---------------------------------------------------|--------------------------|
| `hero`      | hohe Welle, rechts versetzt, volle Leuchtkraft     | erster Abschnitt         |
| `calm`      | flach und dezent am unteren Rand (Lesetext)        | alle übrigen Abschnitte  |
| `flow`      | dichter, schneller – für Abläufe und Schritte      | –                        |
| `grid`      | Draufsicht, fast ruhendes Punktraster – für Daten  | –                        |
| `pulse`     | Ringe wie ein Signal – für Kontakt und Quick-Check | –                        |
| `surge`     | kräftiger Wellenberg hinter Handlungsaufforderung  | Abschnitte mit `.cta-band` |
| `flat`      | ruhiger Ausklang                                   | Footer                   |

**Formen aus Partikeln:** Ein leeres Element mit `data-shape="bars"`
(Balkendiagramm mit Ampel), `"modules"` (sechs Leistungsbereiche um einen Kern)
oder `"logo"` (Bildmarke) ist ein Platzhalter. Steht es mittig im Bild, löst
sich ein Teil der Punkte aus der Welle und formt das Motiv an dieser Stelle.
Neue Motive werden in `SHAPES` in `js/wave.js` auf ein 2D-Canvas gezeichnet
(Grün = Limette, Weiß = Silber).

**Kennzahlen:** `<span data-count="1250" data-prefix="ab " data-suffix=" €">ab 1.250 €</span>`
zählt beim Hineinscrollen hoch (js/main.js); ohne JavaScript steht der Endwert da.

Bei `prefers-reduced-motion` steht die Welle still, ohne WebGL bleibt der
CSS-Verlauf. Überschriften-Labels wie `[01] Ausgangslage` entstehen über
`data-eyebrow` am `.section-head`.

## Lokal ansehen

Kein Build-Schritt nötig. Einfach `index.html` im Browser öffnen, oder für
korrektes relatives Verhalten einen einfachen lokalen Server starten:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Offene Punkte

- [ ] Telefonnummer und USt-IdNr. im [Impressum](impressum.html) ergänzen
- [ ] Impressum & Datenschutzerklärung juristisch prüfen lassen
- [ ] Finalen Hosting-Anbieter festlegen und in der Datenschutzerklärung eintragen
- [x] Eigenes Logo eingebunden (`assets/logo.png`, `assets/logo-mark.webp`)
- [ ] Ggf. eigene Domain einrichten

## Deployment

Vorgesehen für GitHub Pages. Hinweis: GitHub Pages ist für **private**
Repositories nur mit einem kostenpflichtigen GitHub-Plan (Pro/Team/Enterprise)
verfügbar. Auf dem kostenlosen Plan muss das Repository dafür entweder
öffentlich sein, oder es wird ein anderer Hosting-Anbieter genutzt (z. B.
Netlify, Vercel oder Cloudflare Pages – alle unterstützen private Repos auch
im kostenlosen Tarif).
