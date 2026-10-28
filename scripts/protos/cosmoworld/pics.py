"""Снимки брендов с cosmoworld.uz (блок «Каталог»): их товары на подиуме.

python3 -I pics.py <папка со снимками>

Снимки — их собственные (static.tildacdn.com, 28.10.2026), имена файлов в
папке — как ниже. Пишет public/protos/cosmoworld/br/<бренд>-{720,1400}.webp.
"""
import os, sys
from PIL import Image

SRC = {
    "arnest": "01_1-min.png", "vesna": "04_2_1-min.png", "rashel": "07_3-min.png", "peros": "09_5-min.png",
    "forest": "11_6-min.png", "bily": "14_6_1-min.png", "parachute": "15_-min.png", "brandfree": "17_brandfree-min.jpg",
    "mixit": "18_Frame-min.jpg", "nefis": "20_Nefis-min.jpg",
}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/cosmoworld/br")
os.makedirs(OUT, exist_ok=True)
for k, f in SRC.items():
    im = Image.open(os.path.join(sys.argv[1], f)).convert("RGB")
    for w in (720, 1400):
        if im.width < w and w > 720:
            w = im.width
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(os.path.join(OUT, f"{k}-{'720' if w <= 720 else '1400'}.webp"), "WEBP", quality=78, method=6)
print(sorted(os.listdir(OUT)), file=sys.stderr)
