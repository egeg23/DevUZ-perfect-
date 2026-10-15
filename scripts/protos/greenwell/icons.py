"""Значки вкладки макета Greenwell: банка Магний Цитрат на их тёмно-зелёном.
  python3 -I scripts/protos/greenwell/icons.py"""
import os
from PIL import Image, ImageDraw
OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/greenwell"))
jar = Image.open(os.path.join(OUT, "p-mgc.webp")).convert("RGBA")
for size, name in ((192, "icon-192.png"), (180, "apple-180.png")):
    im = Image.new("RGBA", (size, size), (0, 87, 58, 255))
    if name.startswith("icon"):
        m = Image.new("L", (size, size), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), radius=size // 5, fill=255); im.putalpha(m)
    j = jar.copy(); j.thumbnail((size, int(size * .82)), Image.LANCZOS)
    im.alpha_composite(j, ((size - j.width) // 2, size - j.height + int(size * .06) if False else (size - j.height) // 2 + int(size * .04)))
    im.save(os.path.join(OUT, name))
print("ok")
