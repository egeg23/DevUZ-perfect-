"""Залёт в бренд CARGO PRO GROUP: два кадра 4K → 60 кадров WebP → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <кадр-a.png> <кадр-b.png>

Ролика нет (владелец: Higgsfield не больше 10% баланса на два макета), поэтому
движение камеры строится здесь, из двух кадров nano banana 2.1 4K:

- кадр «a» — их знак, решётчатый глобус из стеклянных трубок (жёлтый →
  оранжевый → красный, как на логотипе), камера наезжает в пустоту внутри
  глобуса, ×3,2 с ускорением;
- вспышка цвета знака и переход в кадр «b» — грузовой узел ночью: самолёт,
  контейнеры, фуры, поезд, оранжевые линии маршрутов;
- кадр «b» оседает с ×1,55 до ×1 с лёгким сдвигом (параллакс).

Компьютеру — 60 кадров 1920×1080 (d/), телефону — 60 кадров 720×1280 (m/),
окно 9:16 вырезано из исходника, а не из кадра 16:9. В public кадры лежат
только зашифрованными, как у SamAuto и Oson Apteka: AES-256-GCM, файл = 12
байт nonce + шифр. Ключ — `SCENE_KEY_CARGOPRO` в хранилище секретов, макет
получает его маршрутом app/proto/[token]/promo/scene. Открыты только постеры
первого кадра (poster-16-*.webp, poster-9.webp).
"""
import io, os, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image, ImageEnhance

N = 60
KEY = bytes.fromhex(os.environ["SCENE_KEY"])
assert len(KEY) == 32, "ключ — 32 байта"
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/cargopro")
for sub in ("seq/d", "seq/m"):
    os.makedirs(os.path.join(PUB, sub), exist_ok=True)

A = Image.open(sys.argv[1]).convert("RGB")
B = Image.open(sys.argv[2]).convert("RGB")
GLOW = (240, 138, 36)  # оранжевый их знака


def seal(data, path):
    nonce = os.urandom(12)
    open(path, "wb").write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


def webp(im, q=84):
    b = io.BytesIO()
    im.save(b, "WEBP", quality=q, method=6)
    return b.getvalue()


def ease(x):
    return x * x * (3 - 2 * x)


def view(im, cx, cy, scale, aspect, out):
    """Окно с пропорцией aspect (ш/в), увеличенное в scale раз, центр (cx, cy) в долях."""
    W, H = im.size
    if W / H > aspect:
        bh, bw = H, H * aspect
    else:
        bw, bh = W, W / aspect
    w, h = bw / scale, bh / scale
    x = min(max(cx * W - w / 2, 0), W - w)
    y = min(max(cy * H - h / 2, 0), H - h)
    return im.resize(out, Image.LANCZOS, box=(x, y, x + w, y + h))


def frame(i, aspect, out, mob):
    k = i / (N - 1)
    a = None
    if k <= 0.62:  # наезд в глобус
        p = ease(min(k / 0.56, 1))
        cx0, cy0 = (0.40, 0.48) if mob else (0.50, 0.50)
        cx, cy = cx0 + (0.49 - cx0) * p, cy0 + (0.46 - cy0) * p
        a = view(A, cx, cy, 1 + 2.2 * p ** 1.6, aspect, out)
    b = None
    if k >= 0.44:  # грузовой узел оседает
        p = ease(min(max((k - 0.44) / 0.56, 0), 1))
        cx = (0.58 + (0.46 - 0.58) * p) if mob else (0.52 + (0.5 - 0.52) * p)
        b = view(B, cx, 0.52 - 0.02 * p, 1.55 - 0.55 * p, aspect, out)
    if a is None:
        return b
    if b is None:
        return a
    t = ease((k - 0.44) / (0.62 - 0.44))
    flash = 1 - abs(t - 0.5) * 2  # вспышка цвета знака посередине перехода
    mix = Image.blend(a, b, t)
    mix = Image.blend(mix, Image.new("RGB", out, GLOW), 0.35 * flash)
    return ImageEnhance.Brightness(mix).enhance(1 + 0.25 * flash)


for i in range(N):
    seal(webp(frame(i, 16 / 9, (1920, 1080), False)), os.path.join(PUB, f"seq/d/f{i:02d}.bin"))
    seal(webp(frame(i, 9 / 16, (720, 1280), True)), os.path.join(PUB, f"seq/m/f{i:02d}.bin"))
    print(i, end=" ", file=sys.stderr, flush=True)
# постеры — первый кадр прямо из исходника 4K
for w in (1920, 2880):
    view(A, 0.5, 0.5, 1, 16 / 9, (w, round(w * 9 / 16))).save(os.path.join(PUB, f"poster-16-{w}.webp"), "WEBP", quality=86, method=6)
view(A, 0.40, 0.48, 1, 9 / 16, (1080, 1920)).save(os.path.join(PUB, "poster-9.webp"), "WEBP", quality=86, method=6)
print("\nкадров", N, "× 2", file=sys.stderr)
