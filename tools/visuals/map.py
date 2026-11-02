"""Erzeugt src/partials/map-de.html: Deutschlandkarte aus Punkten, Niedersachsen
hervorgehoben, Standort Salzgitter mit Beschriftung. Aufruf: python3 tools/visuals/map.py"""
import math, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DE = [(54.9,8.3),(54.8,9.4),(54.45,10.2),(54.45,11.1),(53.95,10.9),(54.2,12.1),(54.6,13.4),(54.05,14.2),(53.3,14.4),(52.6,14.6),(52.3,14.6),(51.8,14.7),(51.15,15.0),(50.9,14.8),(50.85,14.3),(50.75,13.5),(50.4,12.9),(50.3,12.2),(50.1,12.4),(49.7,12.5),(49.3,12.9),(48.9,13.5),(48.6,13.8),(48.3,13.4),(47.6,13.0),(47.55,12.9),(47.7,12.2),(47.6,11.5),(47.4,11.0),(47.55,10.4),(47.5,9.7),(47.65,9.2),(47.7,8.6),(47.6,8.0),(47.55,7.6),(48.0,7.6),(48.6,7.8),(48.95,8.2),(49.1,7.0),(49.2,6.4),(49.5,6.4),(49.8,6.5),(50.1,6.1),(50.3,6.2),(50.75,6.0),(51.0,5.9),(51.4,6.2),(51.85,5.95),(51.9,6.8),(52.3,7.0),(52.6,7.0),(53.2,7.2),(53.6,7.0),(53.7,7.5),(53.6,8.2),(53.9,8.7),(54.3,8.6),(54.5,8.8)]
# Niedersachsen (vereinfacht, ohne Bremen/Hamburg-Feinheiten)
NDS = [(53.62,6.95),(53.75,7.6),(53.88,8.6),(53.6,9.05),(53.45,9.65),(53.42,10.3),(53.3,10.65),(53.05,11.3),(52.85,11.6),(52.55,11.0),(52.25,11.05),(51.95,10.95),(51.62,10.68),(51.42,10.35),(51.52,9.9),(51.38,9.62),(51.7,9.42),(52.02,9.1),(52.25,8.6),(52.5,8.3),(52.38,7.95),(52.2,7.6),(52.32,7.02),(52.62,6.72),(53.2,7.2)]
def inside(poly, lat, lon):
    c = False
    for i in range(len(poly)):
        y1, x1 = poly[i]; y2, x2 = poly[(i + 1) % len(poly)]
        if (y1 > lat) != (y2 > lat) and lon < x1 + (lat - y1) * (x2 - x1) / (y2 - y1):
            c = not c
    return c
W, H = 400, 480
lat0, lat1, lon0, lon1 = 47.2, 55.1, 5.7, 15.2
k = math.cos(math.radians(51))
s = min(W / ((lon1 - lon0) * k), H / (lat1 - lat0))
proj = lambda lat, lon: ((lon - lon0) * k * s, (lat1 - lat) * s)
dots = []
for py in range(0, H, 9):
    for px in range(0, W, 9):
        lon = px / s / k + lon0; lat = lat1 - py / s
        if inside(DE, lat, lon):
            dots.append((px, py, inside(NDS, lat, lon)))
sx, sy = proj(52.15, 10.33)
out = ['<svg viewBox="0 0 %d %d" role="img" aria-label="Deutschlandkarte: Standort Salzgitter in Niedersachsen">' % (W, H)]
out.append('<g>' + ''.join('<circle class="map-dot%s" cx="%d" cy="%d" r="%s"/>' % (' map-dot--ns' if n else '', x, y, '2.4' if n else '2') for x, y, n in dots) + '</g>')
out.append('<circle class="map-glow" cx="%.0f" cy="%.0f" r="34"/>' % (sx, sy))
out.append('<circle class="map-ring" cx="%.0f" cy="%.0f" r="10"/>' % (sx, sy))
out.append('<circle class="map-pin" cx="%.0f" cy="%.0f" r="7"/>' % (sx, sy))
bx, by = sx + 18, sy - 30
out.append('<path class="map-tick" d="M%.0f %.0f H%.0f"/>' % (sx + 8, sy, bx))
out.append('<rect class="map-badge" x="%.0f" y="%.0f" width="164" height="58" rx="12"/>' % (bx, by))
out.append('<text class="map-label" x="%.0f" y="%.0f">Salzgitter</text>' % (bx + 14, by + 26))
out.append('<text class="map-sub" x="%.0f" y="%.0f">Niedersachsen</text>' % (bx + 14, by + 45))
out.append('</svg>')
open(os.path.join(ROOT, 'src', 'partials', 'map-de.html'), 'w').write(''.join(out) + '\n')
print(len(dots), 'Punkte, davon Niedersachsen:', sum(1 for d in dots if d[2]))
