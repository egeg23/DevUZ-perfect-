"""Изображения прототипа HOP.UZ (hop.uz).

python3 -I photos.py <папка с исходниками> <public/protos/hop>

Исходники — с hop.uz, скачаны 08.10.2026:
  823e83180f9d0705934d222c535bea94.webp — их значок сайта: белая «H» в
  красном круге, 1200 × 1200, прозрачный фон.
  ba-old-d.png, ba-old-m.png — снимки hop.uz в Chromium, 1440 × 900 и
  390 × 844 (shots.mjs); ba-new-*.png — снимки прототипа так же.
Логотип HOP! на страницах перерисован кодом (gen.mjs, LG), картинок
нейросетью не рисовали.
"""
import sys, os
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

ico = Image.open(os.path.join(src, "823e83180f9d0705934d222c535bea94.webp")).convert("RGBA")
for size, name in ((192, "icon-192.png"), (180, "apple-180.png")):
    bg = Image.new("RGBA", ico.size, (255, 255, 255, 255))
    bg.alpha_composite(ico)
    bg.convert("RGB").resize((size, size), Image.LANCZOS).save(os.path.join(out, name))

for name in ("ba-old-d", "ba-old-m", "ba-new-d", "ba-new-m"):
    p = os.path.join(src, name + ".png")
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB")
    w = 1200 if name.endswith("-d") else 600
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, name + ".webp"), "WEBP", quality=78, method=6)
print("ok")
