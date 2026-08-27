#!/usr/bin/env python3
"""Genera favicon-96x96.png e favicon.ico dal marchio Spicchi, variante 1a
(oro + bianco) su pastiglia blu scuro: il fallback statico deve restare
leggibile sia su tab scure sia su tab chiare (l'SVG, invece, cambia da solo
in 1b quando la tab e' chiara)."""
from PIL import Image, ImageDraw

GOLD, IVORY, NAVY = "#F5B63F", "#EDE9FF", "#141A3D"
S = 8  # supersampling


def mark(size):
    px = size * S
    img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r_corner = int(px * 0.22)
    d.rounded_rectangle([0, 0, px - 1, px - 1], radius=r_corner, fill=NAVY)
    # anello a 8 spicchi alternati (stessa geometria dell'SVG: r=28, stroke 14 su 96)
    r, w = px * 28 / 96, px * 14 / 96
    box = [px / 2 - r, px / 2 - r, px / 2 + r, px / 2 + r]
    for i in range(8):
        a0 = -90 + i * 45
        d.arc(box, a0, a0 + 45, fill=GOLD if i % 2 == 0 else IVORY, width=int(round(w)))
    # perno
    rp = px * 5 / 96
    d.ellipse([px / 2 - rp, px / 2 - rp, px / 2 + rp, px / 2 + rp], fill=GOLD)
    return img.resize((size, size), Image.LANCZOS)


mark(96).save("favicon-96x96.png")
mark(256).save("favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("ok")
