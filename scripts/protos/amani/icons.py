"""Значки вкладки макета Amani: их аватар из канала (знак AMÁNI by Warda).
  python3 -I scripts/protos/amani/icons.py"""
import os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "../../../public/protos/amani"))
av = Image.open(os.path.join(HERE, "src", "avatar.jpg")).convert("RGBA")
for size, name in ((192, "icon-192.png"), (180, "apple-180.png")):
    im = av.resize((size, size), Image.LANCZOS)
    if name.startswith("icon"):
        m = Image.new("L", (size, size), 0); ImageDraw.Draw(m).ellipse((0, 0, size - 1, size - 1), fill=255); im.putalpha(m)
    im.save(os.path.join(OUT, name))
print("ok")
