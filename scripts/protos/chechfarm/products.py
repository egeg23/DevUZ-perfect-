"""Картинки страницы «Продукты» боевого сайта CZECHFARM.

python3 -I products.py <папка вырезок> <папка Higgsfield>

Вырезки — упаковки со снимков компании без фона (rembg isnet-general-use,
логотип CZECHFARM с рамки снимка закрашен, маска коробки — выпуклая
оболочка): <key>.png по ключам из app/lib/catalog.mjs. Сами коробки не
генерируются: модель портит надписи и дозировки на упаковке.
Higgsfield (nano banana 2.1, 2k): bg-<направление>.png — пустой подиум
4:5, hero.png 16:9 и hero-m.png 9:16 — стеклянные подиумы шапки.
Исходники — вне репозитория.
"""
import sys
from pathlib import Path
from PIL import Image

CUT, GEN = Path(sys.argv[1]), Path(sys.argv[2])
OUT = Path(__file__).resolve().parents[3] / "public/protos/chechfarm/products"
OUT.mkdir(parents=True, exist_ok=True)


def save(im, name, side, q=82):
    x = im.copy()
    x.thumbnail((side, side), Image.LANCZOS)
    p = OUT / f"{name}-{side}.webp"
    x.save(p, "WEBP", quality=q, method=6)
    print(p.name, x.size, p.stat().st_size)


for f in sorted(CUT.glob("*.png")):
    im = Image.open(f).convert("RGBA")
    im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())
    for side in (480, 960):
        save(im, f.stem, side)

for area in ("neuro", "cardio", "uro", "women", "endo", "care"):
    im = Image.open(GEN / f"{area}.png").convert("RGB")
    for side in (700, 1100):
        save(im, f"bg-{area}", side, 78)

for name, sides in (("hero", (1400, 2400)), ("hero-m", (1080, 1600))):
    im = Image.open(GEN / f"{name}.png").convert("RGB")
    for side in sides:
        save(im, name, side, 78)
