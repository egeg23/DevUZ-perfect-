"""Их снимки с soffice.uz в WebP для макета: python3 -I photos.py <папка выгрузки>.

В папке выгрузки — raw/ (главная) и bcimg/ (страницы БЦ), имена как при
скачивании: <tild-префикс>_<имя файла>. Сами выгрузки в репозиторий не кладём,
готовые WebP — в public/protos/soffice.
"""
import os
import sys
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/soffice")
os.makedirs(OUT, exist_ok=True)


def find(sub, part):
    for f in sorted(os.listdir(os.path.join(SRC, sub))):
        if part in f:
            return os.path.join(SRC, sub, f)
    raise SystemExit("нет " + part)


def save(im, name, width, q=74):
    im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") and name.startswith(("l-", "logo", "icon", "apple")) else im.convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name), "WEBP" if name.endswith(".webp") else "PNG", quality=q, method=6)
    return im.size


def crop(im, ratio):
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio)
        return im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    nh = round(w / ratio)
    return im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))


# Фасады БЦ: первый кадр со страницы каждого центра, 16:10.
BC = {
    "grossplaza": "grossplaza__tild6264", "sapphire": "sapphire__tild3764", "forum": "forum__tild3139",
    "trilliant": "trilliant__tild6164", "dream": "dream__tild3832", "nestone": "nestone__tild6436",
    "modera": "modera__tild3662", "infinity": "infinity__tild3062-653", "orient": "orient__tild6435",
    "platform": "platform__tild6538", "kayan": "kayan__tild3535", "novaplaza": "novaplaza__tild3761",
    "businesspark": "businesspark__tild3432", "solidpremium": "solidpremium__tild3866", "newera": "newera__tild3939",
    "panoramic": "panoramic__tild6236", "ventumplaza": "ventumplaza__tild6438", "novaminor": "novaminor__tild3530",
}
for k, part in BC.items():
    im = crop(Image.open(find("bcimg", part)), 1.6)
    for w in (960, 560):
        print(k, w, save(im, f"b-{k}-{w}.webp", w))

# Первый экран: четыре башни во весь экран.
for k, part in {"nestone": "nestone__tild6436", "trilliant": "trilliant__tild6164", "forum": "forum__tild3139", "sapphire": "sapphire__tild3764"}.items():
    im = Image.open(find("bcimg", part))
    for w in (1600, 900):
        print("hero", k, w, save(im, f"h-{k}-{w}.webp", w, 72))
    print("hero-m", k, save(crop(im, 0.62), f"h-{k}-m.webp", 640, 70))

# Интерьеры: схема этажа, калькулятор, просмотр.
for k, part in {"open": "tild3964-323_IMG_0813", "lobby": "tild3463-643_IMG_6035", "cab": "tild3537-666_IMG_4884", "meet": "tild3062-336_IMG_6088"}.items():
    im = Image.open(find("raw", part))
    for w in (1280, 700):
        print("in", k, w, save(im, f"i-{k}-{w}.webp", w, 72))

# Отзывы: фото авторов с их сайта.
for k, part in {"babaev": "babaev", "hashimov": "noroot", "rahmanov": "tild3137-383", "agzamov": "agzamov", "kramers": "kramers"}.items():
    im = crop(Image.open(find("raw", part)).convert("RGB"), 1)
    print("rv", k, save(im, f"r-{k}.webp", 160))

# Логотипы арендаторов: как на их сайте, по ширине 240.
logos = [f for f in sorted(os.listdir(os.path.join(SRC, "raw"))) if f.endswith("__1.png")]
for i, f in enumerate(logos):
    im = Image.open(os.path.join(SRC, "raw", f)).convert("RGBA")
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    im.thumbnail((240, 96), Image.LANCZOS)
    im.save(os.path.join(OUT, f"l-{i + 1:02d}.webp"), "WEBP", quality=88, method=6)
    print("logo", i + 1, f, im.size)

# Знак и значки вкладки.
logo = Image.open(find("raw", "Soffice-logo")).convert("RGBA")
logo.save(os.path.join(OUT, "logo.webp"), "WEBP", quality=92, method=6)
fav = Image.open(find("raw", "Favicon_orange")).convert("RGBA")
fav.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, "apple-180.png"))
fav.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, "icon-192.png"))
