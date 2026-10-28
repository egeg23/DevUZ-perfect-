"""Сцена первого экрана Cosmo World: пролёт → кадры WebP → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <папка>

В папке — исходники Higgsfield (docs/research/cosmoworld.md):
  t1.mp4 t2.mp4 t3.mp4  переходы Kling 3.0 pro, 6 с, 16:9 (подиум → ближе,
                        ближе → склад, склад → страна);
  v1.mp4 v2.mp4 v3.mp4  те же переходы 9:16, Kling 3.0 std, — телефону;
  d1.png                ключевой кадр 1, 16:9, 4K — открытая обложка;
  m1.png                ключевой кадр 9:16, 4K — открытая обложка телефона.

Компьютер и телефон листают кадры своих роликов (PER на ролик, около 16 в
секунду; владелец, 28.10.2026: «будто кадров анимации в скролле мало, ты же
видео генерировал, возьми больше оттуда кадров»).
Кадры лежат в public только шифром, как у SamAuto (samauto/seal.py):
AES-256-GCM, файл = 12 байт nonce + шифр. Ключ — `SCENE_KEY_COSMOWORLD` в
хранилище, макет получает его маршрутом app/proto/[token]/promo/scene.
Открыто лежат только обложки первого кадра (их видно до загрузки сцены) и
кадр склада для фона блока «Склад».
"""
import json, os, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image

PER = 96
W_D, W_P = 1600, 720
KEY = bytes.fromhex(os.environ["SCENE_KEY"])
assert len(KEY) == 32, "ключ — 32 байта"
SRC = sys.argv[1]
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/cosmoworld")
OUT = os.path.join(PUB, "seq")
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))


PACK = 24


def webp(im, w, q):
    im = im.convert("RGB")
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    with tempfile.NamedTemporaryFile(suffix=".webp") as t:
        im.save(t.name, "WEBP", quality=q, method=6)
        return open(t.name, "rb").read()


def seal(data, name):
    nonce = os.urandom(12)
    open(os.path.join(OUT, name), "wb").write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


def clips(prefix, files, w, q):
    """Кадры трёх роликов подряд, PER на ролик, стык не повторяется.

    Кадры уходят пачками по PACK (владелец, 28.10.2026, с телефона в
    Telegram: сцена из 286 отдельных файлов не успевала загрузиться, он видел
    только обложку). Пачка = 4 байта числа кадров, по 4 байта длины каждого,
    потом сами WebP подряд; шифруется целиком. Сцена стартует с первой
    пачкой, остальные догружает по ходу."""
    frames = []
    with tempfile.TemporaryDirectory() as tmp:
        for c, f in enumerate(files):
            d = os.path.join(tmp, str(c))
            os.makedirs(d)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(SRC, f), "-vsync", "0", f"{d}/%04d.png"], check=True)
            src = sorted(os.listdir(d))
            for i in range(0 if c == 0 else 1, PER):
                frames.append(webp(Image.open(os.path.join(d, src[round(i * (len(src) - 1) / (PER - 1))])), w, q))
    for k in range(0, len(frames), PACK):
        part = frames[k:k + PACK]
        head = len(part).to_bytes(4, "little") + b"".join(len(x).to_bytes(4, "little") for x in part)
        seal(head + b"".join(part), f"{prefix}{k // PACK:02d}.bin")
    return len(frames)


nd = clips("d", ["t1.mp4", "t2.mp4", "t3.mp4"], W_D, 74)
np_ = clips("p", ["v1.mp4", "v2.mp4", "v3.mp4"], W_P, 74)

# Обложки — открыто: первый кадр до загрузки и при «меньше движения».
for name, f, w in (("hero-1600", "d1.png", 1600), ("hero-2400", "d1.png", 2400), ("hero-m-1080", "m1.png", 1080), ("wh-1600", "d3.png", 1600)):
    im = Image.open(os.path.join(SRC, f)).convert("RGB")
    im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(os.path.join(PUB, name + ".webp"), "WEBP", quality=80, method=6)

json.dump({"d": nd, "p": np_, "pack": PACK}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "seq.json"), "w"))
print("кадров компьютеру", nd, "телефону", np_, file=sys.stderr)
