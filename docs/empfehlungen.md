# Grafische und visuelle Empfehlungen

Begleitend zu den JPEG-Tafeln in `docs/empfehlungen/`:

| Datei | Inhalt |
|---|---|
| `01-wellen-varianten.jpg` | Sechs Zustände derselben Welle (keine Sonderformen mehr) |
| `02-partikel-motive.jpg` | 15 fachlich konkrete Partikel-Motive (Bauteile, Werkzeuge, Arbeitsmittel) |
| `03-layout-uebersicht.jpg` | Die neuen Seiten im einheitlichen Layout (Vorlagen 1, 4–10) |
| `04-app-animationen.jpg` | App-Showcase je WK-App (Screens + schwebende Detailkarten) |
| `05-kachel-integration.jpg` | Kacheln als gemeinsame Fläche mit Trennlinien |

## 1. Einheitlicher Layoutstil

- **Ein Seitenkopf-Muster für alle Unterseiten**: Brotkrumen → Eyebrow (Mono, Limette) →
  H1 → Lead → max. zwei Buttons → rechts ein Partikel-Motiv. Startseite als Ausnahme mit
  großem Claim und Logo aus Partikeln (Vorlage 1).
- **Abschnitte im Wechsel** `section` / `section--alt` – keine harten Farbflächen, nur
  feine Linien. Pro Seite höchstens 7 Abschnitte, ein klarer Abschluss (Vorlage 10).
- **Kacheln statt Kartenwände**: Leistungswelten als fünf große, ruhige Kacheln mit
  Linien-Icon (Vorlage 4); Inhaltskarten flach mit feiner Kontur, Glas nur für
  Kennzahlen, Produktfenster und CTA.
- **Prozesse immer gleich** dargestellt: nummerierte Schritte auf einer leuchtenden
  Linie mit sanft gezeichneter Kurve (Vorlage 5); mobil vertikal.

## 2. Schaltflächen – neue Ordnung

| Stelle | Primär (Limette) | Sekundär (Kontur) | Textlink |
|---|---|---|---|
| Header | Projekt besprechen | – | – |
| Startseiten-Hero | Projekt besprechen | Leistungen entdecken | – |
| Leistungsseite | Quick-Check anfragen | Projekt besprechen | Verwandte Leistung → |
| Produktseite | Live-Einblick / Projekt besprechen | Alle Lösungen | Mobile & Offline → |
| Abschluss jeder Seite | Projekt unverbindlich besprechen | Quick-Check starten | – |

Regeln: pro Bildschirmhöhe höchstens **ein** Primärbutton; Buttons immer links unter dem
Text (nicht zentriert, außer Danke/404); Abschnittsköpfe mit Button rechts (`section-head--row`).
Hover nur `translateY(-2px)`, keine Skalierung.

## 3. Grafik und Bildsprache

- **Keine Fotos von Menschen, keine Stockfotos** – stattdessen echte Screenshots,
  stilisierte Linien-Grafiken und Partikel-Motive.
- **3D-Sequenz** (Vorlage 7) als gezeichnete Bauteil-Stufen Original → Scan → CAD →
  Fertigung statt Fotos; dezent, im Markenstil.
- **Deutschlandkarte aus Punkten** mit Salzgitter-Markierung (Vorlage 8).
- **Kennzahlen** (Vorlage 9) nur mit echten Werten oder klar als „Beispieldaten“.
- **Icons**: ein einheitliches Linien-Set (`assets/icons.svg`), 1,6 px Strich,
  in Kacheln 1,2 px; keine Personen-Symbole.

## 4. Welle und Motive – ruhig und einheitlich

- **Nur eine Welle**: immer dieselbe Punktfläche; je Abschnitt ändern sich nur Höhe, Tempo
  und Helligkeit (hero, calm, flow, grid, surge, flat). Kugel, Wirbel, Band, Tunnel und
  Dünen sind entfernt.
- **Motive** (Kugellager, Typenschild, Lagerregal …) lösen sich langsam aus der Welle und
  zerfallen weich wieder, wenn man weiterscrollt oder das Motiv wechselt.
- **Barrierefreie Ansicht**: Schalter neben Hell/Dunkel blendet Welle, Motive und alle
  Animationen aus; die Wahl bleibt seitenübergreifend gespeichert.
- **Kein Gitterraster** und **keine Leuchtkurve** im Prozessweg mehr – weniger Linien,
  die mit Inhalt konkurrieren.

## 5. Kacheln stilgerecht integrieren (siehe `05-kachel-integration.jpg`)

Bisher standen Karten als einzelne schwebende Boxen mit Abstand und eigenem Rahmen
im Layout – vor der Welle wirkten sie unruhig. Neue Empfehlung, jetzt umgesetzt:

- **Eine Fläche statt vieler Boxen**: zusammengehörige Kacheln teilen sich einen
  gemeinsamen Rahmen; zwischen ihnen nur 1-px-Trennlinien – wie ein technisches
  Datenblatt oder eine Stückliste.
- **Deckender Grund**: Die Kachelfläche ist nicht mehr durchscheinend, Welle und Motive
  laufen nie hinter Text.
- **Hover statt Anheben**: Verlinkte Kacheln heben sich nicht mehr an, sondern bekommen
  eine Limette-Oberkante und eine leicht hellere Fläche.
- **Status als Kante**: Ampelkarten (Sofort handeln / Planen / Beobachten) zeigen ihre
  Farbe als obere Kante innerhalb der Fläche.
- Gilt überall: Leistungskacheln, Karten-Raster, Kennzahlen, Info-Karten, Ampel,
  Zielgruppen-Einstiege.

## 6. App-Animationen (siehe `04-app-animationen.jpg`)

Jede WK-App erhält dieselbe Inszenierung wie der Dribbble-Referenzentwurf
„Claims Management“: leicht geneigtes Produktfenster, Bildschirme wechseln alle
~5 Sekunden mit Glanzlicht, passende Detailkarten schweben vor das Fenster, die Maus
neigt die Bühne. SmartParts nutzt echte Screenshots; Material, Instandhaltung, Finance
und 3D zeigen gekennzeichnete Konzeptansichten (Beispieldaten), bis echte Screens
vorliegen. Empfehlung: echte Screens nachliefern und in `assets/apps/` gleich benennen –
das Markup bleibt unverändert.
