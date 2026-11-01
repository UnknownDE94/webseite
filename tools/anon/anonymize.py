"""Macht Hersteller- und Lieferantennamen in den echten SmartParts-Screenshots
unkenntlich (assets/platform/*.webp) und ersetzt sie durch neutrale Bezeichnungen.
Positionen sind für die vorliegenden Screenshots (1600 × 1000) ermittelt.
Aufruf (einmalig auf den Original-Screenshots):  python3 tools/anon/anonymize.py
Danach:  node tools/mockups/render.js smartparts   (Vollfenster-Versionen neu bauen)"""
from PIL import Image, ImageDraw, ImageFont
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Regular.otf", 20)
INK = (0, 0, 0)

# Je Zeile: (x0, x1, baseline, neuer Text). Abgedeckt wird nur das Textband der
# Zeile (baseline − 22 … baseline + 9), damit die Trennlinien erhalten bleiben.
JOBS = {
    "bestandsrisiko-ampel": [
        (912, 1110, 508, "Hersteller A"),
        (912, 1110, 583, "Hersteller B"),
        (912, 1110, 658, "Hersteller C"),
        (912, 1110, 732, "Hersteller D"),
        (912, 1110, 807, "Hersteller E"),
        (388, 880, 508, "Frequenzumrichter 5,5 kW"),
        (388, 880, 583, "Service-Kit Gleitringdichtung"),
    ],
    "disposition-vorschlaege": [
        (216, 545, 508, "Lieferant A"),
        (216, 545, 583, "Lieferant A"),
        (216, 545, 659, "Lieferant A"),
        (216, 545, 735, "Lieferant A"),
        (216, 545, 811, "Lieferant B"),
        (816, 1340, 508, "Frequenzumrichter 5,5 kW"),
        (816, 1340, 583, "Frequenzumrichter 2,2 kW 400 V"),
        (816, 1340, 735, "Frequenzumrichter 0,75 kW"),
    ],
}

for name, jobs in JOBS.items():
    path = os.path.join(ROOT, "assets", "platform", name + ".webp")
    im = Image.open(path).convert("RGB")
    d = ImageDraw.Draw(im)
    for x0, x1, base, text in jobs:
        d.rectangle([x0, base - 22, x1, base + 9], fill=(255, 255, 255))
        d.text((x0 + 4, base), text, font=FONT, fill=INK, anchor="ls")
    im.save(path, "WEBP", quality=88, method=6)
    print("anonymisiert:", os.path.relpath(path, ROOT))
