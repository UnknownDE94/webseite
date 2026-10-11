# Werbevideo „Erfahrung statt Software“

Hintergrund-Loop für die Website: 48 Sekunden, 1920×1080, 30 fps, ohne Ton.

## Dateien

| Datei | Zweck |
|---|---|
| `erfahrung-statt-software.html` | Vollständiges Video als eine HTML-Datei (SVG, CSS, JavaScript, ohne externe Abhängigkeiten) |
| `capture-mp4.js` | Rendert den Loop Bild für Bild und kodiert ihn per ffmpeg als MP4 |

## Im Browser ansehen

Datei öffnen. Das Video läuft endlos und skaliert sich auf den Viewport (cover).

- `erfahrung-statt-software.html?t=17` zeigt ein einzelnes Bild bei Sekunde 17 (für Vorschau und Prüfung).
- Der Loop ist nahtlos: Bild 0 s und Bild 48 s sind identisch.

## Als MP4 aufnehmen

Variante 1, Skript (empfohlen, bildgenau, 30 fps, ruckelfrei):

```bash
npm i -g playwright && npx playwright install chromium   # einmalig
# ffmpeg muss im PATH liegen
cd werbevideo
NODE_PATH=$(npm root -g) node capture-mp4.js werbevideo.mp4
```

Das Skript ruft für jede Bildnummer `renderAt(t)` auf und schreibt den Frame per Pipe an ffmpeg (H.264, yuv420p, CRF 18). Die Dauer beträgt 1440 Frames, je nach Rechner einige Minuten.

Variante 2, Bildschirmaufnahme: Seite im Vollbild (1920×1080) öffnen und mit OBS oder einem Screenrecorder 48 s in 30 fps aufnehmen. Den Anfang bei Sekunde 0 starten und genau eine Schleife aufnehmen. Für die Website-Einbindung eignet sich das Ergebnis als Loop-Video.

## Anpassen

- Alle Zeitfenster stehen in `state(t)` (Szene 1–10).
- Kamerapunkte stehen in `KEYS` (Catmull-Rom, Start = Ende).
- Farben stehen in `:root` (CSS) und in `C` (JavaScript).
- Alle Werte sind fiktiv, alle Maschinen generisch. Es gibt keine Logos oder Herstellernamen.
