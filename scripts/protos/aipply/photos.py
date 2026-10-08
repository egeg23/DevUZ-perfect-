"""Изображения прототипа Aipply Academy (aipply.uz).

python3 -I photos.py <папка с исходниками> <public/protos/aipply>

Исходники — с aipply.uz (Tilda), скачаны 08.10.2026:
  3830-…_noroot.png — преподаватель с ноутбуком «Texnik bilimlaringizni
  rivojlantiring!», 1680×2020, фон уже прозрачный.
Значки вкладки — знак Aipply, нарисованный по их логотипу (share.jpg).
Нейросетью ничего не рисовали.
"""
import sys, os, glob
from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

def save(im, name, q=80):
    im.save(os.path.join(out, name), "WEBP", quality=q, method=6)

t = Image.open(glob.glob(os.path.join(src, "*3830*noroot.png"))[0]).convert("RGBA")
t = t.crop(t.split()[-1].getbbox())
for w, name in ((1200, "teacher.webp"), (720, "teacher-m.webp")):
    save(t.resize((w, round(t.height * w / t.width)), Image.LANCZOS), name)

# Знак: три полосы, координаты как в gen.mjs (MK), рисунок −190…190 × −272…272.
A = [(-41, -229), (-17, -265), (181, -24), (-126, -74), (-101, -117), (71, -89)]
B = [(-142, -47), (168, 1), (144, 45), (-166, -4)]
C = [(-182, 23), (126, 71), (102, 115), (-72, 87), (41, 221), (16, 265)]
def icon(size, bg):
    k = 4
    im = Image.new("RGBA", (size * k, size * k), bg)
    d = ImageDraw.Draw(im)
    s = size * k * 0.62 / 544
    cx = cy = size * k / 2
    for poly, col in ((A, (0, 0, 176)), (B, (0, 112, 208)), (C, (0, 160, 224))):
        d.polygon([(cx + x * s, cy + y * s) for x, y in poly], fill=col)
    return im.resize((size, size), Image.LANCZOS)
icon(192, (255, 255, 255, 255)).save(os.path.join(out, "icon-192.png"))
icon(180, (255, 255, 255, 255)).save(os.path.join(out, "apple-180.png"))
print("ok")
