# Grafische und visuelle Empfehlungen

Begleitend zu den JPEG-Tafeln in `docs/empfehlungen/`:

| Datei | Inhalt |
|---|---|
| `01-wellen-varianten.jpg` | Neun Wellenzustände, davon fünf neue Raumformen |
| `02-partikel-motive.jpg` | Partikel-Motive, davon sechs neue laut Masterplan |
| `03-layout-uebersicht.jpg` | Die neuen Seiten im einheitlichen Layout (Vorlagen 1, 4–10) |
| `04-app-animationen.jpg` | App-Showcase je WK-App (Screens + schwebende Detailkarten) |

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

## 4. Mehr Varianz bei den Wellen (siehe `01-wellen-varianten.jpg`)

| Form | Wirkung | Empfohlener Einsatz |
|---|---|---|
| Orbit (Punkteglobus) | geschlossen, „alles bei Ihnen“ | Lokale KI, Datenhoheit, Sicherheit |
| Vortex (Wirbel) | verdichtet zum Kern | Analyse, Quick-Check |
| Ribbon (Datenband) | Übergang, Verbindung | Migration, Sync, Zusammenspiel der Apps |
| Tunnel (Datenkanal) | Tiefe, Blick nach vorn | Offline/Sync, Obsoleszenz |
| Dunes (Landschaft) | weit, ruhig | Region, Über uns, Rechtstexte |

Weitere Ideen für später (noch nicht umgesetzt):
1. **Partikel-Typenschild** – Punkte formen ein Typenschild, dessen Felder nacheinander
   „erkannt“ aufleuchten (KI-Werkstatt / Teileaufnahme).
2. **Explosionszeichnung** – ein Bauteil zerfällt in seine Einzelteile und setzt sich
   wieder zusammen (3D-Technik, Alternativteile).
3. **Inventur-Raster** – Punkte ordnen sich zu Regalfächern, einzelne Fächer werden
   „gezählt“ (WK Material).
4. **Synchronisations-Puls** – zwei Punktwolken (Gerät / Zentrale) tauschen Pakete aus,
   sobald die Verbindung zurück ist (Mobile & Offline).
5. **Wellen-Farbverlauf nach Tageszeit** – morgens kühler, abends wärmer (sehr dezent).

## 5. App-Animationen (siehe `04-app-animationen.jpg`)

Jede WK-App erhält dieselbe Inszenierung wie der Dribbble-Referenzentwurf
„Claims Management“: leicht geneigtes Produktfenster, Bildschirme wechseln alle
~5 Sekunden mit Glanzlicht, passende Detailkarten schweben vor das Fenster, die Maus
neigt die Bühne. SmartParts nutzt echte Screenshots; Material, Instandhaltung, Finance
und 3D zeigen gekennzeichnete Konzeptansichten (Beispieldaten), bis echte Screens
vorliegen. Empfehlung: echte Screens nachliefern und in `assets/apps/` gleich benennen –
das Markup bleibt unverändert.
