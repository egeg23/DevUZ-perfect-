# Разворот, уход и обратный разворот врача — одним роликом: на сайте врач поворачивается и
# уходит без паузы на смену файла (видео одно на врача, team.js только переводит время).
#   python3 -I pack.py <выход.mp4> <кадры:fps[:rev]> ...
# Кадры — папка <кэш>/v из clip.py; rev — те же кадры с конца. Кадры разной ширины ставятся по
# центру кадра самой широкой части (высота у всех одна). У каждой части своя частота кадров
# (время кадра записано в ролик), с каждой части — ключевой кадр.
# В ответе — для FIGS: ширина кадра и где в ролике начинается каждая часть (at, секунды).
import json, os, subprocess, sys, tempfile
from PIL import Image

out, parts = sys.argv[1], sys.argv[2:]
segs = []
for p in parts:
    d, fps, *rest = p.split(":")
    files = sorted(os.listdir(d))
    if rest and rest[0] == "rev":
        files = files[::-1]
    segs.append((d, int(fps), files))
W = max(Image.open(os.path.join(d, f[0])).width for d, _, f in segs)
H2 = Image.open(os.path.join(segs[0][0], segs[0][2][0])).height
tmp = tempfile.mkdtemp()
at, res, k, expr = 0.0, [], 0, "0"
for d, fps, files in segs:
    res.append({"at": round(at, 5), "fps": fps, "n": len(files)})
    for f in files:
        im = Image.open(os.path.join(d, f)).convert("RGB")
        if im.width != W or im.height != H2:
            c = Image.new("RGB", (W, H2), (0, 0, 0))
            # верх — цвет: поля белые (как вокруг фигуры), низ — прозрачность: поля чёрные
            c.paste(Image.new("RGB", (W, H2 // 2), (255, 255, 255)), (0, 0))
            c.paste(im, ((W - im.width) // 2, 0))
            im = c
        im.save(f"{tmp}/{k:05d}.png", compress_level=1)
        k += 1
    at += len(files) / fps
# Время каждого кадра — по его части, в долях 1/960 секунды (960 делится на 60, 48, 32, 30 и 24:
# время кадра целое, без округления): setpts по номеру кадра N.
first, tick = 0, 0
for s_ in res:   # снаружи — последняя часть: её условие проверяется первым
    expr = f"if(gte(N,{first}),{tick}+(N-{first})*{960 // s_['fps']},{expr})"
    first += s_["n"]; tick += s_["n"] * (960 // s_["fps"])
keys = ",".join(f"{s_['at']:.5f}" for s_ in res)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", "960", "-i", f"{tmp}/%05d.png",   # шаг времени входа 1/960: setpts не округляет до кадра
                "-vf", f"setpts='{expr}'", "-fps_mode", "passthrough", "-video_track_timescale", "960",
                "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p", "-profile:v", "high",
                "-bf", "0", "-force_key_frames", keys, "-movflags", "+faststart", "-an", out], check=True)
print(json.dumps({"w": W, "h": H2 // 2, "parts": res, "dur": round(at, 5), "bytes": os.path.getsize(out)}))
