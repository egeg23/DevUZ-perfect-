"""Изображения прототипа LIDER PROF PROEKT (lider-prof.uz).

python3 -I photos.py <папка с исходниками> <public/protos/lider-prof>

В папке с исходниками:
  img/<id>_<n>.<ext> — снимки проектов с lider-prof.uz (раздел «Проекты»,
    их же API: mainImageUrl и assets), n = 0 — главный кадр проекта;
  partners/<id>.<ext> — логотипы из блока «Нам доверяют»;
  projects.json — ответ их API со списком проектов (размер кадров берём
    из самих файлов).

Ничего не рисовали нейросетью и не увеличивали: каждый файл не шире
исходника. Чертёж для главы «Чертёж становится зданием» — их же рендер
спорткорпуса (проект 64), из которого кодом выделены линии фасада.
"""
import sys, os, glob, json
from PIL import Image, ImageFilter, ImageChops, ImageOps, ImageDraw

Image.MAX_IMAGE_PIXELS = None
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)


def save(im, name, q=74):
    im.save(os.path.join(out, name), "WEBP", quality=q, method=6)


def fit(im, w):
    return im if im.width <= w else im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)


def open_rgb(path):
    im = Image.open(path)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[3])
        return bg
    return im.convert("RGB")


def find(name):
    g = glob.glob(os.path.join(src, "img", name + ".*"))
    return g[0] if g else None


# ── Первый экран: генплан Олимпийского центра (проект 64, 5500 × 3093). ──
hero = open_rgb(find("64_0"))
save(fit(hero, 2560), "hero-2560.webp", 64)
save(fit(hero, 1440), "hero-1440.webp", 72)

# Кадр внутри букв заставки: кампус МГТУ им. Баумана (проект 63).
save(fit(open_rgb(find("63_1")), 1400), "logo-pic.webp", 74)

# ── Чертёж → здание: спорткорпус (проект 64, кадр 2). ──
fac = open_rgb(find("64_2")).resize((1920, 1080), Image.LANCZOS)
save(fac, "facade-1920.webp", 74)
g = ImageOps.grayscale(fac)
s = fac.convert("HSV").split()[1]
# Линии — там, где серые фасады; зелень и небо почти гаснут.
keep = s.point(lambda x: 255 if x < 55 else (90 if x < 90 else 25)).filter(ImageFilter.GaussianBlur(4))
bl = g.filter(ImageFilter.GaussianBlur(3))
d1 = ImageChops.subtract(bl, g).point(lambda x: min(255, int(max(0, x - 4) * 12)))
d2 = ImageChops.subtract(g, bl).point(lambda x: min(255, int(max(0, x - 6) * 6)))
lines = ImageChops.multiply(ImageChops.lighter(d1, d2), keep)
sheet = Image.new("RGB", fac.size, (18, 24, 33))
dr = ImageDraw.Draw(sheet)
for x in range(0, 1920, 40):
    dr.line([(x, 0), (x, 1080)], fill=(26, 34, 46))
for y in range(0, 1080, 40):
    dr.line([(0, y), (1920, y)], fill=(26, 34, 46))
bp = Image.composite(Image.new("RGB", fac.size, (226, 234, 244)), sheet, lines)
save(bp, "draft-1920.webp", 72)

# ── Внутри: спортзал школы (74, кадр 3), зал детского сада (62, кадр 4). ──
save(open_rgb(find("74_3")), "in-gym-1448.webp", 76)
# Просмотр 360°: игровой зал детского сада (62, кадр 3).
save(open_rgb(find("62_3")), "pano-1500.webp", 76)
save(open_rgb(find("62_4")), "in-hall-1280.webp", 76)

# ── Ландшафт: махалля «Qadrdon» сверху (65, кадр 1), квадрат для поворота. ──
land = open_rgb(find("65_1"))
side = min(land.size)
land = land.crop(((land.width - side) // 2, (land.height - side) // 2, (land.width + side) // 2, (land.height + side) // 2))
save(fit(land, 1400), "land-1400.webp", 64)

# ── Проекты: превью 640 и кадр 1280 (не шире исходника). ──
projects = json.load(open(os.path.join(src, "projects.json"), encoding="utf-8"))["result"]["data"]
sizes = {}
for f in sorted(glob.glob(os.path.join(src, "img", "*_*.*"))):
    base = os.path.basename(f).rsplit(".", 1)[0]
    if base.startswith("slider") or int(base.split("_")[1]) > 4:
        continue
    im = open_rgb(f)
    sizes[base] = im.size
    save(fit(im, 640), f"p-{base}-640.webp", 64)
    if im.width > 760:
        save(fit(im, 1280), f"p-{base}-1280.webp", 64)
json.dump(sizes, open(os.path.join(os.path.dirname(__file__), "sizes.json"), "w"), indent=0, sort_keys=True)

# ── Логотипы «Нам доверяют»: на белой плашке 320 × 180, по центру. ──
for f in glob.glob(os.path.join(src, "partners", "*.*")):
    pid = os.path.basename(f).rsplit(".", 1)[0]
    im = open_rgb(f)
    # Обрезать белые поля вокруг знака.
    diff = ImageChops.difference(im, Image.new("RGB", im.size, (255, 255, 255))).convert("L").point(lambda v: 255 if v > 18 else 0)
    box = diff.getbbox()
    if box:
        im = im.crop(box)
    im.thumbnail((260, 130), Image.LANCZOS)
    tile = Image.new("RGB", (320, 180), (255, 255, 255))
    tile.paste(im, ((320 - im.width) // 2, (180 - im.height) // 2))
    save(tile, f"c-{pid}.webp", 80)


# ── Значок вкладки: перечёркнутая «O» из их логотипа на графите. ──
def icon(size):
    im = Image.new("RGBA", (size, size), (17, 18, 21, 255))
    d = ImageDraw.Draw(im)
    s = size / 100
    d.rounded_rectangle([18 * s, 26 * s, 82 * s, 74 * s], radius=24 * s, outline=(255, 255, 255), width=round(11 * s))
    d.line([(60 * s, 18 * s), (74 * s, 32 * s)], fill=(215, 38, 43), width=round(9 * s))
    return im


icon(192).save(os.path.join(out, "icon-192.png"))
icon(180).convert("RGB").save(os.path.join(out, "apple-180.png"))
print(len(os.listdir(out)), "файлов")
