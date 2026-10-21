"""Картинки разделов: python3 -I pics.py [папка с fvr-tent.png, fvr-van.png].

Кадры презентации (docs/research/samauto/kadry, nano banana 4K по фото с
samauto.uz) → public/protos/samauto/s/<имя>-<ширина>.webp. Линейка 21:9 — 2400
и 1400 (телефон листает её вбок), остальные — 1600 и 900.
"""
import os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
K = os.path.join(HERE, "../../../docs/research/samauto/kadry")
OUT = os.path.join(HERE, "../../../public/protos/samauto/s")
os.makedirs(OUT, exist_ok=True)


def save(src, name, widths, q=74):
    im = Image.open(src).convert("RGB")
    for w in widths:
        im.resize((w, round(w * im.size[1] / im.size[0])), Image.LANCZOS).save(os.path.join(OUT, f"{name}-{w}.webp"), "WEBP", quality=q, method=6)


save(os.path.join(K, "15-lineup.webp"), "lineup", (2400, 1400), 76)
for f, n in (("06-fvr-podium", "fvr-samosval"), ("07-fvr-road", "road"), ("08-bus-samarkand", "bus"), ("09-water-tashkent", "water"),
             ("10-club", "club"), ("12-service", "service"), ("16-factory", "factory"), ("03-lights", "fara")):
    save(os.path.join(K, f + ".webp"), n, (1600, 900))
if len(sys.argv) > 1:
    for n in ("tent", "van"):
        save(os.path.join(sys.argv[1], f"fvr-{n}.png"), f"fvr-{n}", (1600, 900))
for f in sorted(os.listdir(OUT)):
    print(f, round(os.path.getsize(os.path.join(OUT, f)) / 1024), "КБ")
