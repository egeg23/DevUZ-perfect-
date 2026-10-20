"""Медиа макета «Жигули Рестобар» из оригиналов Higgsfield (README, SOURCES.md).

python3 -I scripts/protos/jiguli/media.py <папка с оригиналами>

В папке: k0..k10.png (Nano Banana 4K, 9:16), v1a.mp4, v1b.mp4 и v2.mp4
(MiniMax H3 2K),
logo.png (их логотип с сайта). Пишет public/protos/jiguli и media.json рядом.
Генерировали только вертикаль (слово владельца): версия для ПК вырезается из
тех же кадров, широкие полосы — из 4K-вертикали.
"""
import json, os, subprocess, sys, shutil, tempfile
from PIL import Image, ImageOps

SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "../../../public/protos/jiguli")
os.makedirs(OUT, exist_ok=True)

def webp(im, name, q):
    im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6)

def tall(src, name, w=1080, q=80):
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    webp(im.resize((w, round(im.height * w / im.width)), Image.LANCZOS), name + "-9", q)

def band(src, name, cy, w=1600, q=72):
    """Широкая полоса 16:9 из вертикали: центр полосы — доля высоты cy."""
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    h = round(im.width * 9 / 16)
    y = max(0, min(im.height - h, round(im.height * cy - h / 2)))
    webp(im.crop((0, y, im.width, y + h)).resize((w, round(w * 9 / 16)), Image.LANCZOS), name + "-16", q)

# Блюда и напитки «замороженным мгновением»: вертикаль — телефону и колонке
# на ПК, полоса — фоном на ПК (размывается в стилях).
MENU = {"beer": ("k0.png", .62), "sour": ("k1.png", .45), "raki": ("k2.png", .5), "lamb": ("k3.png", .55)}
for name, (src, cy) in MENU.items():
    tall(src, "m-" + name)
    band(src, "m-" + name, cy, w=960, q=55)

# Плакат-заставка: первый кадр кино и спокойная версия.
tall("k8.png", "poster")
band("k8.png", "poster", .62, w=1280, q=60)

# Кино по прокрутке: v1a и v1b (бармен у шахматной стойки, наезд на кран,
# рисунок; каждый третий кадр: рисунок тяжелее) → затемнение → v2 (струя на
# чёрном, к бокалу; каждый второй). Каждый второй кадр, 720 px по ширине.
tmp = tempfile.mkdtemp()
def frames(src, tag, step=2):
    d = os.path.join(tmp, tag); os.makedirs(d)
    subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(SRC, src), "-vf", f"select=not(mod(n\\,{step})),scale=720:-2", "-vsync", "vfr", os.path.join(d, "%04d.png")], check=True)
    return sorted(os.path.join(d, f) for f in os.listdir(d))
a = frames("v1a.mp4", "a", 3) + frames("v1b.mp4", "a2", 3)[1:]
b = frames("v2.mp4", "b")
seq = [Image.open(f).convert("RGB") for f in a]
black = Image.new("RGB", seq[-1].size, (0, 0, 0))
DIP = 10
last, first = seq[-1], Image.open(b[0]).convert("RGB").resize(seq[-1].size)
seq += [Image.blend(last, black, (i + 1) / DIP) for i in range(DIP)]
seq += [Image.blend(black, first, (i + 1) / DIP) for i in range(DIP)]
seq += [Image.open(f).convert("RGB").resize(seq[0].size) for f in b[1:]]
sd = os.path.join(OUT, "s")
shutil.rmtree(sd, ignore_errors=True); os.makedirs(sd)
for i, im in enumerate(seq):
    im.save(os.path.join(sd, f"{i:03d}.webp"), "WEBP", quality=68, method=6)
shutil.rmtree(tmp)

# Значки: их буквы на красном поле.
logo = Image.open(os.path.join(SRC, "logo.png")).convert("RGBA")
word = logo.crop(logo.getbbox()).crop((0, 0, logo.width, 340))
cream = Image.new("RGBA", word.size, (246, 233, 208, 255)); cream.putalpha(word.split()[3])
for size, name in ((192, "icon-192"), (180, "apple-180")):
    ic = Image.new("RGB", (size, size), (158, 34, 30))
    w = ImageOps.contain(cream, (round(size * .84), round(size * .84)))
    ic.paste(w, ((size - w.width) // 2, (size - w.height) // 2), w)
    ic.save(os.path.join(OUT, name + ".png"))

json.dump({"s": len(seq), "cut": [len(a), len(a) + 2 * DIP]}, open(os.path.join(HERE, "media.json"), "w"))
print("кадров", len(seq), "склейка", len(a), len(a) + 2 * DIP)
