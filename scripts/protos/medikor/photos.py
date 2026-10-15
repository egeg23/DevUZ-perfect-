"""Фото товаров Medikor: их собственные снимки с medikor.ru, сохранены в
сборку (public/protos/medikor), не хотлинком.

  python3 -I scripts/protos/medikor/photos.py [папка-кэша]

- карточка (`p-<товар>.webp` 800 px, `p-<товар>-s.webp` 400 px): квадрат на
  белом, товар по центру с полями, как у них в каталоге;
- галерея (`g-<товар>-<n>.webp`): остальные снимки из их карточки, до трёх;
- значки вкладки (`icon-192.png`, `apple-180.png`): их шар знака кодом в gen,
  здесь — дефибриллятор HR-501 на их синем.

Адреса снимков — с карточек medikor.ru, 15.10.2026 (SOURCES.md).
"""
import os, sys, urllib.request
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "../../../public/protos/medikor"))
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out", "src")
os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True)
SITE = "https://medikor.ru/assets/images/products/"

# товар: [снимки по порядку карточки на medikor.ru]
P = {
    "hr501": ["150/1-1.png", "150/2-1.png", "150/3.png"],
    "atm112": ["675/atm-112-1.png", "675/atm-112-2.png", "675/atm-112-3.png"],
    "aedbox": ["683/wap-812-m2b-kv-1.png", "683/wap-812-m2b-kv-2.png", "683/wap-812-m2b-kv-3.png"],
    "dcs103": ["465/1.png", "465/2.png", "465/3.png", "465/4.png"],
    "dcs104": ["466/1.png", "466/2.png", "466/3.png"],
    "dcs105": ["467/1.png", "467/2.png", "467/3.png"],
    "dcs102": ["468/1.png", "468/2.png", "468/3.png"],
    "st511d": ["470/1.png", "470/2.png", "470/3.png"],
    "st511g": ["472/1.png", "472/2.png", "472/3.png"],
    "bpro": ["672/30.10-5020-pro-1.png", "672/30.10-5020-pro-2.png", "672/30.10-5020-pro-3.png"],
    "bbaby": ["673/30.10.5040-1.png", "673/30.10.5040-2.png", "673/30.10.5040-3.png"],
    "bred": ["172/1.png", "172/2.png", "172/3.png", "172/4.png"],
    "bjun": ["674/30.10.5041-1.png", "674/30.10.5041-2.png"],
    "skull11": ["495/drm7005.png"],
    "skull22": ["505/drs1032.png"],
    "brain": ["500/drm7017.png"],
    "skullv": ["504/drs1024.png"],
    "atomer": ["182/1.jpg", "182/2.jpg", "182/3.jpg"],
    "voms": ["475/1.png", "475/2.png", "475/3.png"],
    "l2012": ["665/kd-2012l-1-1.png", "665/kd-2012l-1-2.png", "665/kd-2012l-1-3.png"],
    "stz4": ["667/stz4.png"],
    "l2072": ["669/2072d-2-1.png", "669/2072d-2-2.png", "669/2072d-2-3.png"],
    "l2021": ["670/2021w-1-1.png"],
    "qv500": ["661/01.png", "661/02.png", "661/qv-500-4.png"],
    "qv600": ["662/1.png", "662/2.png", "662/3.png"],
    "qv500m": ["680/2.png", "680/1.png", "680/33.png"],
    "m100": ["671/01.png", "671/02.png", "671/03.png"],
    "t420": ["179/2-1.png", "179/1-1.png"],
    "t650": ["181/1.png", "181/2.png"],
    "med03": ["664/1.png", "664/2.png", "664/3.png", "664/4.png"],
    "z24": ["222/am17-101-15.png"],
    "z21": ["225/am04-204-15.png"],
    "z53": ["229/am04-221-16.png"],
    "z42": ["230/am04-267-26.png"],
    "vt5": ["677/vt5-1.png", "677/vt5-2.png", "677/vt5-3.png"],
    "vt8": ["678/vt8-1.png", "678/vt8-2.png", "678/vt8-3.png"],
    "lb03": ["160/1.png", "160/2.png", "160/3.png"],
    "lb05": ["161/1.png", "161/2.png"],
    "lb07": ["162/1.png", "162/2.png"],
    "lb05x": ["166/1.png", "166/2.png"],
    "needle": ["183/1.png", "183/2.png"],
    "tbandb": ["184/6.png"],
    "tbandk": ["186/6.png"],
    "tdiam": ["187/5.png"],
    "tring": ["190/3.jpg"],
}

def get(path):
    f = os.path.join(CACHE, path.replace("/", "_"))
    if not os.path.exists(f):
        req = urllib.request.Request(SITE + path, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as r, open(f, "wb") as o:
            o.write(r.read())
    return Image.open(f).convert("RGBA")

def square(im, size, pad=.06):
    """Квадрат на белом: прозрачное — белым, товар по центру с полями."""
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255)); bg.alpha_composite(im); im = bg.convert("RGB")
    side = max(im.size); box = round(side * (1 + 2 * pad))
    sq = Image.new("RGB", (box, box), (255, 255, 255)); sq.paste(im, ((box - im.width) // 2, (box - im.height) // 2))
    return sq.resize((size, size), Image.LANCZOS) if box > size else sq

for key, imgs in P.items():
    first = get(imgs[0])
    square(first, 800).save(os.path.join(OUT, f"p-{key}.webp"), "WEBP", quality=80, method=6)
    square(first, 400).save(os.path.join(OUT, f"p-{key}-s.webp"), "WEBP", quality=78, method=6)
    for n, g in enumerate(imgs[1:4]):
        square(get(g), 800).save(os.path.join(OUT, f"g-{key}-{n}.webp"), "WEBP", quality=76, method=6)
    print(key, first.size, len(imgs) - 1)

# Значки вкладки: HR-501 на их синем #194aaa.
aed = get(P["hr501"][0])
aed = aed.crop(Image.eval(aed.convert("L"), lambda v: 255 if v < 244 else 0).getbbox())
for size, name in ((192, "icon-192.png"), (180, "apple-180.png")):
    im = Image.new("RGBA", (size, size), (25, 74, 170, 255))
    if name.startswith("icon"):
        m = Image.new("L", (size, size), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), radius=size // 5, fill=255); im.putalpha(m)
    a = aed.copy(); a.thumbnail((int(size * .7), int(size * .7)), Image.LANCZOS)
    plate = Image.new("RGBA", (a.width + 16, a.height + 16), (0, 0, 0, 0))
    ImageDraw.Draw(plate).rounded_rectangle((0, 0, plate.width - 1, plate.height - 1), radius=14, fill=(255, 255, 255, 255))
    plate.alpha_composite(a, (8, 8))
    im.alpha_composite(plate, ((size - plate.width) // 2, (size - plate.height) // 2))
    im.save(os.path.join(OUT, name))
print("ok")
