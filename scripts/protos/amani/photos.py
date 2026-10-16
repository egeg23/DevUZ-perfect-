"""Фото макета Amani: снимки из их Telegram-канала (src/, номер поста в
имени файла) в WebP в public/protos/amani. Без хотлинков.

    python3 -I scripts/protos/amani/photos.py
"""
import json, os, re
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
OUT = os.path.normpath(os.path.join(HERE, "../../../public/protos/amani"))
os.makedirs(OUT, exist_ok=True)

def save(src, name, w=None, q=80):
    im = Image.open(os.path.join(SRC, src + ".jpg")).convert("RGB")
    if w and im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6)

data = open(os.path.join(HERE, "data.mjs"), encoding="utf8").read()
for pid, files in re.findall(r'id: "(\w+)", post: \d+, .*?f: \[([^\]]+)\]', data):
    fs = re.findall(r'"([\d-]+)"', files)
    save(fs[0], "p-" + pid, q=82)
    save(fs[0], "p-" + pid + "-s", w=300, q=78)
    for i, f in enumerate(fs[1:]):
        save(f, "g-%s-%d" % (pid, i), q=82)
for i, f in enumerate(["5501-1", "5503-1", "5501-2", "5503-2"]):
    save(f, "h%d" % (i + 1), q=86)
for f in ["6218-1", "6223-1", "6232-1", "6233-1", "6359-1", "6393-1"]:
    save(f, "z-" + f, w=360, q=76)
save("6143-1", "box", q=82)
save("6221-2", "bag", q=82)
save("6236-1", "card", w=360, q=80)
save("6103-1", "wrap", q=82)
print(len(os.listdir(OUT)), "files")
