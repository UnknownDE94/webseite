# Webseite – Werringloer Komponentenmanagement

Statische Website (reines HTML/CSS/JS, kein Build-Prozess) für die
Dienstleistungen und Eigenvermarktung von Werringloer Komponentenmanagement.

## Struktur

```
index.html          Startseite
leistungen.html      Leistungsübersicht
ueber-mich.html      Über Tommy Werringloer
kontakt.html         Kontaktformular (mailto) & Kontaktdaten
impressum.html        Impressum (Entwurf – vor Veröffentlichung prüfen)
datenschutz.html      Datenschutzerklärung (Entwurf – vor Veröffentlichung prüfen)
css/style.css         Gemeinsames Stylesheet
js/main.js            Mobiles Menü, Footer-Jahr, Kontaktformular
assets/favicon.svg     Favicon/Logo-Platzhalter
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
- [ ] Eigenes Logo statt Platzhalter „WK" ergänzen (`assets/favicon.svg`)
- [ ] Ggf. eigene Domain einrichten

## Deployment

Vorgesehen für GitHub Pages. Hinweis: GitHub Pages ist für **private**
Repositories nur mit einem kostenpflichtigen GitHub-Plan (Pro/Team/Enterprise)
verfügbar. Auf dem kostenlosen Plan muss das Repository dafür entweder
öffentlich sein, oder es wird ein anderer Hosting-Anbieter genutzt (z. B.
Netlify, Vercel oder Cloudflare Pages – alle unterstützen private Repos auch
im kostenlosen Tarif).
