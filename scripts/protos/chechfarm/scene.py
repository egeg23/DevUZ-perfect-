"""Сцена первого экрана CZECHFARM: ролики → кадры прокрутки и видео телефона → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <папка с роликами и ключевыми кадрами>

Владелец, 12.11.2026: «вау анимацию скрола в хиро секции… завод… падает
упаковка… наполняется таблетками… упаковывается… летит… влетает в аптеку и
ложится на полку с названием их бренда». И в тот же день, после трёх заходов
своим движком: «взять за основу как мы сделали для салона красоты и повторить
просто функции скролл анимации, только с нашим этим видео и визуалом».
Поэтому формат тот же, что у пролёта салона и Nek (instant/scene.py), и
движок на странице тот же (nek/land.js): телефону одно видео, кадры по
одному файлу компьютеру и запасным путём.

В папке: d-a.mp4 … d-e.mp4 (16:9) и m-a.mp4 … m-e.mp4 (9:16), пять переходов
Kling 3.0 между шестью ключевыми кадрами nano banana 4K: k0.png … k5.png и
k0m.png … k5m.png. Исходники лежат вне репозитория.

Пишем в public/protos/chechfarm/seq:
- d/fNNN.bin и m/fNNN.bin: каждый второй кадр, WebP 1280×720 и 720×1280;
- m.bin: видео телефона, все кадры подряд, H.264, ключевой каждый третий,
  без B-кадров;
- p-<d|m>-<0…5>.webp: шесть открытых постеров (видны, пока сцена грузится,
  без движения и когда ключ не пришёл).
Всё, кроме постеров, шифром AES-256-GCM (12 байт nonce + шифр), ключ —
`SCENE_KEY_CHECHFARM` в хранилище. Числа кадров — в scene.json.
"""
import io, json, os, shutil, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image

SRC = sys.argv[1]
KEY = bytes.fromhex(os.environ["SCENE_KEY"])
assert len(KEY) == 32, "ключ — 32 байта"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "../../../public/protos/chechfarm/seq")
CLIPS = "abcde"
STEP = 2
FPS = 24
SIZE = {"d": (1280, 720), "m": (720, 1280)}
Q = {"d": 74, "m": 70}


def seal(data, path):
    nonce = os.urandom(12)
    with open(path, "wb") as f:
        f.write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


def frames(path):
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-q:v", "2", os.path.join(tmp, "%04d.jpg")], check=True)
    return [os.path.join(tmp, f) for f in sorted(os.listdir(tmp))]


def full(kind):
    """Кадры всех роликов подряд; первый кадр следующего ролика — тот же ключевой, его пропускаем."""
    seq = []
    for i, c in enumerate(CLIPS):
        fs = frames(os.path.join(SRC, f"{kind}-{c}.mp4"))
        seq += fs[1:] if i else fs
    return seq


if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
seqs = {k: full(k) for k in ("d", "m")}
picks = {}
for k, seq in seqs.items():
    p = seq[::STEP]
    if p[-1] != seq[-1]:
        p.append(seq[-1])
    picks[k] = p
n = min(len(p) for p in picks.values())
total = 0
for k in ("d", "m"):
    p = picks[k]
    p = [p[round(i * (len(p) - 1) / (n - 1))] for i in range(n)]
    os.makedirs(os.path.join(OUT, k))
    for i, f in enumerate(p):
        b = io.BytesIO()
        Image.open(f).convert("RGB").resize(SIZE[k], Image.LANCZOS).save(b, "WEBP", quality=Q[k], method=6)
        total += b.tell()
        seal(b.getvalue(), os.path.join(OUT, k, f"f{i:03d}.bin"))

lst = tempfile.mkdtemp()
for i, f in enumerate(seqs["m"]):
    os.symlink(f, os.path.join(lst, f"{i:05d}.jpg"))
mp4 = os.path.join(lst, "m.mp4")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(lst, "%05d.jpg"), "-vf", "scale=720:1280:flags=lanczos",
                "-c:v", "libx264", "-preset", "slow", "-tune", "film", "-crf", "25", "-g", "3", "-keyint_min", "1", "-bf", "0",
                "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", mp4], check=True)
seal(open(mp4, "rb").read(), os.path.join(OUT, "m.bin"))

for fmt, suf, width in (("d", "", 1920), ("m", "m", 828)):
    for i in range(len(CLIPS) + 1):
        im = Image.open(os.path.join(SRC, f"k{i}{suf}.png")).convert("RGB")
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        im.save(os.path.join(OUT, f"p-{fmt}-{i}.webp"), "WEBP", quality=80, method=6)
meta = {"n": n, "vn": len(seqs["m"]), "fps": FPS}
json.dump(meta, open(os.path.join(HERE, "scene.json"), "w"))
print(meta, "кадры", round(total / 1048576, 1), "МБ, видео", round(os.path.getsize(mp4) / 1048576, 1), "МБ", file=sys.stderr)
