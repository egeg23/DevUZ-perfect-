"""Сцена первого экрана Cosmo World: пролёт → кадры WebP → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <папка>

В папке — исходники Higgsfield (docs/research/cosmoworld.md):
  t1.mp4 t2.mp4 t3.mp4  переходы Kling 3.0 pro, 6 с, 16:9 (подиум → ближе,
                        ближе → склад, склад → страна);
  d1.png                ключевой кадр 1, 16:9, 4K — открытая обложка;
  m1.png … m4.png       ключевые кадры 9:16, 4K — телефону.

Компьютер листает кадры переходов (PER на ролик, стык не повторяется),
телефон — четыре ключевых кадра со сменой и наездом (владелец, 28.10.2026:
«Видео переходы не делай сильно замудрёными»; видео 9:16 не заказывали).
Кадры лежат в public только шифром, как у SamAuto (samauto/seal.py):
AES-256-GCM, файл = 12 байт nonce + шифр. Ключ — `SCENE_KEY_COSMOWORLD` в
хранилище, макет получает его маршрутом app/proto/[token]/promo/scene.
Открыто лежат только обложки первого кадра (их видно до загрузки сцены) и
кадр склада для фона блока «Склад».
"""
import json, os, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image

PER = 40
W_D, W_M = 1600, 1080
KEY = bytes.fromhex(os.environ["SCENE_KEY"])
assert len(KEY) == 32, "ключ — 32 байта"
SRC = sys.argv[1]
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/cosmoworld")
OUT = os.path.join(PUB, "seq")
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))


def seal(im, name, w, q):
    im = im.convert("RGB")
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    with tempfile.NamedTemporaryFile(suffix=".webp") as t:
        im.save(t.name, "WEBP", quality=q, method=6)
        data = open(t.name, "rb").read()
    nonce = os.urandom(12)
    open(os.path.join(OUT, name), "wb").write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


n = 0
with tempfile.TemporaryDirectory() as tmp:
    for c in (1, 2, 3):
        d = os.path.join(tmp, str(c))
        os.makedirs(d)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(SRC, f"t{c}.mp4"), "-vsync", "0", f"{d}/%04d.png"], check=True)
        src = sorted(os.listdir(d))
        for i in range(0 if c == 1 else 1, PER):
            seal(Image.open(os.path.join(d, src[round(i * (len(src) - 1) / (PER - 1))])), f"d{n:03d}.bin", W_D, 78)
            n += 1
for i in range(1, 5):
    seal(Image.open(os.path.join(SRC, f"m{i}.png")), f"m{i}.bin", W_M, 80)

# Обложки — открыто: первый кадр до загрузки и при «меньше движения».
for name, f, w in (("hero-1600", "d1.png", 1600), ("hero-2400", "d1.png", 2400), ("hero-m-1080", "m1.png", 1080), ("wh-1600", "d3.png", 1600)):
    im = Image.open(os.path.join(SRC, f)).convert("RGB")
    im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(os.path.join(PUB, name + ".webp"), "WEBP", quality=80, method=6)

json.dump({"d": n, "m": 4}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "seq.json"), "w"))
print("кадров компьютеру", n, "телефону 4", file=sys.stderr)
