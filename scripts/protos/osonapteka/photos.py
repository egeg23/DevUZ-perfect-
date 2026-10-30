"""Фото лекарств Oson Apteka → WebP: python3 -I photos.py → photos.json.

Фото — с их сайта (ref2.osonapteka.uz, те же, что у них в каталоге).
Белый фон срезается в прозрачность по краю (заливкой от углов), чтобы
упаковка стояла на стекле макета. Кладёт public/protos/osonapteka/p/<n>-<w>.webp.
"""
import io, json, os, urllib.request
from PIL import Image, ImageDraw

DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DIR, "../../../public/protos/osonapteka/p")
os.makedirs(OUT, exist_ok=True)
cat = json.load(open(os.path.join(DIR, "catalog.json")))
res = {}
for n, it in enumerate(cat["items"]):
    raw = urllib.request.urlopen(urllib.request.Request(it["img"], headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read()
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    # белый фон от углов — прозрачный
    bg = im.copy().convert("RGB")
    for c in [(0, 0), (bg.width - 1, 0), (0, bg.height - 1), (bg.width - 1, bg.height - 1)]:
        if min(bg.getpixel(c)) > 235:
            ImageDraw.floodfill(bg, c, (255, 0, 255), thresh=18)
    a = im.split()[3].copy()
    px, pa = bg.load(), a.load()
    for y in range(bg.height):
        for x in range(bg.width):
            if px[x, y] == (255, 0, 255):
                pa[x, y] = 0
    im.putalpha(a)
    box = im.getbbox() or (0, 0, im.width, im.height)
    im = im.crop(box)
    sizes = []
    for w in (400, 800):
        if im.width < w and w != 400:
            continue
        k = min(1, w / im.width)
        r = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        r.save(os.path.join(OUT, f"{n}-{w}.webp"), "WEBP", quality=88, method=6)
        sizes.append(w)
    res[it["slug"]] = {"n": n, "w": im.width, "h": im.height, "sizes": sizes}
    print(n, it["name"], im.size, sizes)
json.dump(res, open(os.path.join(DIR, "photos.json"), "w"), indent=1)
