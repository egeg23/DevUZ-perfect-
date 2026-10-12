"""Атлас подарков и боксов Giftora из листов gpt-image-1.5 (2x2 на листе).

Листы s1..s7 (1024x1024, прозрачный фон) лежат вне репозитория: python3
atlas.py <каталог с листами>. Каждый предмет вырезается по непрозрачной
части, ставится по центру клетки CELL px, всё собирается в один WebP:
один запрос вместо 28 (урок enotmebel: nginx отдаёт 429 на залп картинок).
Порядок клеток повторяет ORDER в app.js.
"""
import sys
from PIL import Image

SRC = sys.argv[1]
OUT = __file__.rsplit("/", 1)[0] + "/../../../public/protos/giftora/atlas.webp"
CELL, COLS = 320, 7
SHEETS = [
    ["lolli", "cake", "candle", "flame"],
    ["clover", "peach", "star", "bear"],
    ["lamp", "rose", "frog", "trophy"],
    ["potion", "gem", "ring", "watch"],
    ["helmet", "cap", "crown", "locket"],
    ["cat", "box-free", "box-start", "box-sweet"],
    ["box-farm", "box-luck", "box-night", "box-legend"],
]
ORDER = [n for s in SHEETS for n in s]
atlas = Image.new("RGBA", (CELL * COLS, CELL * ((len(ORDER) + COLS - 1) // COLS)), (0, 0, 0, 0))
for si, names in enumerate(SHEETS):
    sheet = Image.open(f"{SRC}/s{si + 1}.png").convert("RGBA")
    for qi, name in enumerate(names):
        q = sheet.crop(((qi % 2) * 512, (qi // 2) * 512, (qi % 2) * 512 + 512, (qi // 2) * 512 + 512))
        box = q.getchannel("A").point(lambda a: 255 if a > 60 else 0).getbbox()
        obj = q.crop(box)
        scale = CELL * 0.86 / max(obj.size)
        obj = obj.resize((max(1, round(obj.width * scale)), max(1, round(obj.height * scale))), Image.LANCZOS)
        i = ORDER.index(name)
        x, y = (i % COLS) * CELL + (CELL - obj.width) // 2, (i // COLS) * CELL + (CELL - obj.height) // 2
        atlas.alpha_composite(obj, (x, y))
# Почти прозрачная дымка вокруг предметов весит больше самих предметов: срезаем.
alpha = atlas.getchannel("A").point(lambda v: 0 if v < 28 else v)
clean = Image.new("RGBA", atlas.size, (0, 0, 0, 0))
clean.paste(Image.merge("RGBA", (*atlas.split()[:3], alpha)), mask=alpha.point(lambda v: 255 if v else 0))
rows = atlas.height // CELL
clean.save(OUT, "WEBP", quality=78, method=6, alpha_quality=70)
# Лёгкий атлас для списков: клетка вдвое меньше, грузится первым.
clean.resize((COLS * CELL // 2, rows * CELL // 2), Image.LANCZOS).save(OUT.replace("atlas.webp", "atlas-s.webp"), "WEBP", quality=82, method=6, alpha_quality=70)
print(OUT, atlas.size, ",".join(ORDER))
