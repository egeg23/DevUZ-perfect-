"""Пролёт Nek Dental Studio: 4 ролика Higgsfield → кадры прокрутки → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <папка с v1.mp4..v4.mp4> <папка с k1.png..k5.png>

Ролики — MiniMax H3, 2K (2560×1440), 6 с, 24 к/с, 10.11.2026, кадр начала и
кадр конца — ключевые кадры Nano Banana 2.1 4K по их фото (SOURCES.md):
  v1 ресепшен со знаком → знак-цветок крупно;
  v2 сквозь лепестки знака → лаунж с бирюзовыми креслами;
  v3 лаунж → кабинет с фиолетовым креслом;
  v4 кабинет темнеет → реставрированный зуб на фиолетовом.
Последний кадр ролика совпадает с первым следующего, поэтому стык
выбрасывается. Берём каждый STEP-й кадр. Компьютеру — 1600×900 (d/),
телефону — окно 9:16 за точкой интереса, 720×1280 (m/): ролики под телефон
отдельно не снимали, широкий кадр 2K даёт окно 810×1440, этого хватает.
В public кадры лежат только шифром, как у SamAuto и Optimal Prime: AES-256-GCM,
файл = 12 байт nonce + шифр. Ключ — `SCENE_KEY_NEK` в хранилище секретов,
макет получает его маршрутом app/proto/[token]/promo/scene. Открыты только
постеры (первый кадр) и ключевые кадры для спокойной версии без движения.
"""
import io, json, os, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image

STEP = 4
KEY = bytes.fromhex(os.environ.get("SCENE_KEY", "0" * 64))
assert len(KEY) == 32, "ключ — 32 байта"
HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "../../../public/protos/nek")
VID, KF = sys.argv[1], sys.argv[2]

# Центр окна телефона по ширине кадра: начало и конец каждого ролика.
FOCUS = [(0.36, 0.5), (0.5, 0.42), (0.42, 0.58), (0.58, 0.5)]


def frames(path):
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-i", path, os.path.join(tmp, "%04d.png")], check=True)
    return [os.path.join(tmp, f) for f in sorted(os.listdir(tmp))]


def seal(data, path):
    nonce = os.urandom(12)
    with open(path, "wb") as f:
        f.write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


def webp(im, q):
    b = io.BytesIO()
    im.save(b, "WEBP", quality=q, method=6)
    return b.getvalue()


def phone(im, fx):
    w = round(im.height * 9 / 16)
    x = max(0, min(im.width - w, round(fx * im.width - w / 2)))
    return im.crop((x, 0, x + w, im.height)).resize((720, 1280), Image.LANCZOS)


seq = []  # (кадр, центр окна телефона)
for v in range(4):
    fs = frames(os.path.join(VID, f"v{v + 1}.mp4"))
    if v:
        fs = fs[1:]
    a, b = FOCUS[v]
    for i, f in enumerate(fs):
        k = i / max(1, len(fs) - 1)
        seq.append((f, a + (b - a) * (3 * k * k - 2 * k ** 3)))
pick = seq[::STEP]
if pick[-1] != seq[-1]:
    pick.append(seq[-1])

if os.environ.get("PREVIEW"):
    ks = [round(i * (len(pick) - 1) / 11) for i in range(12)]
    sheet = Image.new("RGB", (4 * 466, 3 * 262 + 3 * 0))
    sheetm = Image.new("RGB", (12 * 148, 262))
    for n, i in enumerate(ks):
        im = Image.open(pick[i][0]).convert("RGB")
        sheet.paste(im.resize((466, 262)), ((n % 4) * 466, (n // 4) * 262))
        sheetm.paste(phone(im, pick[i][1]).resize((148, 262)), (n * 148, 0))
    sheet.save(os.environ["PREVIEW"] + "-d.jpg", quality=80)
    sheetm.save(os.environ["PREVIEW"] + "-m.jpg", quality=80)
    print(len(pick), "кадров", file=sys.stderr)
    sys.exit(0)

for sub in ("seq/d", "seq/m"):
    d = os.path.join(PUB, sub)
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        os.remove(os.path.join(d, f))

for n, (f, fx) in enumerate(pick):
    im = Image.open(f).convert("RGB")
    seal(webp(im.resize((1600, 900), Image.LANCZOS), 80), os.path.join(PUB, f"seq/d/f{n:03d}.bin"))
    seal(webp(phone(im, fx), 78), os.path.join(PUB, f"seq/m/f{n:03d}.bin"))
    if n == 0:
        im.resize((1920, 1080), Image.LANCZOS).save(os.path.join(PUB, "poster-16.webp"), "WEBP", quality=84, method=6)
        phone(im, fx).save(os.path.join(PUB, "poster-9.webp"), "WEBP", quality=84, method=6)
    print(n, end=" ", file=sys.stderr, flush=True)

# Ключевые кадры открыто: спокойная версия без движения и картинки сайта.
for i in range(1, 6):
    im = Image.open(os.path.join(KF, f"k{i}.png")).convert("RGB")
    im.resize((1600, round(1600 * im.height / im.width)), Image.LANCZOS).save(os.path.join(PUB, f"k{i}-16.webp"), "WEBP", quality=82, method=6)
    w = round(im.height * 9 / 16)
    fx = [0.36, 0.5, 0.42, 0.58, 0.5][i - 1]
    x = max(0, min(im.width - w, round(fx * im.width - w / 2)))
    im.crop((x, 0, x + w, im.height)).resize((720, 1280), Image.LANCZOS).save(os.path.join(PUB, f"k{i}-9.webp"), "WEBP", quality=80, method=6)

with open(os.path.join(HERE, "media.json"), "w") as f:
    json.dump({"n": len(pick)}, f)
print("\nкадров", len(pick), "× 2", file=sys.stderr)
