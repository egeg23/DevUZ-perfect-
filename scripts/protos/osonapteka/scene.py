"""Залёт в бренд Oson Apteka: ролик → кадры WebP → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <ролик.mp4> <кадр-a.png>

Ролик — Higgsfield MiniMax H3, 2K, 6 с: от кадра «знак» (синяя стеклянная
метка с красным крестом, nano banana 4K) к кадру «город» (метки аптек над
городом). Компьютеру — 60 кадров 1920×1080 (d/), телефону — те же кадры,
вырезанные 9:16 со сдвигом окна от метки к центру, 720×1280 (m/). В public
кадры лежат только зашифрованными, как у SamAuto (samauto/seal.py):
AES-256-GCM, файл = 12 байт nonce + шифр. Ключ — `SCENE_KEY_OSONAPTEKA` в
хранилище секретов, макет получает его маршрутом app/proto/[token]/promo/scene.
Открытыми остаются только постеры — первый кадр (poster-16/9.webp).
"""
import os, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image

N = 60
KEY = bytes.fromhex(os.environ["SCENE_KEY"])
assert len(KEY) == 32, "ключ — 32 байта"
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/osonapteka")
for sub in ("seq/d", "seq/m"):
    os.makedirs(os.path.join(PUB, sub), exist_ok=True)


def seal(data, path):
    nonce = os.urandom(12)
    open(path, "wb").write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


def webp(im, q):
    import io
    b = io.BytesIO()
    im.save(b, "WEBP", quality=q, method=6)
    return b.getvalue()


def crop9(im, k):
    """Окно 9:16: от метки (правее центра) к центру города."""
    h = im.height
    w = round(h * 9 / 16)
    cx = im.width * (0.71 + (0.52 - 0.71) * k)
    x = max(0, min(im.width - w, round(cx - w / 2)))
    return im.crop((x, 0, x + w, h))


with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", sys.argv[1], "-vsync", "0", f"{tmp}/%04d.png"], check=True)
    src = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))
    for i in range(N):
        k = i / (N - 1)
        im = Image.open(os.path.join(tmp, src[round(k * (len(src) - 1))])).convert("RGB")
        d = im.resize((1920, round(1920 * im.height / im.width)), Image.LANCZOS)
        seal(webp(d, 84), os.path.join(PUB, f"seq/d/f{i:02d}.bin"))
        m = crop9(im, k).resize((720, 1280), Image.LANCZOS)
        seal(webp(m, 84), os.path.join(PUB, f"seq/m/f{i:02d}.bin"))
# постеры — первый кадр из исходника 4K, чётче кадра ролика
a = Image.open(sys.argv[2]).convert("RGB")
for w in (1920, 2880):
    a.resize((w, round(w * a.height / a.width)), Image.LANCZOS).save(os.path.join(PUB, f"poster-16-{w}.webp"), "WEBP", quality=86, method=6)
crop9(a, 0).resize((1080, 1920), Image.LANCZOS).save(os.path.join(PUB, "poster-9.webp"), "WEBP", quality=86, method=6)
print("кадров", N, "× 2", file=sys.stderr)
