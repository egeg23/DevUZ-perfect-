# Ролик движения врача для «Наших врачей»: настоящее видео вместо ленты кадров.
#   python3 -I clip.py <a|r|t> <видео.mp4> <без-фона.mp4> <кэш-папка> <выход.mp4>
# a — идёт к нам издалека, r — уходит вдаль (камера стоит, врач растёт или уменьшается в кадре),
# t — разворот лицом → спиной. Кадры (обе половины, PNG) остаются в <кэш>/v: разворот, уход и
# обратный разворот склеивает в один ролик pack.py.
#
# Владелец, 20.11.2026: «Киношные походки, плавные, будто это видео. Может сделать видео проще с
# их выходом, которое активируется по нажатии на врача», и до этого: «вокруг контура врача белый
# контур, сделай красиво». Лента кадров (sprite.py) шла около 18 кадров в секунду, с вырезанным
# шагом и ускорением, — отсюда рывки. Здесь каждый кадр ролика остаётся (24 в секунду), ролик
# только чуть быстрее; смена позы рук до и после шагов — через кадр.
#
# Прозрачности в H.264 нет, а видео с прозрачностью Safari на iPhone не играет. Поэтому кадр
# ролика — две половины: сверху цвет, снизу прозрачность серым («stacked alpha»); на сайте их
# складывает WebGL (team.js). Так видео играет везде одним файлом.
# Белый контур врисован в кадр (как и в кадры врача лицом и спиной, outline.py): тонкая белая
# линия по силуэту и мягкое свечение за ней, толщина — доля роста фигуры.
# В ответе (в FIGS, catalog.mjs, поле v): fps, n, tw, ms, p (путь по кадрам, 0…1000) или go.
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tone import cloth, retone, solo
from outline import ring

kind, vid, nobg, cache, out = sys.argv[1:6]
H = 880          # высота рамки фигуры (как кадр врача лицом), точек
E = 0.03         # поле сверху и снизу (доля H): место белому контуру и свечению над головой и под ногами
HF = int(round(H * (1 + 2 * E) / 2) * 2)   # высота кадра ролика
PAD = 0.32       # поля по бокам: при шаге и развороте руки и ноги выходят за силуэт стоящего
FPS = {"a": 30, "r": 32, "t": 60}[kind]   # кадры ролика (24 в секунду) идут чуть быстрее
POSE = 2         # смена позы до и после шагов: каждый второй кадр
LONG = {"a": 66, "r": 66}.get(kind)       # шагов больше нужного — из середины вырезан целый шаг


def body_box(a):
    m = a > 140
    rows = np.where(m.any(axis=1))[0]
    cols = np.where(m.any(axis=0))[0]
    return [int(cols[0]) - 8, int(rows[0]) - 8, int(cols[-1]) + 8, int(rows[-1]) + 4]


def matte(o, nb):
    """Прозрачность сравнением ролика (серый фон) с его версией без фона (на чёрном) — как в sprite.py."""
    o = np.asarray(o.convert("RGB"), dtype=np.float32)
    nb = np.asarray(nb.convert("RGB"), dtype=np.float32)
    bg = (nb.max(axis=2) < 10) & (o.mean(axis=2) > 120)
    G = o.copy()
    G[~bg] = o[bg].mean(axis=0) if bg.any() else 200
    G = np.asarray(Image.fromarray(np.clip(G, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(16)), dtype=np.float32)
    a = 1 - (np.clip(o - nb, 0, None) / np.maximum(G, 1)).mean(axis=2)
    a = np.clip((a - 0.06) / 0.88, 0, 1)
    a[bg] = 0
    A = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(0.5))
    an = np.asarray(A, dtype=np.float32)[..., None] / 255
    F = np.where(an > 0.02, nb / np.maximum(an, 0.02), 0)
    return solo(Image.fromarray(np.concatenate([np.clip(F, 0, 255), an * 255], axis=2).astype(np.uint8), "RGBA"))


def frames():
    """Кадры ролика без фона в полном размере; считаются один раз (кэш)."""
    if not os.path.exists(cache + "/done"):
        for d in ("o", "n", "m"):
            os.makedirs(f"{cache}/{d}", exist_ok=True)
        for src, d in ((vid, "o"), (nobg, "n")):
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, f"{cache}/{d}/%03d.png"], check=True)
        on, nn = sorted(os.listdir(cache + "/o")), sorted(os.listdir(cache + "/n"))
        for i, f in enumerate(on):
            matte(Image.open(f"{cache}/o/{f}"), Image.open(f"{cache}/n/{nn[min(i, len(nn) - 1)]}")).save(f"{cache}/m/{f}", compress_level=1)
            os.remove(f"{cache}/o/{f}")
        for f in nn:
            os.remove(f"{cache}/n/{f}")
        open(cache + "/done", "w").write("1")
    return [f"{cache}/m/{f}" for f in sorted(os.listdir(cache + "/m"))]


M = frames()
L = len(M)
first = Image.open(M[0])
vw, vh = first.size
alphas = [np.asarray(Image.open(f).split()[3]) for f in M]


def smooth(v, w=11):
    v = np.asarray(v, dtype=np.float32)
    return np.array([v[max(0, i - w // 2):i + w // 2 + 1].mean() for i in range(len(v))])


# Рост, пол под ногами и середина корпуса каждого кадра — по силуэту, сглаженно (иначе фигура
# дрожит в такт шагу). Каждый кадр приводится к росту и месту первого (врач на экране растёт и
# смещается сам, по пути p), у разворота — от кадра лицом к кадру спиной.
hs, ys, cs = [], [], []
for al in alphas:
    m = al > 140
    rows = np.where(m.any(axis=1))[0]
    top, bot = int(rows[0]), int(rows[-1])
    cols = np.where(m[top:top + int((bot - top) * .45)].any(axis=0))[0]
    hs.append(bot - top); ys.append(bot); cs.append((cols[0] + cols[-1]) / 2)
hs, ys, cs = smooth(hs), smooth(ys), smooth(cs)
box0, box1 = body_box(alphas[0]), body_box(alphas[-1])
base = box0
ar = max((b[2] - b[0]) / (b[3] - b[1]) for b in ([box0, box1] if kind == "t" else [box0]))
tw = int(round(H * ar * (1 + 2 * PAD) / 2) * 2)


def tile(i, u=0.0, size=None):
    if kind == "t":
        b = [box0[q] + (box1[q] - box0[q]) * u for q in range(4)]
        hh, cx, bot = b[3] - b[1], (b[0] + b[2]) / 2, b[3]
    else:
        k = hs[i] / hs[0]
        hh, cx, bot = (base[3] - base[1]) * k, cs[i] + ((base[0] + base[2]) / 2 - cs[0]) * k, ys[i] + (base[3] - ys[0]) * k
    ww, ex = hh * tw / H, hh * E
    box = (round(cx - ww / 2), round(bot - hh - ex), round(cx + ww / 2), round(bot + ex))
    c = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    c.paste(Image.open(M[i]).crop((max(0, box[0]), max(0, box[1]), min(vw, box[2]), min(vh, box[3]))), (max(0, -box[0]), max(0, -box[1])))
    return c.resize(size or (tw, HF), Image.LANCZOS)


note = {}
SM = (tw // 4, H // 4)
if kind == "t":
    small = [np.asarray(Image.fromarray(a).resize((96, 172)), dtype=np.float32) / 255 for a in alphas]
    d0 = [float(np.abs(x - small[0]).mean()) for x in small]
    d1 = [float(np.abs(x - small[-1]).mean()) for x in small]
    i0 = max(1, next(i for i, d in enumerate(d0) if d > 0.012) - 2)
    i1 = min(L - 2, L - next(i for i, d in enumerate(reversed(d1)) if d > 0.012) + 1)
    seq = [0] + list(range(i0, i1 + 1)) + [L - 1]
    note["span"] = [i0, i1, L]
else:
    h0, h1 = float(np.median(hs[:5])), float(np.median(hs[-5:]))
    grow = np.maximum.accumulate(np.clip((hs - h0) / (h1 - h0), 0, 1))
    w0 = int(np.where(grow < 0.02)[0][-1])
    w1 = int(np.where(grow > 0.98)[0][0])
    note["walk"] = [w0, w1, L]
    note["grow"] = round(h1 / h0, 3)
    # Смена позы до и после шагов — через кадр; сами шаги — каждый кадр ролика.
    seq = list(range(0, w0, POSE)) + list(range(w0, w1 + 1)) + list(range(w1 + POSE, L - 1, POSE)) + [L - 1]
    if LONG and w1 - w0 > LONG + 8:
        def feat(i):
            t = np.asarray(tile(i, size=SM), dtype=np.float32) / 255
            a = t[..., 3]
            return np.stack([a, t[..., :3].mean(axis=2) * a])
        F = {i: feat(i) for i in range(w0, w1 + 1)}
        want, best = (w1 - w0) - LONG, None
        for a_ in range(w0 + 10, w1 - 10):
            for cut in range(max(8, want - 12), want + 13):
                b_ = a_ + cut
                if b_ > w1 - 10:
                    continue
                e = sum(float(np.abs(F[a_ + q] - F[b_ + q]).mean()) for q in (-2, -1, 0, 1, 2)) / 5
                if best is None or e < best[0]:
                    best = (e, a_, b_)
        e, a_, b_ = best
        seq = [i for i in seq if i <= a_ or i > b_]
        grow = np.where(np.arange(L) > b_, grow - (grow[b_] - grow[a_]), grow)
        grow = grow / grow[-1]
        note["cut"] = [a_, b_, round(e, 4)]

n = len(seq)
ref = cloth(np.asarray(tile(0), dtype=np.float32))
tiles = [tile(i, (j / (n - 1)) ** 2 * (3 - 2 * j / (n - 1))) for j, i in enumerate(seq)]
gains = []
for t in tiles:
    c = cloth(np.asarray(t, dtype=np.float32))
    gains.append(np.clip(ref / np.maximum(c, 1), .6, 1.4) if c is not None else np.ones(3, dtype=np.float32))
gains = np.array(gains)
tiles = [retone(t, ref, gains[max(0, j - 2):j + 3].mean(axis=0)) for j, t in enumerate(tiles)]

os.makedirs(cache + "/v", exist_ok=True)
for f in os.listdir(cache + "/v"):
    os.remove(f"{cache}/v/{f}")
for j, t in enumerate(tiles):
    rgb, a = ring(t, H)
    st = Image.new("RGB", (tw, HF * 2))
    st.paste(rgb, (0, 0))
    st.paste(Image.merge("RGB", (a, a, a)), (0, HF))
    st.save(f"{cache}/v/{j:04d}.png", compress_level=1)
args = ["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(FPS), "-i", f"{cache}/v/%04d.png",
        "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p", "-profile:v", "high", "-bf", "0",
        "-g", str(FPS), "-movflags", "+faststart", "-an"]
subprocess.run(args + [out], check=True)
ms = round(n / FPS * 1000)
res = {"kind": kind, "fps": FPS, "n": n, "tw": tw, "th": H, "hf": HF, "e": E, "ms": ms, "bytes": os.path.getsize(out), "note": note}
if kind != "t":
    res["p"] = [int(round(float(grow[i]) * 1000)) for i in seq]
print(json.dumps(res))
