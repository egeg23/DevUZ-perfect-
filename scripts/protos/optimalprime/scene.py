"""Залёт в бренд Optimal Prime: два кадра 4K → 60 кадров камеры → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <кадр-a.png> <кадр-b.png>

Кадры — Higgsfield nano banana 2.1, 4K (5504×3072), 31.10.2026:
  a — их знак (девять плиток 3×3: тёмно-синее стекло и золото) крупно;
  b — деловой квартал Ташкента в сумерках, башня с сеткой золотых окон.
На ролик бюджета нет (10% Higgsfield на два макета), поэтому камеру
считаем здесь: наезд на щель света у центральной плитки (×3,2, разгон),
вспышка-растворение, и кадр b садится с ×1,55 до ×1 с лёгким сдвигом.
Компьютеру — 1920×1080 (d/), телефону — окно 9:16 за той же точкой,
720×1280 (m/). В public кадры лежат только зашифрованными, как у SamAuto
и Oson Apteka: AES-256-GCM, файл = 12 байт nonce + шифр. Ключ —
`SCENE_KEY_OPTIMALPRIME` в хранилище секретов, макет получает его маршрутом
app/proto/[token]/promo/scene. Открыты только постеры: первый кадр и
последний (им же стоит первый экран сайта).
"""
import io, os, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image, ImageEnhance

N = 60
KEY = bytes.fromhex(os.environ["SCENE_KEY"])
assert len(KEY) == 32, "ключ — 32 байта"
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/optimalprime")
for sub in ("seq/d", "seq/m"):
    os.makedirs(os.path.join(PUB, sub), exist_ok=True)

# Рабочий размер: 4K по ширине хватает и на ×3,2 для 1920 (1200 точек → 1920 — мягко,
# но на наезде это и есть «камера в стекле»); телефону окно уже, запас больше.
W = 3840
A = Image.open(sys.argv[1]).convert("RGB")
B = Image.open(sys.argv[2]).convert("RGB")
A = A.resize((W, round(W * A.height / A.width)), Image.LANCZOS)
B = B.resize((W, round(W * B.height / B.width)), Image.LANCZOS)
H = A.height

# Точки камеры (доли кадра): щель света справа от центральной плитки и башня.
FA = (0.64, 0.6)
FB0, FB1 = (0.40, 0.42), (0.47, 0.5)


def ease_in(k):
    return k * k * k


def ease_out(k):
    return 1 - (1 - k) ** 3


def view(im, fx, fy, z, aspect, out):
    """Окно камеры: центр (fx, fy), увеличение z, пропорция aspect = w/h."""
    vh = H / z
    vw = vh * aspect
    if vw > im.width / z * 1.0001 and aspect > im.width / im.height:
        vw = im.width / z
        vh = vw / aspect
    cx, cy = fx * im.width, fy * im.height
    x = max(0, min(im.width - vw, cx - vw / 2))
    y = max(0, min(im.height - vh, cy - vh / 2))
    return im.resize(out, Image.LANCZOS, box=(x, y, x + vw, y + vh))


def frame(i, aspect, out):
    k = i / (N - 1)
    if k <= 0.52:
        u = k / 0.52
        a = view(A, 0.5 + (FA[0] - 0.5) * ease_out(u), 0.5 + (FA[1] - 0.5) * ease_out(u), 1 + 2.2 * ease_in(u), aspect, out)
        # к концу наезда свет в щели растёт
        return ImageEnhance.Brightness(a).enhance(1 + 0.55 * ease_in(u))
    u = (k - 0.52) / 0.48
    z = 1.55 - 0.55 * ease_out(u)
    fx = FB0[0] + (FB1[0] - FB0[0]) * ease_out(u)
    fy = FB0[1] + (FB1[1] - FB0[1]) * ease_out(u)
    b = view(B, fx, fy, z, aspect, out)
    if u < 0.22:
        # растворение из золотой вспышки
        flash = Image.new("RGB", out, (246, 226, 186))
        b = Image.blend(flash, b, u / 0.22)
    return b


def seal(data, path):
    nonce = os.urandom(12)
    open(path, "wb").write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


def webp(im, q=84):
    b = io.BytesIO()
    im.save(b, "WEBP", quality=q, method=6)
    return b.getvalue()


if os.environ.get("PREVIEW"):
    # Лист проверки глазами, без шифра и не в public.
    ks = [0, 10, 20, 28, 31, 34, 40, 50, 59]
    sheet = Image.new("RGB", (3 * 640 + 3 * 202, 3 * 360))
    for n, i in enumerate(ks):
        sheet.paste(frame(i, 16 / 9, (640, 360)), ((n % 3) * 842, (n // 3) * 360))
        sheet.paste(frame(i, 9 / 16, (202, 360)), ((n % 3) * 842 + 640, (n // 3) * 360))
    sheet.save(os.environ["PREVIEW"])
    sys.exit(0)

for i in range(N):
    seal(webp(frame(i, 16 / 9, (1920, 1080))), os.path.join(PUB, f"seq/d/f{i:02d}.bin"))
    seal(webp(frame(i, 9 / 16, (720, 1280))), os.path.join(PUB, f"seq/m/f{i:02d}.bin"))
    print(i, end=" ", file=sys.stderr, flush=True)

# Постеры: первый кадр — до расшифровки, последний — первый экран сайта.
for w in (1920, 2880):
    frame(0, 16 / 9, (w, round(w * 9 / 16))).save(os.path.join(PUB, f"poster-16-{w}.webp"), "WEBP", quality=86, method=6)
frame(0, 9 / 16, (1080, 1920)).save(os.path.join(PUB, "poster-9.webp"), "WEBP", quality=86, method=6)
for w in (1280, 1920):
    frame(N - 1, 16 / 9, (w, round(w * 9 / 16))).save(os.path.join(PUB, f"city-{w}.webp"), "WEBP", quality=84, method=6)
frame(N - 1, 9 / 16, (720, 1280)).save(os.path.join(PUB, "city-9.webp"), "WEBP", quality=84, method=6)
print("\nкадров", N, "× 2", file=sys.stderr)
