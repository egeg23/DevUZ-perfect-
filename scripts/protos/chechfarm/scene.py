"""Сцена первого экрана CHECHFARM: ролик → 48 кадров WebP → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <ролик.mp4>

Ролик — Higgsfield MiniMax H3 Max, 768p, 5 с: от кадра hero (капсула
закрыта) к кадру open (раскрыта). Кадры лежат в public только
зашифрованными, как у SamAuto (samauto/seal.py): AES-256-GCM, файл = 12 байт
nonce + шифр. Ключ — в хранилище секретов (`SCENE_KEY_CHECHFARM`), макет
получает его маршрутом app/proto/[token]/promo/scene.
"""
import os, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image

N = 48
KEY = bytes.fromhex(os.environ["SCENE_KEY"])
assert len(KEY) == 32, "ключ — 32 байта"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/chechfarm/seq")
os.makedirs(OUT, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", sys.argv[1], "-vsync", "0", f"{tmp}/%04d.png"], check=True)
    src = sorted(os.listdir(tmp))
    for i in range(N):
        im = Image.open(os.path.join(tmp, src[round(i * (len(src) - 1) / (N - 1))])).convert("RGB")
        path = os.path.join(tmp, f"f{i:02d}.webp")
        im.save(path, "WEBP", quality=84, method=6)
        data = open(path, "rb").read()
        nonce = os.urandom(12)
        open(os.path.join(OUT, f"f{i:02d}.bin"), "wb").write(nonce + AESGCM(KEY).encrypt(nonce, data, None))
print("кадров", N, file=sys.stderr)
