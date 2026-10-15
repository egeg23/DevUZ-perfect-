"""Знак Medikor вектором: на medikor.ru он только PNG 199×78
(/images/logos/medikor-new-logo-blue.png). Буквы MEDIK R — гарнитура Anton
(OFL, тот же тяжёлый узкий рисунок), «O» — их полосатый шар, его рисует
gen.mjs кругом с дугами. Цвет — их тёмно-синий #00082d с картинки.

  pip install fonttools
  python3 -I scripts/protos/medikor/logo.py <Anton.ttf>   → logo.json
"""
import json, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

f = TTFont(sys.argv[1]); gs = f.getGlyphSet(); cmap = f.getBestCmap()
upm = f["head"].unitsPerEm; cap = f["OS/2"].sCapHeight
H = 40.0; k = H / cap; TRACK = 1.2

def glyph(ch, x):
    pen = SVGPathPen(gs, ntos=lambda v: ("%.1f" % v).rstrip("0").rstrip("."))
    gs[cmap[ord(ch)]].draw(TransformPen(pen, (k, 0, 0, -k, x, H)))
    return pen.getCommands(), gs[cmap[ord(ch)]].width * k

x = 0; paths = []
for ch in "MEDIK":
    d, w = glyph(ch, x); paths.append(d); x += w + TRACK
ball = {"cx": round(x + 1.5 + H * .52, 1), "cy": H / 2, "r": round(H * .52, 1)}
x += H * 1.04 + TRACK + 3
d, w = glyph("R", x); paths.append(d); x += w
out = {"w": round(x, 1), "h": H, "d": " ".join(paths), "ball": ball}
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "logo.json"), "w"))
print(out["w"], ball)
