"""Кадры Blender → WebP для макета (public/protos/usemtau). Pillow, без Blender:

    python3 -I scripts/blender/usemtau/pack.py <папка с png>

aisle-h.png → sklad-h-1920/1280.webp, aisle-v.png → sklad-v-1080/720.webp,
p-<вид>.png → p-<вид>-1000/480.webp. Лёгкое зерно, чтобы кадр не был
стерильным, как у плёнки; в остальном цвет как отрендерен.
"""
import random
import sys
from pathlib import Path
from PIL import Image, ImageChops

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[3] / "public/protos/usemtau"
OUT.mkdir(parents=True, exist_ok=True)


def grain(im, amount=6, seed=5):
    """Зерно: гауссов шум ±amount, добавляется ко всем каналам поровну."""
    rnd = random.Random(seed)
    w, h = im.size
    n = Image.new("L", (w // 2 + 1, h // 2 + 1))
    n.putdata([max(0, min(255, 128 + int(rnd.gauss(0, amount)))) for _ in range((w // 2 + 1) * (h // 2 + 1))])
    n = n.resize((w, h), Image.BILINEAR)
    up, down = n.point(lambda v: max(0, v - 128)), n.point(lambda v: max(0, 128 - v))
    ch = [ImageChops.subtract(ImageChops.add(c, up), down) for c in im.split()]
    return Image.merge("RGB", ch)


def save(im, name, width, q=78):
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", "WEBP", quality=q, method=6)
    print(name, im.size, (OUT / f"{name}.webp").stat().st_size // 1024, "КБ")


for src, name, sizes in (("aisle-h.png", "sklad-h", (1920, 1280)), ("aisle-v.png", "sklad-v", (1080, 720))):
    p = SRC / src
    if p.exists():
        im = grain(Image.open(p).convert("RGB"), 6)
        for w in sizes:
            save(im, f"{name}-{w}", w, 74)

for p in sorted(SRC.glob("p-*.png")):
    im = grain(Image.open(p).convert("RGB"), 4, seed=len(p.stem))
    for w in (1000, 480):
        save(im, f"{p.stem}-{w}", w, 80)
