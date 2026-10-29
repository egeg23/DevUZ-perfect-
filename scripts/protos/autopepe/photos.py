"""Их фото «przed / po» с autopepe.pl → WebP для сравнения шторкой.

Запуск: python3 -I photos.py <папка со скачанными jpg>
Берём два снимка, где «до» и «после» сняты одной рамкой и это их работа:
капот после града (usuwanie-wgniecen.jpg) и диск (renowacja-felg-aluminiowych.jpg).
Половины режутся по рамке с их сайта, подписи под кадром отрезаются.
Растягивать не будем: показ не шире половины исходника (на экране с
плотностью 2 это тот же пиксель в пиксель).
"""
import sys
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).parent / "../../../public/protos/autopepe/p"
OUT.mkdir(parents=True, exist_ok=True)

CUTS = {
    "hood": ("usuwanie-wgniecen.jpg", (12, 6, 766, 602), (780, 6, 1534, 602)),
    "rim": ("renowacja-felg-aluminiowych.jpg", (10, 10, 706, 796), (718, 10, 1414, 796)),
}
for name, (f, a, b) in CUTS.items():
    im = Image.open(SRC / f).convert("RGB")
    for side, box in (("a", a), ("b", b)):
        part = im.crop(box)
        part.save(OUT / f"{name}-{side}.webp", "WEBP", quality=90, method=6)
        print(name, side, part.size)
