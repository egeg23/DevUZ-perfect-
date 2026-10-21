"""Техника под финальным текстом: python3 -I fleet.py <папка с исходниками>.

В папке (вне репозитория, оригиналы — в истории генераций Higgsfield):
- c-<вид>.png — карточка, nano banana 4K, 4:3, тёмная студия;
- d-<вид>.png и m-<вид>.png — сцена, где техника работает, 16:9 и 9:16;
- <вид>-16.mp4 и <вид>-9.mp4 — та же сцена живой, Kling 3.0 4K, 5 с кольцом.

Пишет в public/protos/samauto/fleet/: <вид>-card.webp (800×600), постеры
<вид>-16.webp / <вид>-9.webp и видео <вид>-16.mp4 (1920) / <вид>-9.mp4 (1080),
H.264 без звука. Видео грузится только по нажатию на карточку.
"""
import os, subprocess, sys
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/samauto/fleet")
KINDS = ["pikap", "yuk", "avtobus", "vishka"]
os.makedirs(OUT, exist_ok=True)


def webp(src, dst, w, q):
    im = Image.open(src).convert("RGB")
    im.resize((w, round(w * im.size[1] / im.size[0])), Image.LANCZOS).save(dst, "WEBP", quality=q, method=6)


for k in KINDS:
    webp(os.path.join(SRC, f"c-{k}.png"), os.path.join(OUT, f"{k}-card.webp"), 800, 80)
    webp(os.path.join(SRC, f"d-{k}.png"), os.path.join(OUT, f"{k}-16.webp"), 1920, 72)
    webp(os.path.join(SRC, f"m-{k}.png"), os.path.join(OUT, f"{k}-9.webp"), 1080, 72)
    for fmt, scale in (("16", "1920:-2"), ("9", "1080:-2")):
        src = os.path.join(SRC, f"{k}-{fmt}.mp4")
        if not os.path.exists(src):
            print("нет", src)
            continue
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"scale={scale}:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
                        "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", os.path.join(OUT, f"{k}-{fmt}.mp4")], check=True)
for f in sorted(os.listdir(OUT)):
    print(f, round(os.path.getsize(os.path.join(OUT, f)) / 1048576, 2), "МБ")
