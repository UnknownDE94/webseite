"""Erzeugt src/partials/sequence-3d.html – den 3D-Ablauf als EIN Bauteil in vier
schrägen Streifen: Original → Punktwolke (3D-Scan) → CAD-Modell mit Bemaßung →
gedrucktes Teil im Schichtaufbau. Darunter vier Spalten mit den Stufen.
Aufruf: python3 tools/visuals/morph3d.py && node tools/build/build.js 3d-technik
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W, H = 1000, 380
BOUNDS = [0, 250, 500, 750, W]   # Streifengrenzen = vier gleich breite Spalten
SKEW = 34                        # Schräge der Streifen (oben +, unten −)


def poly(pts):
    return " ".join("%g,%g" % p for p in pts)


# 2,5D-Winkelprofil
FACES = [
    ("base_front", [(70, 300), (900, 300), (900, 324), (70, 324)]),
    ("base_end", [(900, 300), (960, 252), (960, 276), (900, 324)]),
    ("base_top", [(70, 300), (900, 300), (960, 252), (130, 252)]),
    ("fl_end", [(960, 252), (978, 238), (978, 70), (960, 84)]),
    ("fl_front", [(130, 252), (960, 252), (960, 84), (130, 84)]),
    ("fl_top", [(130, 84), (960, 84), (978, 70), (148, 70)]),
]
HOLES_FL = [(205, 166), (385, 166), (625, 166), (865, 166)]
HOLES_BASE = [(330, 278), (600, 278)]

STYLES = [
    dict(base_front="#4c4034", base_end="#3f352b", base_top="url(#m3-metal)", fl_end="#3f352b",
         fl_front="#7d6c52", fl_top="#ab9b7e", hole="#0a0f0c"),
    dict(base_front="url(#m3-dots2)", base_end="url(#m3-dots2)", base_top="url(#m3-dots)", fl_end="url(#m3-dots2)",
         fl_front="url(#m3-dots)", fl_top="url(#m3-dots)", hole="#0a0f0c"),
    dict(base_front="url(#m3-mesh)", base_end="url(#m3-mesh)", base_top="url(#m3-mesh)", fl_end="url(#m3-mesh)",
         fl_front="url(#m3-mesh)", fl_top="url(#m3-mesh)", hole="#0a0f0c", stroke=' stroke="#d4ec5f" stroke-width="1.4"'),
    dict(base_front="url(#m3-layers)", base_end="url(#m3-layers)", base_top="url(#m3-layers2)", fl_end="url(#m3-layers)",
         fl_front="url(#m3-layers2)", fl_top="#8a9590", hole="#0a0f0c"),
]

EXTRA = {
    # Gebrauchsspuren am Original
    0: '<path d="M150 288l40 6M180 110l34 10M95 312l26 3" stroke="#2b241d" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>',
    # Bemaßung im CAD-Streifen
    2: ('<g stroke="#d4ec5f" stroke-width="1" fill="none" opacity=".9">'
        '<path d="M625 122v-26M625 210v20M601 166h-24M649 166h24"/>'
        '<path d="M530 52h190" stroke-dasharray="3 4"/><path d="M530 46v12M720 46v12"/></g>'
        '<text x="625" y="40" fill="#d4ec5f" font-family="JetBrains Mono, monospace" font-size="13" text-anchor="middle">190,0</text>'
        '<text x="660" y="204" fill="#d4ec5f" font-family="JetBrains Mono, monospace" font-size="13">Ø 48</text>'),
}

STEPS = [
    ("Originalteil", "Verschlissen oder nicht mehr lieferbar"),
    ("3D-Scan", "Intern als Punktwolke erfassen"),
    ("CAD-Modell", "Intern aufbereiten, bemaßen, prüfen"),
    ("3D-Druck", "Intern, sofern technisch geeignet und freigegeben"),
]


def part(st):
    stroke = st.get("stroke", "")
    out = ['<polygon points="%s" fill="%s"%s/>' % (poly(pts), st[name], stroke) for name, pts in FACES]
    out += ['<ellipse cx="%d" cy="%d" rx="24" ry="30" fill="%s"%s/>' % (x, y, st["hole"], stroke) for x, y in HOLES_FL]
    out += ['<ellipse cx="%d" cy="%d" rx="30" ry="11" fill="%s"%s/>' % (x, y, st["hole"], stroke) for x, y in HOLES_BASE]
    return "".join(out)


def band(i):
    a, b = BOUNDS[i], BOUNDS[i + 1]
    ta = a + SKEW if i > 0 else -10
    tb = b + SKEW if i < 3 else W + 10
    ba = a - SKEW if i > 0 else -10
    bb = b - SKEW if i < 3 else W + 10
    return [(ta, 0), (tb, 0), (bb, H), (ba, H)]


defs = (
    '<defs>'
    '<linearGradient id="m3-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a39377"/><stop offset="1" stop-color="#5b4c3c"/></linearGradient>'
    '<pattern id="m3-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.25" fill="#d4ec5f"/></pattern>'
    '<pattern id="m3-dots2" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="0.9" fill="#8fbf6a"/></pattern>'
    '<pattern id="m3-mesh" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="skewX(-38)"><path d="M0 0H14M0 0V14" stroke="#9fb0a8" stroke-width="0.6" fill="none"/></pattern>'
    '<pattern id="m3-layers" width="4" height="3.4" patternUnits="userSpaceOnUse"><rect width="4" height="3.4" fill="#4f5a55"/><path d="M0 2.9H4" stroke="#2c3430" stroke-width="0.9"/></pattern>'
    '<pattern id="m3-layers2" width="4" height="3.4" patternUnits="userSpaceOnUse"><rect width="4" height="3.4" fill="#6c7772"/><path d="M0 2.9H4" stroke="#3c4642" stroke-width="0.9"/></pattern>'
    '<linearGradient id="m3-beam" x1="0" x2="1"><stop offset="0" stop-color="#d4ec5f" stop-opacity="0"/><stop offset=".5" stop-color="#d4ec5f" stop-opacity=".55"/><stop offset="1" stop-color="#d4ec5f" stop-opacity="0"/></linearGradient>'
    + "".join('<clipPath id="m3-c%d"><polygon points="%s"/></clipPath>' % (i, poly(band(i))) for i in range(4))
    + '</defs>'
)
slices = "".join(
    '<g class="morph__slice" style="--i:%d" clip-path="url(#m3-c%d)">%s%s</g>' % (i, i, part(st), EXTRA.get(i, ""))
    for i, st in enumerate(STYLES)
)
lines = ""
for j, x in enumerate(BOUNDS[1:4]):
    if j == 0:  # erste Grenze als Scanstrahl
        lines += ('<g class="morph__beam"><polygon points="%s" fill="url(#m3-beam)" opacity=".5"/>'
                  '<line x1="%d" y1="0" x2="%d" y2="%d" stroke="#d4ec5f" stroke-width="1.6"/></g>'
                  % (poly([(x + SKEW - 14, 0), (x + SKEW + 14, 0), (x - SKEW + 14, H), (x - SKEW - 14, H)]), x + SKEW, x - SKEW, H))
    else:
        lines += '<line x1="%d" y1="0" x2="%d" y2="%d" stroke="rgba(255,255,255,.22)" stroke-dasharray="4 6"/>' % (x + SKEW, x - SKEW, H)

svg = ('<svg class="morph__art" viewBox="0 0 %d %d" role="img" aria-label="Ein Winkelbauteil in vier Streifen: '
       'Original, Punktwolke aus dem 3D-Scan, CAD-Modell mit Bemaßung, gedrucktes Bauteil im Schichtaufbau">%s%s%s</svg>'
       % (W, H, defs, slices, lines))
steps = "\n".join("            <li><strong>%s</strong><span>%s</span></li>" % s for s in STEPS)
html = ('<figure class="morph">\n          %s\n          <ol class="morph__steps">\n%s\n          </ol>\n        </figure>\n'
        % (svg, steps))
open(os.path.join(ROOT, "src", "partials", "sequence-3d.html"), "w").write(html)
print("src/partials/sequence-3d.html geschrieben")
