"""Монтаж кино-ролика для главной devuz.studio.

Источники (Higgsfield): v1.mp4 — пролёт по офису, v2.mp4 — вылет в окно и разворот,
i1-i3.png — наши макеты на мониторах, s3.png — фасад. Финал: окна фасада зажигаются
надписью DEVUZ, люди внутри продолжают работать.

python3 film.py out.mp4 [--preview]
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

FF = os.environ.get("FFMPEG", "ffmpeg")
D = os.environ.get("FILM_SRC", "film-src")  # папка с исходниками из Higgsfield, см. README
W, H, FPS = 1280, 720, 24
BAR = 92  # 2.39:1 внутри 16:9
OUT = sys.argv[1] if len(sys.argv) > 1 else D + "/out/film.mp4"
PREVIEW = "--preview" in sys.argv


def decode(path):
    p = subprocess.run(
        [FF, "-hide_banner", "-loglevel", "error", "-i", path, "-vf",
         f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS}",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.uint8).reshape(-1, H, W, 3)


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def zoom(img, s, cx, cy):
    """Кадр из большой картинки: масштаб s, центр (cx, cy) в долях."""
    iw, ih = img.size
    cw, ch = iw / s, ih / s
    x0 = min(max(cx * iw - cw / 2, 0), iw - cw)
    y0 = min(max(cy * ih - ch / 2, 0), ih - ch)
    return np.asarray(img.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch)))


# ---------- грейд: общий для всех кадров ----------
x = np.linspace(0, 1, 256)
curve = np.clip(0.5 + (x - 0.5) * 1.07, 0, 1) ** 1.04
ws, wh = (1 - curve) ** 2, curve ** 2
LUT = np.stack([
    curve + 0.030 * wh - 0.018 * ws,
    curve + 0.004 * ws - 0.004 * wh,
    curve + 0.034 * ws - 0.032 * wh,
], 1)
LUT = (np.clip(LUT, 0, 1) * 255).astype(np.uint8)
yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIG = (1 - 0.20 * np.clip(r - 0.35, 0, 1) ** 1.6).astype(np.float32)[..., None]
RNG = np.random.default_rng(7)


def grade(f, expo=1.0):
    g = np.stack([LUT[f[..., c], c] for c in range(3)], -1)
    g = g.astype(np.float32) * VIG * expo
    g += RNG.normal(0, 2.4, (H, W, 1)).astype(np.float32)  # зерно
    g = np.clip(g, 0, 255).astype(np.uint8)
    g[:BAR] = 0
    g[H - BAR:] = 0
    return g


# ---------- финал: DEVUZ в окнах ----------
FONT = {
    "D": ["XXXX.", "X...X", "X...X", "X...X", "XXXX."],
    "E": ["XXXXX", "X....", "XXXX.", "X....", "XXXXX"],
    "V": ["X...X", "X...X", "X...X", ".X.X.", "..X.."],
    "U": ["X...X", "X...X", "X...X", "X...X", ".XXX."],
    "Z": ["XXXXX", "...X.", "..X..", ".X...", "XXXXX"],
}
PANE_X0, PANE_W, PANES = 475.0, 56.5, 32
FLOORS = [(35, 117), (195, 281), (358, 445), (523, 610), (685, 775), (844, 939),
          (1014, 1102), (1178, 1271), (1344, 1437)]


def pane_rect(j, i):
    x0 = PANE_X0 + PANE_W * j + 3
    y0, y1 = FLOORS[i]
    return int(x0), int(y0 - 8), int(x0 + PANE_W - 6), int(y1 + 2)


class Facade:
    def __init__(self):
        self.img = Image.open(D + "/s3.png").convert("RGB")
        self.base = np.asarray(self.img).astype(np.float32)
        b = self.base
        lum = b @ np.array([0.30, 0.59, 0.11], np.float32)
        warm = np.array([255, 212, 152], np.float32)
        # свет в окне: яркость стекла сохраняет силуэты людей и мониторов
        self.lit = np.clip(warm * (np.clip(lum / 100.0, 0, 2.4) ** 0.7)[..., None] * 1.25 + 10, 0, 255)
        self.haze = np.array([214, 150, 82], np.float32)
        on = {}
        rng = np.random.default_rng(3)
        j0, i0 = 1, 2
        for n, ch in enumerate("DEVUZ"):
            for row, line in enumerate(FONT[ch]):
                for col, c in enumerate(line):
                    if c == "X":
                        on[(j0 + n * 6 + col, i0 + row)] = 0.30 + n * 0.30 + rng.uniform(0, 0.28)
        self.letter = [(pane_rect(j, i), t) for (j, i), t in on.items()]
        # перемычки между соседними горящими окнами одной буквы: свет держит штрих буквы
        self.bridge = []
        for (j, i), t in on.items():
            x0, y0, x1, y1 = pane_rect(j, i)
            if (j + 1, i) in on:
                nx0 = pane_rect(j + 1, i)[0]
                self.bridge.append(((x1, y0, nx0, y1), max(t, on[(j + 1, i)]), 0.70))
            if (j, i + 1) in on:
                ny0 = pane_rect(j, i + 1)[1]
                self.bridge.append(((x0, y1, x1, ny0), max(t, on[(j, i + 1)]), 0.30))
        self.glass = [pane_rect(j, i) for j in range(PANES) for i in range(len(FLOORS))]

    @staticmethod
    def flick(dt):
        """Лампы зажигаются с дрожью: вкл, почти выкл, вкл, полу, вкл."""
        k = int(round(dt * FPS))
        if k < 0:
            return 0.0
        return [1.0, 0.18, 0.95, 0.45, 1.0][k] if k < 5 else 1.0

    def frame(self, t):
        hh, ww = self.base.shape[:2]
        dim = 1 - 0.52 * ease((t - 0.2) / 1.8)
        m_dim = np.ones((hh, ww), np.float32)
        for (x0, y0, x1, y1) in self.glass:
            m_dim[y0:y1, x0:x1] = dim
        m_on = np.zeros((hh, ww), np.float32)
        for (x0, y0, x1, y1), t_on in self.letter:
            o = self.flick(t - t_on)
            if o:
                m_on[y0:y1, x0:x1] = o
        m_br = np.zeros((hh, ww), np.float32)
        for (x0, y0, x1, y1), t_on, k in self.bridge:
            o = self.flick(t - t_on)
            if o:
                m_br[y0:y1, x0:x1] = o * k
        img = self.base * m_dim[..., None]
        img = img * (1 - m_on[..., None]) + self.lit * m_on[..., None]
        img = img * (1 - m_br[..., None]) + self.haze * m_br[..., None]
        # ореол вокруг горящих окон: близкий и широкий
        src = Image.fromarray((np.maximum(m_on, m_br)[::4, ::4] * 255).astype(np.uint8))
        g1 = np.asarray(src.filter(ImageFilter.GaussianBlur(7)).resize((ww, hh), Image.BILINEAR)).astype(np.float32) / 255
        g2 = np.asarray(src.filter(ImageFilter.GaussianBlur(26)).resize((ww, hh), Image.BILINEAR)).astype(np.float32) / 255
        img += (g1 * 0.75 + g2 * 0.55)[..., None] * np.array([150, 102, 52], np.float32)
        img = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
        s = 1.0 + 0.05 * ease(t / 4.4)
        return zoom(img, s, 0.5, 0.475)


def blend(a, b, k):
    return (a.astype(np.float32) * (1 - k) + b.astype(np.float32) * k).astype(np.uint8)


def main():
    v1 = decode(D + "/vid/v1.mp4")
    v2 = decode(D + "/vid/v2.mp4")
    ins = [(Image.open(D + f"/{n}.png").convert("RGB"), c) for n, c in
           [("i1", (0.63, 0.46)), ("i2", (0.59, 0.50)), ("i3", (0.52, 0.47))]]
    fac = Facade()

    clips = []  # (кадры-генератор, длина, экспозиция)
    A = len(v1) - 12
    clips.append((lambda k: v1[k], A, 0.90))
    for img, (cx, cy) in ins:
        n = 30

        def gen(k, img=img, cx=cx, cy=cy, n=n):
            u = k / (n - 1)
            return zoom(img, 1.0 + 0.10 * u, 0.5 + (cx - 0.5) * u, 0.5 + (cy - 0.5) * u)
        clips.append((gen, n, 1.0))
    clips.append((lambda k: v2[k], len(v2), 1.0))
    clips.append((lambda k: fac.frame(k / FPS), int(4.6 * FPS), 1.0))
    XF = [8, 4, 4, 8, 6]  # кадров на переход между соседними

    def encoder(path, h, crf):
        return subprocess.Popen(
            [FF, "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
             "-s", f"{W}x{h}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
             "-preset", "veryfast" if PREVIEW else "slow", "-crf", str(crf), "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", path], stdin=subprocess.PIPE)

    # с полосами — посмотреть и переслать; без полос — для сайта, полосы рисует страница
    enc = encoder(OUT, H, 27)
    site = encoder(OUT.replace(".mp4", "-site.mp4"), H - 2 * BAR, 28)

    # раскладка по времени: каждый клип начинается на XF раньше конца предыдущего
    starts, t = [], 0
    for idx, (_, n, _) in enumerate(clips):
        starts.append(t)
        t += n - (XF[idx] if idx < len(XF) else 0)
    total = starts[-1] + clips[-1][1]
    POSTER = starts[-1] + int(3.5 * FPS)  # DEVUZ горит, до затемнения
    cache = {}

    def get(ci, k):
        key = (ci, k)
        if key not in cache:
            fn, n, ex = clips[ci]
            cache[key] = grade(fn(min(k, n - 1)), ex)
        return cache[key]

    for f in range(total):
        live = [ci for ci, (_, n, _) in enumerate(clips) if starts[ci] <= f < starts[ci] + n]
        if len(live) == 1:
            ci = live[0]
            fr = get(ci, f - starts[ci])
        else:
            a, b = live[0], live[1]
            xf = XF[a]
            k = (f - starts[b] + 1) / (xf + 1)
            fa, fb = get(a, f - starts[a]), get(b, f - starts[b])
            fr = blend(fa, fb, ease(k))
            # вспышка света на склейке экранов
            if a in (0, 3):
                fr = np.clip(fr.astype(np.int16) + int(26 * np.sin(np.pi * k)), 0, 255).astype(np.uint8)
                fr[:BAR] = 0
                fr[H - BAR:] = 0
        # затемнение в начале и в конце
        if f < 12:
            fr = (fr.astype(np.float32) * ease(f / 12)).astype(np.uint8)
        if f > total - 16:
            fr = (fr.astype(np.float32) * ease((total - 1 - f) / 15)).astype(np.uint8)
        enc.stdin.write(fr.tobytes())
        site.stdin.write(np.ascontiguousarray(fr[BAR:H - BAR]).tobytes())
        if f == POSTER:
            Image.fromarray(fr[BAR:H - BAR]).save(OUT.replace(".mp4", "-poster.webp"), quality=80, method=6)
        for key in [k for k in cache if k[0] not in live]:
            del cache[key]
        cache = {k: v for k, v in cache.items() if k[1] >= f - starts[k[0]] - 1}
    for e in (enc, site):
        e.stdin.close()
        e.wait()
    print("frames", total, "sec", round(total / FPS, 2))


if __name__ == "__main__":
    main()
