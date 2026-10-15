"""Значки вкладки: слово бюро на тёмном, шрифт заголовков макета.

    python3 icons.py <CormorantGaramond.ttf>
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[3] / "public" / "protos" / "arhbyuro"
BG, FG = (20, 17, 14), (238, 232, 222)

for name, size in (("icon-192.png", 192), ("apple-180.png", 180)):
    im = Image.new("RGB", (size, size), BG)
    dr = ImageDraw.Draw(im)
    font = ImageFont.truetype(sys.argv[1], int(size * 0.62))
    w = dr.textlength("L", font=font)
    dr.text(((size - w) / 2, size * 0.1), "L", font=font, fill=FG)
    dr.line([(size * 0.3, size * 0.8), (size * 0.7, size * 0.8)], fill=FG, width=max(2, size // 64))
    im.save(OUT / name, optimize=True)
print("ok")
