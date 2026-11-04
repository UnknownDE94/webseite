"""Erzeugt die App-Symbole (assets/apps/icons/*.webp) aus dem WK-Logo:
das grüne „W“ wird je App umgefärbt, das silberne „K“ bleibt.
Farben angelehnt an die Desktop-Symbole des Inhabers.
Aufruf: python3 tools/visuals/app-icons.py
"""
import colorsys, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets", "logo-mark-lg.webp")
OUT = os.path.join(ROOT, "assets", "apps", "icons")

# App: (dunkel, hell) – Verlauf über die Helligkeit des Originals
APPS = {
    "smartparts": None,  # Original-Grün
    "material": ((24, 58, 150), (96, 146, 255)),
    "instandhaltung": ((128, 52, 6), (255, 160, 70)),
    "finance": ((112, 20, 30), (232, 92, 100)),
    "3d-druck": ((104, 78, 14), (238, 205, 102)),
    "ki-werkstatt": ((52, 96, 0), (176, 232, 60)),
}

src = Image.open(SRC).convert("RGBA")
px = src.load()
w, h = src.size
# Helligkeitsbereich des grünen W bestimmen
vals = []
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a > 200:
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.22 < hh < 0.5 and s > 0.2:
                vals.append(v)
vals.sort()
lo, hi = vals[int(len(vals) * 0.02)], vals[int(len(vals) * 0.98)]

os.makedirs(OUT, exist_ok=True)
for name, ramp in APPS.items():
    im = src.copy()
    if ramp:
        p = im.load()
        (d0, d1, d2), (l0, l1, l2) = ramp
        for y in range(h):
            for x in range(w):
                r, g, b, a = p[x, y]
                if not a:
                    continue
                hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                if 0.22 < hh < 0.5 and s > 0.12:
                    t = max(0.0, min(1.0, (v - lo) / (hi - lo)))
                    k = min(1.0, s / 0.35)  # Kantenpixel weich überblenden
                    nr = d0 + (l0 - d0) * t
                    ng = d1 + (l1 - d1) * t
                    nb = d2 + (l2 - d2) * t
                    p[x, y] = (int(r + (nr - r) * k), int(g + (ng - g) * k), int(b + (nb - b) * k), a)
    im = im.resize((320, round(320 * h / w)), Image.LANCZOS)
    im.save(os.path.join(OUT, "wk-%s.webp" % name), "WEBP", quality=90, method=6)
    print("assets/apps/icons/wk-%s.webp" % name)
