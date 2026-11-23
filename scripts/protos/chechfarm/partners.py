"""Логотипы партнёров CZECHFARM для бегущей строки (gen.mjs, partnersBlock).

python3 partners.py <папка с исходниками>

Исходники — настоящие логотипы: с прежнего сайта компании czechfarm.uz
(«Партнёры») и с сайтов самих производителей; сюда не рисуем и не генерируем.
Каждый файл <ключ>.png|.webp|.jpg|.svg из LIST: растр обрезается по краю,
белый фон становится прозрачным, высота — не больше 120 точек, WebP без потерь;
SVG копируется как есть (без скриптов). Пишет public/protos/chechfarm/partners
и partners.json (порядок, имя, размер)."""
import json, os, re, sys
from PIL import Image

LIST = [
    ("ilko", "ILKO İlaç"), ("deva", "DEVA Holding"), ("donga", "Dong-A ST"), ("wooshin", "Wooshin Labottach"),
    ("mt", "MT Sağlık Ürünleri"), ("biopolus", "Biopolus"), ("windmill", "Windmill Health Products"), ("catalysis", "Catalysis"),
    ("medroad", "MedRoad"), ("medochemie", "Medochemie"), ("platin", "Platin Kimya"), ("abdi", "Abdi İbrahim"),
    ("genuone", "GenuOne Sciences"), ("bcworld", "BCWorld Pharm"), ("daihan", "Dai Han Pharm"), ("saba", "Saba İlaç"),
    ("rion", "Ріон"), ("proxima", "PROXIMA Research"), ("apteka-ua", "Аптека.UA"), ("umj", "Український медичний часопис"), ("compendium", "Компендіум"),
]
SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "../../../public/protos/chechfarm/partners")
os.makedirs(OUT, exist_ok=True)
H = 120
out = []
for key, name in LIST:
    src = next((os.path.join(SRC, key + e) for e in (".svg", ".png", ".webp", ".jpg", ".jpeg") if os.path.exists(os.path.join(SRC, key + e))), None)
    if not src:
        print("нет логотипа:", key); continue
    if src.endswith(".svg"):
        svg = open(src, encoding="utf8").read()
        if re.search(r"<script|on\w+=|javascript:|<foreignObject", svg, re.I):
            print("SVG со скриптом, пропуск:", key); continue
        m = re.search(r'viewBox="[\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.]+)[ ,]+([\d.]+)"', svg)
        w, h = (float(m.group(1)), float(m.group(2))) if m else (200, 60)
        open(os.path.join(OUT, key + ".svg"), "w", encoding="utf8").write(svg)
        out.append({"key": key, "name": name, "file": key + ".svg", "w": round(w * H / h), "h": H}); continue
    im = Image.open(src).convert("RGBA")
    px = im.load()
    # Белый фон — прозрачный (только почти белые точки).
    if im.getextrema()[3][0] == 255:
        for y in range(im.height):
            for x in range(im.width):
                r, g, b, a = px[x, y]
                if r > 245 and g > 245 and b > 245: px[x, y] = (255, 255, 255, 0)
    box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if box: im = im.crop(box)
    if im.height > H: im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
    im.save(os.path.join(OUT, key + ".webp"), "WEBP", lossless=True, method=6)
    out.append({"key": key, "name": name, "file": key + ".webp", "w": im.width, "h": im.height})
json.dump(out, open(os.path.join(ROOT, "partners.json"), "w"), ensure_ascii=False, indent=1)
print("логотипов:", len(out))
