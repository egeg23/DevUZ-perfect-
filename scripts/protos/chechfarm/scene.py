"""Сцена первого экрана CZECHFARM: ролики → кадры WebP и видео телефона → шифр.

SCENE_KEY=<64 hex> python3 -I scene.py <папка с роликами и ключевыми кадрами>

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
PACK = 24
# Ширина, качество WebP и кадров из каждого ролика; телефону — ролики m-*.
# 48 кадров на ролик было мало (владелец, 12.11.2026: «очень грубый переход»):
# один взмах пальца пролистывал ролик целиком. Телефону 97 (как у Nek), компьютеру 73.
FMT = {"d": (1920, 68, 73), "p": (720, 66, 97)}


def seal(data, path):
    nonce = os.urandom(12)
    with open(path, "wb") as f:
        f.write(nonce + AESGCM(KEY).encrypt(nonce, data, None))


def count(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return int(out.stdout.strip())


def cut(src_fmt, width, q, N, tmp):
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
json.dump(meta, open(os.path.join(HERE, "scene.json"), "w"))
print(meta, file=sys.stderr)
