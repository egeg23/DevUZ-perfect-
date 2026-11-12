"""Сцена первого экрана CZECHFARM: ролики → кадры WebP и видео телефона → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <папка с роликами и ключевыми кадрами>
VIDEO=1 … — только видео телефона (m.bin), кадры не трогаем.

Владелец, 12.11.2026: «вау анимацию скрола в хиро секции. Из ролика можно
взять завод. Оттуда падает упаковка, летит вниз, наполняется таблетками,
упаковывается в красивую упаковку, летит с ускорением будто от лица упаковки,
влетает в аптеку и ложится на полку с названием их бренда».

В папке: d-a.mp4 … d-e.mp4 (16:9) и m-a.mp4 … m-e.mp4 (9:16) — пять переходов
Kling 3.0 между шестью ключевыми кадрами nano banana 4K (завод, пустая
баночка, полная, коробка, полёт, полка): k0.png … k5.png и k0m.png … k5m.png.
Ролики и кадры 4K лежат вне репозитория.

Пишем в public/protos/chechfarm/seq:
- dNN.bin и pNN.bin — кадры компьютера (WebP 1920) и телефона (WebP 720)
  пачками по PACK, зашифрованы. Пачка = 4 байта числа кадров, по 4 байта
  длины каждого, потом сами WebP подряд (как у Cosmo World: сотни отдельных
  файлов с телефона не успевали прийти);
- m.bin — видео телефона: все кадры роликов m-*, H.264 720, под тем же шифром;
  кадры pNN.bin остаются запасным путём (телефон не умеет mp4, play() отказал);
- p-<d|m>-<0…5>.webp — шесть открытых постеров: их видно, пока сцена
  грузится, без движения и когда ключ не пришёл.
Шифр как у SamAuto (samauto/seal.py): AES-256-GCM, файл = 12 байт nonce +
шифр; ключ — `SCENE_KEY_CHECHFARM` в хранилище. Число кадров, размер пачки и
места ключевых кадров — в scene.json рядом с gen.mjs.
"""
import json, os, shutil, subprocess, sys, tempfile
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image

SRC = sys.argv[1]
KEY = bytes.fromhex(os.environ["SCENE_KEY"])
assert len(KEY) == 32, "ключ — 32 байта"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "../../../public/protos/chechfarm/seq")
CLIPS = "abcde"
N = 48          # кадров из каждого ролика
PACK = 24
FMT = {"d": (1920, 72), "p": (720, 72)}  # ширина и качество WebP; телефону — ролики m-*


def seal(data, path):
    nonce = os.urandom(12)
    with open(path, "wb") as f:
        f.write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


def count(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return int(out.stdout.strip())


def cut(src_fmt, width, q, tmp):
    """Кадры всех роликов подряд; первый кадр следующего ролика — тот же ключевой, его пропускаем."""
    frames, keys = [], [0]
    for ci, c in enumerate(CLIPS):
        src = os.path.join(SRC, f"{src_fmt}-{c}.mp4")
        k = count(src)
        pick = [round(i * (k - 1) / (N - 1)) for i in range(N)][1 if ci else 0:]
        sel = "+".join(f"eq(n\\,{i})" for i in pick)
        pat = os.path.join(tmp, f"{src_fmt}{c}_%03d.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"select='{sel}',scale={width}:-2:flags=lanczos", "-vsync", "0", pat], check=True)
        for i in range(len(pick)):
            w = os.path.join(tmp, "f.webp")
            Image.open(pat % (i + 1)).convert("RGB").save(w, "WEBP", quality=q, method=6)
            frames.append(open(w, "rb").read())
            os.remove(pat % (i + 1))
        keys.append(len(frames) - 1)
    return frames, keys


FPS = 24


def video():
    """Телефону — одно видео m.bin: все кадры вертикальных роликов подряд (на
    стыке ключевой кадр один раз), H.264, ключевой каждый третий, без B-кадров.
    Телефон перематывает его аппаратно; кадры-картинки он распаковывать не
    успевал (владелец, 12.11.2026: «на таблетках пролёт всё так же лагает»).
    Приём из Nek и SamAuto. Возвращает число кадров и места ключевых."""
    lst = tempfile.mkdtemp()
    n, keys = 0, [0]
    for ci, c in enumerate(CLIPS):
        part = os.path.join(lst, c)
        os.makedirs(part)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(SRC, f"m-{c}.mp4"), "-vsync", "0", "-q:v", "2", os.path.join(part, "%04d.jpg")], check=True)
        fs = sorted(os.listdir(part))[1 if ci else 0:]
        for f in fs:
            os.rename(os.path.join(part, f), os.path.join(lst, f"{n:05d}.jpg"))
            n += 1
        keys.append(n - 1)
    mp4 = os.path.join(lst, "m.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(lst, "%05d.jpg"), "-vf", "scale=720:-2:flags=lanczos",
                    "-c:v", "libx264", "-preset", "slow", "-tune", "film", "-crf", "27", "-g", "3", "-keyint_min", "1", "-bf", "0",
                    "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", "-an", mp4], check=True)
    os.makedirs(OUT, exist_ok=True)
    seal(open(mp4, "rb").read(), os.path.join(OUT, "m.bin"))
    print("видео", n, "кадров,", round(os.path.getsize(mp4) / 1048576, 1), "МБ", file=sys.stderr)
    shutil.rmtree(lst)
    return {"v": n, "vk": keys, "fps": FPS}


META = os.path.join(HERE, "scene.json")
if os.environ.get("VIDEO"):
    # Только видео телефона: кадры не трогаем, их шифр в git не меняется.
    m = json.load(open(META))
    m.update(video())
    json.dump(m, open(META, "w"))
    sys.exit(0)

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
meta = {"pack": PACK}
with tempfile.TemporaryDirectory() as tmp:
    for fmt, src_fmt in (("d", "d"), ("p", "m")):
        frames, keys = cut(src_fmt, *FMT[fmt], tmp)
        for k in range(0, len(frames), PACK):
            part = frames[k:k + PACK]
            head = len(part).to_bytes(4, "little") + b"".join(len(x).to_bytes(4, "little") for x in part)
            seal(head + b"".join(part), os.path.join(OUT, f"{fmt}{k // PACK:02d}.bin"))
        meta[fmt] = len(frames)
        meta[fmt + "k"] = keys
        print(fmt, len(frames), "кадров", round(sum(map(len, frames)) / 1048576, 1), "МБ", file=sys.stderr)

for fmt, suf, width in (("d", "", 1920), ("m", "m", 828)):
    for i in range(len(CLIPS) + 1):
        im = Image.open(os.path.join(SRC, f"k{i}{suf}.png")).convert("RGB")
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        im.save(os.path.join(OUT, f"p-{fmt}-{i}.webp"), "WEBP", quality=80, method=6)
meta.update(video())
json.dump(meta, open(META, "w"))
print(meta, file=sys.stderr)
