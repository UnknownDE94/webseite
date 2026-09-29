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
materialstammdaten-checkliste.html  Praxis-Checkliste Materialstammdaten
impressum.html                      Impressum (Entwurf – vor Veröffentlichung prüfen)
datenschutz.html                    Datenschutzerklärung (Entwurf – vor Veröffentlichung prüfen)
css/style.css                       Gemeinsames Stylesheet (Design 2026: Creme, Waldgrün, Limette; Hell/Dunkel)
js/main.js                          Theme, mobiles Menü, Einblend-Animationen, Reiter, Bildwechsel, Kontaktformular
assets/logo.png                     Logo (freigestellt, transparent)
assets/logo-mark.webp               Bildmarke für Header/Footer
assets/logo-mark-lg.webp            Große Bildmarke für die dunklen Aktionsflächen
assets/favicon.png, favicon.ico     Favicons, apple-touch-icon.png für iOS
assets/og-image.jpg                 Vorschaubild für Social Media (1200×630)
assets/illustrations/               Illustrationen (halb transparent im Hintergrund, im Dunkelmodus invertiert)
assets/platform/                    Ansichten aus WK SmartParts (Beispieldaten, 16:10, einheitlicher Rahmen)
assets/media/                       Hintergrundmotive (Landschaft; Platz für spätere Hintergrundvideos)
assets/fonts/                       Lokal gehostete Schriften (Archivo, Inter, JetBrains Mono, Montserrat; SIL OFL)
```

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
