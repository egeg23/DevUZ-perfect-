"""Фото товаров tovar.uz в WebP для макета.

Снимки — с их же карточек (tovar.uz/images/company/.../o_*.{png,jpg,webp},
оригиналы, 18.10.2026), выгрузка лежит в src/ и в репозиторий не идёт.
  p-<id>.webp — карточка: квадрат 560 на белом, как на их сайте;
  c-<id>.webp — первый экран: белый фон снят заливкой от краёв, прозрачный.
Запуск: python3 -I photos.py <папка с выгрузкой>
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[3] / "public/protos/tovar"
OUT.mkdir(parents=True, exist_ok=True)
CUT = ["113945", "113947", "113844", "127572", "130426", "130576", "113755", "113670", "113918", "129337", "118414"]


def card(im, n=560):
    im = im.convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    im = Image.alpha_composite(bg, im).convert("RGB")
    im.thumbnail((n - 48, n - 48), Image.LANCZOS)
    sq = Image.new("RGB", (n, n), (255, 255, 255))
    sq.paste(im, ((n - im.width) // 2, (n - im.height) // 2))
    return sq


# Знак марки в углу снимка стоит вплотную к товару: верх кадра закрашивается белым.
TOP = {"113945": 0.1, "113947": 0.1, "113918": 0.1, "113755": 0.1}


def cutout(im, pid, n=720):
    im = im.convert("RGB")
    w, h = im.size
    if pid in TOP:
        ImageDraw.Draw(im).rectangle((0, 0, w, int(h * TOP[pid])), fill=(255, 255, 255))
    mask = Image.new("L", (w + 2, h + 2), 0)
    big = Image.new("RGB", (w + 2, h + 2), (255, 255, 255))
    big.paste(im, (1, 1))
    ImageDraw.floodfill(big, (0, 0), (255, 0, 255), thresh=34)
    px = big.load()
    m = mask.load()
    for y in range(h + 2):
        for x in range(w + 2):
            m[x, y] = 0 if px[x, y] == (255, 0, 255) else 255
    mask = mask.crop((1, 1, w + 1, h + 1)).filter(ImageFilter.MinFilter(3))
    # Знак марки над товаром (Samsung, LG, Artel, POCO) отделён от товара пустой
    # полосой: всё, что выше первой пустой полосы в верхней пятой части, снимается.
    mp = mask.load()
    rows = [any(mp[x, y] for x in range(0, w, 2)) for y in range(h)]
    seen, gap = False, 0
    for y in range(h // 5):
        if rows[y]:
            if gap > 3 and seen:
                for yy in range(y):
                    for x in range(w):
                        mp[x, yy] = 0
                break
            seen, gap = True, 0
        elif seen:
            gap += 1
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA")
    out.putalpha(mask)
    out = out.crop(mask.getbbox())
    out.thumbnail((n, n), Image.LANCZOS)
    return out


for f in sorted(SRC.iterdir()):
    pid = f.stem
    im = Image.open(f)
    card(im).save(OUT / f"p-{pid}.webp", "WEBP", quality=80, method=6)
    if pid in CUT:
        cutout(im, pid).save(OUT / f"c-{pid}.webp", "WEBP", quality=82, method=6)
    print(pid, im.size)

logo = Image.open(SRC.parent / "logo.png").convert("RGBA")
logo.thumbnail((468, 135), Image.LANCZOS)
logo.save(OUT / "logo.webp", "WEBP", quality=90, method=6)
