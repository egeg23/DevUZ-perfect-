"""Кадры сцены из роликов Higgsfield: python3 -I seq.py <папка с роликами>.

Ролики (Kling 3.0, 4K, по ключевым кадрам nano banana) лежат вне репозитория:
d-t1.mp4 … d-t7.mp4 — 16:9, m-t1.mp4 … m-t7.mp4 — 9:16 (список — CLIPS).
Из каждого берём N кадров поровну по времени, уменьшаем и пишем WebP в
public/protos/samauto/seq/<d|m>/, а число кадров — в seq.json рядом с gen.mjs.
Сборка (обратно после разлёта) — те же кадры задом наперёд, файлов не
прибавляет.
"""
import json, os, subprocess, sys
from PIL import Image

SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "../../../public/protos/samauto/seq")
# ролик → кадров; порядок — порядок сцены
CLIPS = [("t1", 64), ("t3", 40), ("t4", 40), ("t5", 40), ("t6", 48), ("t7", 64)]
FMT = {"d": (1920, 66), "m": (1080, 62)}  # ширина, качество WebP


def frames(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return int(out.stdout.strip())


counts = {}
for fmt, (w, q) in FMT.items():
    d = os.path.join(PUB, fmt)
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        os.remove(os.path.join(d, f))
    total = 0
    counts[fmt] = []
    for clip, n in CLIPS:
        src = os.path.join(SRC, f"{fmt}-{clip}.mp4")
        k = frames(src)
        pick = [round(i * (k - 1) / (n - 1)) for i in range(n)]
        sel = "+".join(f"eq(n\\,{i})" for i in pick)
        tmp = os.path.join(d, f"_{clip}_%03d.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"select='{sel}',scale={w}:-2:flags=lanczos", "-vsync", "0", tmp], check=True)
        for i in range(n):
            p = tmp % (i + 1)
            Image.open(p).convert("RGB").save(os.path.join(d, f"{clip}-{i:02d}.webp"), "WEBP", quality=q, method=6)
            os.remove(p)
        counts[fmt].append([clip, n])
        total += n
    size = sum(os.path.getsize(os.path.join(d, f)) for f in os.listdir(d))
    print(fmt, total, "кадров", round(size / 1048576, 1), "МБ")

json.dump(counts, open(os.path.join(HERE, "seq.json"), "w"))
