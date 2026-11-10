"""Пролёт Nek Dental Studio: 8 роликов Higgsfield → кадры прокрутки → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <папка h: v1..v4.mp4, k1..k5.png> <папка v: то же, 9:16>

Ролики — MiniMax H3, 2K, 10 с, 24 к/с, 10.11.2026, кадр начала и кадр конца —
ключевые кадры Nano Banana 2.1 4K по их фото (SOURCES.md), отдельно 16:9 и
9:16:
  v1 ресепшен со знаком → знак-цветок крупно;
  v2 сквозь лепестки знака → лаунж с бирюзовыми креслами;
  v3 лаунж → кабинет с фиолетовым креслом;
  v4 кабинет темнеет → реставрированный зуб на фиолетовом.
Владелец, 10.11.2026, про первую версию (6 с, каждый 4-й кадр, 158 кадров):
«Переходы абсолютно не плавные… слайдшоу какое-то». Поэтому ролики по 10 с
с медленной камерой и каждый второй кадр: около 480 кадров на пролёт, а
land.js ещё смешивает соседние. Реже STEP=2 не делать.
Последний кадр ролика совпадает с первым следующего, стык выбрасывается.
Компьютеру — 1280×720 (d/), телефону — 720×1280 из вертикальных роликов (m/).
В public кадры лежат только шифром, как у SamAuto и Optimal Prime:
AES-256-GCM, файл = 12 байт nonce + шифр. Ключ — `SCENE_KEY_NEK` в хранилище
секретов, макет получает его маршрутом app/proto/[token]/promo/scene. Открыты
только постеры (первый кадр) и ключевые кадры для версии без движения.
"""
import io, json, os, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image

STEP = 2
KEY = bytes.fromhex(os.environ.get("SCENE_KEY", "0" * 64))
assert len(KEY) == 32, "ключ — 32 байта"
HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "../../../public/protos/nek")
SRC = {"d": sys.argv[1], "m": sys.argv[2]}
SIZE = {"d": (1280, 720), "m": (720, 1280)}
Q = {"d": 74, "m": 70}


def frames(path):
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-q:v", "2", os.path.join(tmp, "%04d.jpg")], check=True)
    return [os.path.join(tmp, f) for f in sorted(os.listdir(tmp))]


def seal(data, path):
    nonce = os.urandom(12)
    with open(path, "wb") as f:
        f.write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


def webp(im, q):
    b = io.BytesIO()
    im.save(b, "WEBP", quality=q, method=6)
    return b.getvalue()


def sequence(kind):
    seq = []
    for v in range(4):
        fs = frames(os.path.join(SRC[kind], f"v{v + 1}.mp4"))
        seq += fs[1:] if v else fs
    pick = seq[::STEP]
    if pick[-1] != seq[-1]:
        pick.append(seq[-1])
    return pick


picks = {k: sequence(k) for k in ("d", "m")}
n = min(len(p) for p in picks.values())
# Число кадров у двух наборов одно: главы стоят на тех же долях сцены.
for k, p in picks.items():
    picks[k] = [p[round(i * (len(p) - 1) / (n - 1))] for i in range(n)]

if os.environ.get("PREVIEW"):
    ks = [round(i * (n - 1) / 11) for i in range(12)]
    for k, (w, h) in (("d", (320, 180)), ("m", (148, 262))):
        sheet = Image.new("RGB", (12 * w, h))
        for j, i in enumerate(ks):
            sheet.paste(Image.open(picks[k][i]).convert("RGB").resize((w, h)), (j * w, 0))
        sheet.save(os.environ["PREVIEW"] + f"-{k}.jpg", quality=80)
    print(n, "кадров", file=sys.stderr)
    sys.exit(0)

total = 0
for k in ("d", "m"):
    d = os.path.join(PUB, "seq", k)
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        os.remove(os.path.join(d, f))
    for i, f in enumerate(picks[k]):
        data = webp(Image.open(f).convert("RGB").resize(SIZE[k], Image.LANCZOS), Q[k])
        total += len(data)
        seal(data, os.path.join(d, f"f{i:03d}.bin"))
    first = Image.open(picks[k][0]).convert("RGB")
    if k == "d":
        first.resize((1920, 1080), Image.LANCZOS).save(os.path.join(PUB, "poster-16.webp"), "WEBP", quality=84, method=6)
    else:
        first.resize((720, 1280), Image.LANCZOS).save(os.path.join(PUB, "poster-9.webp"), "WEBP", quality=84, method=6)

# Ключевые кадры открыто: версия без движения и картинки сайта.
for i in range(1, 6):
    Image.open(os.path.join(SRC["d"], f"k{i}.png")).convert("RGB").resize((1600, 893), Image.LANCZOS).save(os.path.join(PUB, f"k{i}-16.webp"), "WEBP", quality=82, method=6)
    Image.open(os.path.join(SRC["m"], f"k{i}.png")).convert("RGB").resize((720, 1290), Image.LANCZOS).save(os.path.join(PUB, f"k{i}-9.webp"), "WEBP", quality=80, method=6)

with open(os.path.join(HERE, "media.json"), "w") as f:
    json.dump({"n": n}, f)
print("кадров", n, "× 2,", round(total / 1048576, 1), "МБ", file=sys.stderr)
