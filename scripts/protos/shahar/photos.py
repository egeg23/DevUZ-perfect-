"""Слои фото прототипа ShahaR.Uz.

python3 -I photos.py <папка с исходниками> <public/protos/shahar> <шрифт Unbounded>

В папке исходников:
  aerial.jpg  — «Aerial view of Tashkent, 2026-05-06 (3)», Bestalex, CC0;
  city.jpg    — «Tashkent, Tashkent City from Hotel Shodlik Palace», Carl Ha, CC BY-SA 4.0;
  img<...>_N.jpg|png — фото объявлений с shahar.uz (ID 149644, 149645, 149727, 149381).
"""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

src, out, font = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)

def save(im, name, q=78):
    im.save(os.path.join(out, name), "WEBP", quality=q, method=6)

# Первый экран: аэросъёмка Ташкента. Тот же кадр — внутри букв SHAHAR в заставке.
a = Image.open(os.path.join(src, "aerial.jpg")).convert("RGB")
a = ImageEnhance.Color(a).enhance(1.08)
save(a.resize((1920, round(1920 * a.height / a.width)), Image.LANCZOS), "hero.webp", 76)
m = a.crop((int(a.width * .22), 0, int(a.width * .22) + int(a.height * .62), a.height))
save(m.resize((900, round(900 * m.height / m.width)), Image.LANCZOS), "hero-m.webp", 74)

c = Image.open(os.path.join(src, "city.jpg")).convert("RGB")
save(c.resize((1920, round(1920 * c.height / c.width)), Image.LANCZOS), "city.webp", 74)

# Объявления: фото как есть, без кадрирования — только размер и формат.
LIST = {"149644": "6ab2195cd7308", "149645": "6ab1fe229e69e", "149727": "699e693f4c801", "149381": "6a7411548d592"}
for lid, key in LIST.items():
    files = sorted(glob.glob(os.path.join(src, f"img{key}_*")), key=lambda f: int(f.rsplit("_", 1)[1].split(".")[0]))
    for n, f in enumerate(files[:6], 1):
        im = Image.open(f).convert("RGB")
        im.thumbnail((720, 960), Image.LANCZOS)
        save(im, f"l{lid}-{n}.webp", 74)

# Иконка приложения: «S» на зелёном их логотипа.
GREEN, GOLD = (74, 99, 46), (232, 178, 76)
def icon(size, pad=0.0, radius=0.22):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if pad == 0.0:
        d.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * radius), fill=GREEN)
    else:
        d.rectangle((0, 0, size, size), fill=GREEN)
    f = ImageFont.truetype(font, int(size * (0.5 if pad == 0.0 else 0.4)))
    box = d.textbbox((0, 0), "S", font=f)
    w, h = box[2] - box[0], box[3] - box[1]
    d.text(((size - w) / 2 - box[0], (size - h) / 2 - box[1] - size * .02), "S", font=f, fill=(250, 247, 240))
    d.rectangle((size * .3, size * .78, size * .7, size * .8), fill=GOLD)
    return im
for s in (192, 512):
    icon(s).save(os.path.join(out, f"icon-{s}.png"))
icon(512, pad=0.1).save(os.path.join(out, "icon-mask-512.png"))
icon(180, pad=0.1).convert("RGB").save(os.path.join(out, "apple-180.png"))
print(sorted(os.listdir(out)))
