"""Фото Karomat для макета: их собственные снимки, в WebP.

Откуда (SOURCES.md):
  src/prod/<id>.jpg|png — фото блюд из меню их сайта (API karomat.felixits.uz,
                           которое читает karomat-restaurant.uz/menu);
  src/site/*            — картинки с karomat-restaurant.uz/images;
  src/yt/<id>-oar2.jpg  — обложки их Shorts с youtube.com/@Karomat_restaurant.
src/ в репозиторий не кладём (70 МБ): готовые WebP лежат в public/protos/karomat.

    python3 -I scripts/protos/karomat/photos.py <папка src>

Что получается:
  d-<id>.webp     — блюдо 600 px по ширине, для меню и карточки;
  p-<id>.webp     — блюдо для сцены «дастархан»: вырезан овал вокруг тарелки,
                    края растворяются в прозрачность, стол под ним свой;
  yt-<id>.webp    — обложка Shorts 360×640;
  logo.webp, icon-192.png, apple-180.png — их знак с сайта.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFilter

SRC = sys.argv[1] if len(sys.argv) > 1 else "src"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "../../../public/protos/karomat")
os.makedirs(OUT, exist_ok=True)

def src(name):
    for ext in ("jpg", "png", "jpeg"):
        p = os.path.join(SRC, "prod", f"{name}.{ext}")
        if os.path.exists(p):
            return p
    return None

# Блюда меню: все, у которых есть цена или варианты.
menu = json.load(open(os.path.join(HERE, "menu-src.json")))
n = 0
for it in menu["items"]:
    p = src(it["id"])
    if not p:
        continue
    im = Image.open(p).convert("RGB")
    w = 600
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, f"d-{it['id']}.webp"), "WEBP", quality=72, method=6)
    n += 1
print("блюд:", n)

# Тарелки для сцены: рамка вокруг тарелки (доли ширины и высоты снимка),
# внутри неё овал с мягким краем. Стол сцены почти чёрный, как фон их съёмки,
# поэтому край растворяется без ореола.
PLATES = {
    3789: (0.03, 0.36, 0.99, 0.96),  # Ассорти от Шефа: длинная доска
    3745: (0.14, 0.00, 0.88, 0.93),  # Шурпа
    3771: (0.06, 0.00, 0.94, 0.86),  # Уйгурча лагмон
    3767: (0.12, 0.24, 0.92, 0.93),  # Ток долма
    3758: (0.07, 0.12, 0.96, 0.93),  # Нохот шорак
    3818: (0.10, 0.12, 0.99, 0.95),  # Сан-себастиян
    3764: (0.12, 0.08, 0.96, 0.97),  # Табака
    3750: (0.00, 0.08, 0.96, 0.99),  # Тандир ассорти
    3781: (0.18, 0.18, 1.00, 0.99),  # Искандар
}
for pid, (x0, y0, x1, y1) in PLATES.items():
    im = Image.open(src(pid)).convert("RGB")
    W, H = im.size
    box = (round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H))
    im = im.crop(box)
    long = 820
    k = long / max(im.size)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    m = Image.new("L", im.size, 0)
    pad = 0.09
    ImageDraw.Draw(m).ellipse((im.width * pad, im.height * pad, im.width * (1 - pad), im.height * (1 - pad)), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(min(im.size) * 0.04))
    im.putalpha(m)
    im.save(os.path.join(OUT, f"p-{pid}.webp"), "WEBP", quality=74, method=6)
print("тарелок:", len(PLATES))

# Обложки их Shorts: вертикальные 9:16.
for vid in ["FRk4jQr8EPQ", "wmBCzrHgQWQ", "QwgbFC56oCA", "ME9ktNqbSjE", "1xF1EhZ8FfA"]:
    im = Image.open(os.path.join(SRC, "yt", f"{vid}-oar2.jpg")).convert("RGB")
    im = im.resize((360, 640), Image.LANCZOS)
    im.save(os.path.join(OUT, f"yt-{vid}.webp"), "WEBP", quality=72, method=6)

# Знак: золотой круг с монограммой K с их сайта (500×500, прозрачный фон).
logo = Image.open(os.path.join(SRC, "site", "karomat-logo.png")).convert("RGBA")
logo.resize((320, 320), Image.LANCZOS).save(os.path.join(OUT, "logo.webp"), "WEBP", quality=86, method=6)
for size, name in ((192, "icon-192.png"), (180, "apple-180.png")):
    bg = Image.new("RGBA", (size, size), (20, 18, 16, 255))
    lg = logo.resize((round(size * 0.86), round(size * 0.86)), Image.LANCZOS)
    bg.alpha_composite(lg, ((size - lg.width) // 2, (size - lg.height) // 2))
    bg.convert("RGB").save(os.path.join(OUT, name), "PNG", optimize=True)
print("готово:", OUT)
