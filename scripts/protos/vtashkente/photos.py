"""Снимки vtashkente.uz для макета: WebP в public/protos/vtashkente.

python3 -I photos.py <папка с файлами, скачанными с vtashkente.uz/wp-content/uploads>

Только их собственные фото (кухни, шоу-рум, производство, обложки видео) и
логотип. Стоковые картинки с их сайта (монтаж, чаепитие, подарки) не берём.
Список и откуда каждый файл: SOURCES.md.
"""
import os
import sys

from PIL import Image, ImageOps

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/vtashkente")
os.makedirs(OUT, exist_ok=True)


def save(src, name, widths, q=80, crop=None):
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, src))).convert("RGB")
    if crop:
        im = im.crop(crop)
    for w in widths:
        x = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        x.save(os.path.join(OUT, f"{name}-{w}.webp"), "WEBP", quality=q, method=6)


# Первый экран: четыре их кухни, по очереди.
HERO = {
    "h-melburn": "IMG_7723-1-scaled.jpg",
    "h-amsterdam": "20191026_182017-4-scaled.jpg",
    "h-santyago": "photo_2023-01-12_13-51-19.jpg",
    "h-nyu": "photo_2023-01-11_16-55-30-2.jpg",
}
for n, f in HERO.items():
    save(f, n, [1600, 900], q=82)

# Работы: по кадру на кухню.
WORKS = {
    "w-amsterdam": "20191026_182026-3-scaled.jpg",
    "w-nitstsa": "photo_2023-01-11_16-53-39-2.jpg",
    "w-london": "photo_2023-01-11_16-54-46-2.jpg",
    "w-nyu": "photo_2023-01-11_16-55-30-3.jpg",
    "w-melburn": "photo_2023-01-11_16-58-31-2.jpg",
    "w-la": "photo_2023-01-11_16-55-30-4-—-копия.jpg",
    "w-chikago": "photo_2023-01-12_10-01-27-4.jpg",
    "w-santyago": "photo_2023-01-12_13-51-20-2.jpg",
}
for n, f in WORKS.items():
    save(f, n, [1280, 700])

# Примерка: кухня Сантьяго VIP целиком, без уменьшения (контуры фасадов в
# gen.mjs — в пикселях этого кадра 1280×960) и кусок дубового фасада
# Амстердам VIP, отражённый в плитку без шва.
save("photo_2023-01-12_13-51-19.jpg", "try", [1280, 700], q=84)
wood = Image.open(os.path.join(SRC, "20191026_182017-4-scaled.jpg")).convert("RGB").crop((760, 384, 1000, 428))
# Свет на фото падает неровно: делим каждую строку и столбец на их среднюю
# яркость, остаётся рисунок древесины без полос, тон дуба — как в среднем.
px = wood.load()
W, H = wood.size
mean = [sum(px[x, y][c] for x in range(W) for y in range(H)) / (W * H) for c in range(3)]
row = [sum(sum(px[x, y]) for x in range(W)) / W for y in range(H)]
col = [sum(sum(px[x, y]) for y in range(H)) / H for x in range(W)]
tot = sum(row) / H
lift = 1.25
for y in range(H):
    for x in range(W):
        k = tot * tot / (row[y] * col[x]) * lift
        px[x, y] = tuple(min(255, round(px[x, y][c] * k)) for c in range(3))
# Волокна у дуба вертикальные: тянем полосу вверх вчетверо и сшиваем края
# плавным переходом, чтобы плитка повторялась без шва и без «зеркал».
tall = wood.resize((W, H * 4), Image.BICUBIC)
F = 40
tile = tall.crop((0, 0, W - F, H * 4))
tp, sp = tile.load(), tall.load()
for x in range(F):
    a = x / F
    for y in range(H * 4):
        tp[x, y] = tuple(round(sp[W - F + x, y][c] * (1 - a) + sp[x, y][c] * a) for c in range(3))
for y in range(12):
    a = y / 12
    for x in range(tile.width):
        tp[x, y] = tuple(round(tp[x, tile.height - 12 + y][c] * (1 - a) + tp[x, y][c] * a) for c in range(3))
tile = tile.crop((0, 0, tile.width, tile.height - 12))
tile.save(os.path.join(OUT, "wood.webp"), "WEBP", quality=84, method=6)

# Доверие: производство и шоу-рум.
TRUST = {
    "t-ceh": "2023-02-06-01.30.12.jpg",
    "t-stanok": "photo_2023-01-26_14-20-04.jpg",
    "t-shourum": "IMG_4560-1-scaled.jpg",
    "t-obrazcy": "IMG_7735-scaled.jpg",
    "t-vecher": "IMG_4562-scaled.jpg",
}
for n, f in TRUST.items():
    save(f, n, [1280, 700])

# Обложки их видеообзоров на YouTube.
COVERS = {
    "v-minimalizm": "photo_2024-08-11_18-27-58.jpg",
    "v-darhan": "photo_2024-08-11_18-27-53.jpg",
    "v-shpon": "photo_2024-08-11_18-28-01.jpg",
    "v-oybek": "photo_2024-08-11_18-27-56.jpg",
    "v-mirabad": "photo_2024-08-11_18-28-04.jpg",
    "v-kuhnya": "photo_2024-08-11_18-42-47.jpg",
    "v-karandaeva": "maxresdefault.jpg",
    "v-neoklassika": "photo_2024-08-11_18-27-33.jpg",
}
for n, f in COVERS.items():
    save(f, n, [640], q=78)

# Логотип: белый на прозрачном, как у них в шапке.
logo = Image.open(os.path.join(SRC, "2023-01-30-03.15.18.png")).convert("RGBA")
logo.save(os.path.join(OUT, "logo.webp"), "WEBP", quality=90, method=6)
logo.resize((500, 112), Image.LANCZOS).save(os.path.join(OUT, "logo-500.webp"), "WEBP", quality=90, method=6)

# Значок вкладки: их знак V в круге.
fav = Image.open(os.path.join(SRC, "cropped-fav.png")).convert("RGBA")
fav.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, "icon-192.png"))
bg = Image.new("RGBA", (180, 180), (255, 255, 255, 255))
bg.alpha_composite(fav.resize((180, 180), Image.LANCZOS))
bg.convert("RGB").save(os.path.join(OUT, "apple-180.png"))
print("ok", len(os.listdir(OUT)))
