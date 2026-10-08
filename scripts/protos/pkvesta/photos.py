"""Изображения прототипа ПК «Веста» (pkvesta.kz).

python3 -I photos.py <папка с исходниками> <public/protos/pkvesta>

Все снимки — с pkvesta.kz, раздел «Наши объекты»: визуализации их же
системы WebSteel® (1920×1080). Ничего не рисовали нейросетью.
  o213_*.jpg — 213. Фруктохранилище 56Ш × 76Д × 8В из ЛСТК, Астана;
  o203_*.jpg — 203. Ледовая арена 30Ш × 80Д × 6В из ЛСТК, Ташкент;
  o199_*.png — 199. Спортивный зал 24Ш × 62Д × 6В из ЛСТК, Ташкент;
  o217_*.jpg — 217. Склад/магазин 24Ш × 60Д × 10В из ГИБРИДа, Москва;
  o204_*.jpg — 204. Цех 28Ш × 102Д × 7.2В, с. Кущёвская.
Чертёж первого экрана — каркас 213 (o213_2), перекрашенный в синьку:
линии каркаса светлые на тёмно-синем, как на листе КМ.
"""
import sys, os, glob
from PIL import Image, ImageFilter, ImageChops, ImageOps, ImageDraw

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

def save(im, name, q=78):
    im.save(os.path.join(out, name), "WEBP", quality=q, method=6)

NAVY = (14, 27, 56)
LINE = (190, 214, 255)

def blueprint(im):
    g = ImageOps.grayscale(im)
    bg = g.filter(ImageFilter.GaussianBlur(28))
    d = ImageChops.subtract(bg, g)            # каркас темнее фона — станет светлым
    d = d.point(lambda v: min(255, int(v * 5.5)))
    d = d.filter(ImageFilter.GaussianBlur(0.6))
    base = Image.new("RGB", im.size, NAVY)
    line = Image.new("RGB", im.size, LINE)
    pic = Image.composite(line, base, d)
    # сетка листа
    dr = ImageDraw.Draw(pic)
    step = 48
    for x in range(0, im.width, step):
        dr.line([(x, 0), (x, im.height)], fill=(24, 42, 82), width=1)
    for y in range(0, im.height, step):
        dr.line([(0, y), (im.width, y)], fill=(24, 42, 82), width=1)
    return Image.composite(line, pic, d)

# Кадр без логотипа в углу: у визуализаций 213 знак ПК Веста сверху слева.
def crop213(im):
    return im.crop((0, 200, 1920, 1000))     # 1920×800, здание целиком

frame = Image.open(os.path.join(src, "o213_2.jpg")).convert("RGB")
bp = blueprint(frame)

# Первый экран: чертёж. На телефоне — правая половина здания крупнее.
hero = crop213(bp)
save(hero.resize((1920, 800), Image.LANCZOS), "hero.webp", 76)
m = bp.crop((560, 110, 560 + 820, 990))      # без светлой полосы внизу кадра
save(m, "hero-m.webp", 74)

# Сцена сборки и мини-здания отраслей рисуются кодом (assembly.js, gen.mjs):
# кадров для них нет.

# Объекты: снимки как есть, только размер и формат.
for oid in ("213", "203", "199", "217", "204"):
    files = sorted(glob.glob(os.path.join(src, f"o{oid}_*")), key=lambda f: int(f.rsplit("_", 1)[1].split(".")[0]))
    for n, f in enumerate(files[:6], 1):
        im = Image.open(f).convert("RGB")
        im.thumbnail((1280, 720), Image.LANCZOS)
        save(im, f"o{oid}-{n}.webp", 74)

# Значок вкладки: домик с жёлтыми воротами, как в их логотипе.
def icon(size):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = size / 100
    P = lambda pts: [(x * s, y * s) for x, y in pts]
    d.polygon(P([(50, 6), (94, 46), (84, 46), (84, 94), (16, 94), (16, 46), (6, 46)]), fill=(44, 74, 148))
    d.rectangle(P([(28, 50), (72, 86)]), fill=(255, 255, 255))
    d.polygon(P([(26, 40), (70, 36), (74, 62), (30, 66)]), fill=(214, 224, 28))
    return im
icon(192).save(os.path.join(out, "icon-192.png"))
icon(180).convert("RGB").save(os.path.join(out, "apple-180.png"))
print(sorted(os.listdir(out)))
