"""Кадры Higgsfield (nano banana 2.1, 4K) → WebP для макета.
python3 -I photos.py <папка с png>   Файлы: hero, hero-m, globe, steps, flask."""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[3] / "public/protos/chechfarm"
OUT.mkdir(parents=True, exist_ok=True)
JOBS = {"hero": [2400, 1400, 900], "hero-m": [1080], "open": [2400, 1400], "open-m": [1080], "globe": [2000, 1100], "steps": [2000, 1100], "flask": [1200, 700]}
for name, widths in JOBS.items():
    im = Image.open(SRC / f"{name}.png").convert("RGB")
    for w in widths:
        x = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        x.save(OUT / f"{name}-{w}.webp", "WEBP", quality=80, method=6)
        print(name, w, (OUT / f"{name}-{w}.webp").stat().st_size)
