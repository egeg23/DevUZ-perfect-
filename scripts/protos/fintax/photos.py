"""Кадры Higgsfield (nano banana 2.1, 4K) → WebP для макета.
python3 -I photos.py <папка с png>   Файлы: hero, hero-m, archive."""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[3] / "public/protos/fintax"
OUT.mkdir(parents=True, exist_ok=True)
JOBS = {"hero": [2560, 1600, 960], "hero-m": [1080], "archive": [2000, 1100]}
for name, widths in JOBS.items():
    im = Image.open(SRC / f"{name}.png").convert("RGB")
    for w in widths:
        x = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        x.save(OUT / f"{name}-{w}.webp", "WEBP", quality=80, method=6)
        print(name, w, (OUT / f"{name}-{w}.webp").stat().st_size)
