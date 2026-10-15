"""Кадры рендера → то, что едет на сайт: WebP и MP4.

    python3 pack.py <папка с f_NNNN.png> <куда> <flight|hero|stills> <horizontal|vertical>

flight   кадры пролёта для прокрутки: horizontal → d/ (1600×900, на сайт)
         и hq/ (1920×1080, запас), vertical → m/ (720×1280, на сайт) и
         mhq/ (1080×1920, запас); плюс ролик preview.mp4
hero     фон первого экрана: туда-обратно без шва, hero-1920.mp4 и
         hero-1280.mp4, кадр-заставка poster-*.webp
stills   кадры галереи: s-N.webp (1920), s-N-960.webp и s-N-full.webp (как отрендерено)

Запускается в Actions (blender-arhbyuro.yml), на сервере — никогда.
"""

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image


def webp(src, dst, size, quality):
    im = Image.open(src).convert("RGB")
    if im.size != size:
        im = im.resize(size, Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, "WEBP", quality=quality, method=6)


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def main():
    src, out, shot, fmt = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], sys.argv[4]
    frames = sorted(src.glob("f_*.png"))
    if not frames:
        raise SystemExit("нет кадров")
    out.mkdir(parents=True, exist_ok=True)
    if shot == "flight":
        for i, f in enumerate(frames, 1):
            if fmt == "vertical":
                webp(f, out / "m" / f"{i:04d}.webp", (720, 1280), 70)
                webp(f, out / "mhq" / f"{i:04d}.webp", (1080, 1920), 86)
            else:
                webp(f, out / "d" / f"{i:04d}.webp", (1600, 900), 74)
                webp(f, out / "hq" / f"{i:04d}.webp", (1920, 1080), 86)
        ffmpeg("-framerate", "30", "-i", str(src / "f_%04d.png"), "-vf", "scale=-2:720:flags=lanczos", "-c:v", "libx264",
               "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out / "preview.mp4"))
    elif shot == "hero":
        # Туда и обратно: камера плывёт и возвращается, петля без шва.
        seq = src / "seq"
        seq.mkdir(exist_ok=True)
        order = frames + frames[-2:0:-1]
        for i, f in enumerate(order, 1):
            shutil.copy(f, seq / f"{i:04d}.png")
        for w, h, crf in ((1920, 1080, 26), (1280, 720, 27)):
            ffmpeg("-framerate", "24", "-i", str(seq / "%04d.png"), "-vf", f"scale={w}:{h}:flags=lanczos",
                   "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p",
                   "-movflags", "+faststart", "-an", str(out / f"hero-{w}.mp4"))
        webp(frames[0], out / "poster-1920.webp", (1920, 1080), 78)
        webp(frames[0], out / "poster-1280.webp", (1280, 720), 74)
    else:
        for f in frames:
            i = int(f.stem.split("_")[1])
            im = Image.open(f)
            webp(f, out / f"s-{i}-full.webp", im.size, 88)
            for w, q in ((1920, 80), (960, 74)):
                name = f"s-{i}.webp" if w == 1920 else f"s-{i}-{w}.webp"
                webp(f, out / name, (w, round(im.height * w / im.width)), q)
    print(f"готово: {len(frames)} кадров → {out}")


if __name__ == "__main__":
    main()
