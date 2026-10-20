"""Медиа макета «Сияние Севера»: из оригиналов Higgsfield — то, что идёт на сайт.

    python3 -I scripts/protos/syanie/media.py <папка с оригиналами>

В папке (её в репозиторий не кладём, оригиналы лежат в Higgsfield, ссылки в
README):
  h/i1..i4.mp4   пролёт по клинике, 16:9      v/i1..i4.mp4   то же, 9:16
  h/s1..s7.mp4   сцены прокрутки, 16:9        v/s1..s7.mp4   то же, 9:16
  k/*.png        ключевые кадры 4K            site/*.png|jpg их фото с сайта
  bg/*.png       фоны блоков 4K

Что выходит в public/protos/syanie:
  film-16.mp4, film-9.mp4      кино первого экрана: 4 сцены встык, без звука
  film-16.webp, film-9.webp    первый кадр кино, стоит сразу
  s16/NNN.webp, s9/NNN.webp    кадры сцен прокрутки (каждый второй кадр видео)
  calm-N-16/9.webp             ключевые кадры для спокойной версии
  bg-*-16/9.webp, p-*.webp, dr-*.webp, icon-192.png, apple-180.png
и scripts/protos/syanie/media.json — сколько кадров, для gen.mjs и site.js.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw

SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "../../../public/protos/syanie"))
os.makedirs(OUT, exist_ok=True)

# Кино: 4 сцены по ~5 с; ускоряем, чтобы пролёт шёл ~16 с.
FILM_SPEED = 1.25
# Сцены прокрутки: каждый STEP-й кадр видео 24 к/с. Горизонтальная версия
# легче: каждый третий кадр и 1280 px (canvas смешивает соседние кадры, так
# что прокрутка не идёт ступеньками), вертикальная — каждый второй.
STEP = {"16": 3, "9": 2}
SIZES = {"16": (1280, 720), "9": (720, 1280)}
QUALITY = 62


def run(*a):
    subprocess.run(a, check=True)


def frames(mp4, size, every, dst, start):
    """Кадры видео в WebP, начиная с номера start; возвращает число кадров."""
    tmp = tempfile.mkdtemp()
    w, h = size
    run("ffmpeg", "-v", "error", "-y", "-i", mp4, "-vf",
        f"select='not(mod(n\\,{every}))',scale={w}:{h}:flags=lanczos",
        "-vsync", "vfr", os.path.join(tmp, "%04d.png"))
    names = sorted(os.listdir(tmp))
    for i, n in enumerate(names):
        Image.open(os.path.join(tmp, n)).convert("RGB").save(
            os.path.join(dst, "%03d.webp" % (start + i)), "WEBP", quality=QUALITY, method=6)
    shutil.rmtree(tmp)
    return len(names)


def film(fmt):
    w, h = SIZES[fmt]
    d = "h" if fmt == "16" else "v"
    parts = [os.path.join(SRC, d, f"i{i}.mp4") for i in range(1, 5)]
    # Последний кадр сцены — первый кадр следующей: у второй и дальше первый
    # кадр срезаем, чтобы не стоял дважды.
    inputs, filt = [], []
    for i, p in enumerate(parts):
        inputs += ["-i", p]
        trim = f"trim=start_frame={1 if i else 0}," if i else ""
        filt.append(f"[{i}:v]{trim}setpts=PTS-STARTPTS,scale={w}:{h}:flags=lanczos,fps=24[v{i}]")
    filt.append("".join(f"[v{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=1:a=0,setpts=PTS/{FILM_SPEED}[out]")
    mp4 = os.path.join(OUT, f"film-{fmt}.mp4")
    run("ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "27" if fmt == "16" else "26", "-pix_fmt", "yuv420p",
        "-profile:v", "high", "-g", "48", "-an", "-movflags", "+faststart", mp4)
    tmp = os.path.join(tempfile.mkdtemp(), "p.png")
    run("ffmpeg", "-v", "error", "-y", "-i", mp4, "-frames:v", "1", tmp)
    Image.open(tmp).convert("RGB").save(os.path.join(OUT, f"film-{fmt}.webp"), "WEBP", quality=70, method=6)


def implant_shot(fmt):
    """Видео перед сборкой заголовка: имплант, макро, рой (imp/h|v/1-2.mp4)."""
    w, h = SIZES[fmt]
    d = "h" if fmt == "16" else "v"
    parts = [os.path.join(SRC, "imp", d, f"{i}.mp4") for i in (1, 2)]
    filt = [f"[0:v]setpts=PTS-STARTPTS,scale={w}:{h}:flags=lanczos,fps=24[v0]",
            f"[1:v]trim=start_frame=1,setpts=PTS-STARTPTS,scale={w}:{h}:flags=lanczos,fps=24[v1]",
            "[v0][v1]concat=n=2:v=1:a=0,setpts=PTS/1.35[out]"]
    run("ffmpeg", "-v", "error", "-y", "-i", parts[0], "-i", parts[1], "-filter_complex", ";".join(filt), "-map", "[out]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-profile:v", "high", "-g", "48",
        "-an", "-movflags", "+faststart", os.path.join(OUT, f"imp-{fmt}.mp4"))


def story(fmt):
    d = "h" if fmt == "16" else "v"
    dst = os.path.join(OUT, "s" + fmt)
    shutil.rmtree(dst, ignore_errors=True)
    os.makedirs(dst)
    n = 0
    seg = []
    for i in range(1, 8):
        k = frames(os.path.join(SRC, d, f"s{i}.mp4"), SIZES[fmt], STEP[fmt], dst, n)
        seg.append(n)
        n += k
    return n, seg


def still(src, name, size, q=72, crop=None):
    im = Image.open(src).convert("RGB")
    if crop:
        im = im.crop(crop)
    w, h = size
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    im.crop((x, y, x + w, y + h)).save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6)


def pair(src16, src9, name):
    still(src16, name + "-16", (1600, 900))
    still(src9, name + "-9", (900, 1600))


def main():
    if len(sys.argv) > 2 and sys.argv[2] == "16":
        # Черновой прогон без вертикальных сцен: только 16:9.
        film("16")
        n, seg = story("16")
        with open(os.path.join(HERE, "media.json"), "w") as f:
            json.dump({"s16": n, "s9": n, "seg16": seg, "seg9": seg, "screens": 8}, f)
        return
    if len(sys.argv) > 2 and sys.argv[2] == "imp":
        implant_shot("16")
        implant_shot("9")
        return
    film("16")
    film("9")
    implant_shot("16")
    implant_shot("9")
    n16, seg16 = story("16")
    n9, seg9 = story("9")
    k = os.path.join(SRC, "k")
    pair(f"{k}/k6h.png", f"{k}/k6v.png", "calm-1")
    pair(f"{k}/k8h.png", f"{k}/k8v.png", "calm-2")
    pair(f"{k}/k10h.png", f"{k}/k10v.png", "calm-3")
    pair(f"{k}/k12h.png", f"{k}/k12v.png", "calm-4")
    bg = os.path.join(SRC, "bg")
    for name in ("onyx", "titan", "lab", "street"):
        pair(f"{bg}/{name}-h.png", f"{bg}/{name}-v.png", "bg-" + name)
    site = os.path.join(SRC, "site")
    # Их фото с сайта: ресепшен, коридор, два кабинета, врач у снимка.
    for src, name in (("rec.png", "p-rec"), ("cor.png", "p-cor"), ("cab.png", "p-cab"), ("cab2.png", "p-cab2"), ("xray.jpg", "p-xray")):
        im = Image.open(os.path.join(site, src)).convert("RGB")
        im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=80, method=6)
    # Врачи: их фото с сайта, переснятые Nano Banana в 2K с их же снимками
    # опорой (владелец, 20.10.2026: «размытые… качество должно быть высокое»).
    # Оригиналы — dr/*.png, ID задач в SOURCES.md.
    for src, name in (("reutov.png", "dr-reutov"), ("savin.png", "dr-savin")):
        im = Image.open(os.path.join(SRC, "dr", src)).convert("RGB").resize((900, 900), Image.LANCZOS)
        im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=82, method=6)
    # Значок вкладки: их зуб на графите.
    for px, name in ((192, "icon-192.png"), (180, "apple-180.png")):
        im = Image.new("RGB", (px, px), (13, 14, 15))
        d = ImageDraw.Draw(im)
        s = px / 40
        d.ellipse((8 * s, 8 * s, 32 * s, 32 * s), outline=(201, 150, 90), width=max(2, round(1.4 * s)))
        d.rounded_rectangle((14 * s, 13 * s, 26 * s, 27 * s), radius=5 * s, fill=(239, 235, 229))
        im.save(os.path.join(OUT, name))
    meta = {"s16": n16, "s9": n9, "seg16": seg16, "seg9": seg9, "screens": 8}
    with open(os.path.join(HERE, "media.json"), "w") as f:
        json.dump(meta, f)
    print(meta)


main()
