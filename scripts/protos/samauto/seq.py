"""Кадры сцены из роликов Higgsfield: python3 -I seq.py <папка с роликами>.

Ролики (Kling 3.0, 4K, по ключевым кадрам nano banana) лежат вне репозитория:
d-t1.mp4 … d-t7.mp4 — 16:9, m-t1.mp4 … m-t7.mp4 — 9:16 (список — CLIPS).
Из каждого берём N кадров поровну по времени, уменьшаем и пишем WebP в
public/protos/samauto/seq/<d|m>/, а число кадров — в seq.json рядом с gen.mjs.
Сборка (обратно после разлёта) — те же кадры задом наперёд, файлов не
прибавляет.

Телефону ещё m.mp4: те же кадры в порядке сцены (с паузой и сборкой), каждый
кадр ключевой. Телефон перематывает такое видео аппаратно, без распаковки
картинок: кадры по одному на iPhone на разлёте пропадали (владелец,
21.10.2026). Порядок сцены — order(), его же берёт gen.mjs из seq.json.
"""
import json, os, shutil, subprocess, sys, tempfile
from PIL import Image

SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "../../../public/protos/samauto/seq")
# ролик → кадров; порядок — порядок сцены
CLIPS = [("t1", 64), ("t3", 56), ("t4", 56), ("t5", 48), ("t6", 56), ("t7", 72)]
# ширина, качество WebP. Телефону 828: холст сцены не больше 2 точек на пиксель
# (414 × 2), шире — лишний вес и долгая распаковка на iPhone.
FMT = {"d": (1920, 62), "m": (828, 64)}
HOLD = 14  # столько кадров разлёт стоит на месте, пока читают подписи
FPS = 24


def order(clips):
    """Покрывало, разлёт, пауза, сборка (разлёт задом наперёд), фара, борт, проезд."""
    n = dict(clips)
    run = lambda c: [f"{c}-{i:02d}" for i in range(n[c])]
    ex = run("t3") + run("t4")
    return run("t1") + ex + [ex[-1]] * HOLD + ex[::-1] + run("t5") + run("t6") + run("t7")


def frames(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return int(out.stdout.strip())


counts = {}
png = tempfile.mkdtemp()
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
            if fmt == "m":
                shutil.move(p, os.path.join(png, f"{clip}-{i:02d}.png"))
            else:
                os.remove(p)
        counts[fmt].append([clip, n])
        total += n
    size = sum(os.path.getsize(os.path.join(d, f)) for f in os.listdir(d))
    print(fmt, total, "кадров", round(size / 1048576, 1), "МБ")

# Видео телефона: кадры в порядке сцены, каждый ключевой (-g 1), без звука.
seq = order(counts["m"])
lst = tempfile.mkdtemp()
for i, name in enumerate(seq):
    os.symlink(os.path.join(png, name + ".png"), os.path.join(lst, f"{i:05d}.png"))
mp4 = os.path.join(PUB, "m.mp4")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(lst, "%05d.png"), "-c:v", "libx264", "-preset", "slow", "-tune", "film", "-crf", "25",
                "-g", "1", "-keyint_min", "1", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", mp4], check=True)
shutil.rmtree(lst)
shutil.rmtree(png)
print("m.mp4", len(seq), "кадров", round(os.path.getsize(mp4) / 1048576, 1), "МБ")

counts.update(hold=HOLD, fps=FPS, order=order(counts["d"]))
json.dump(counts, open(os.path.join(HERE, "seq.json"), "w"))
