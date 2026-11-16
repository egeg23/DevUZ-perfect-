# Кадры движения врача для «Наших врачей»: сетка кадров (COLS в ряд), её листает team.js.
#   python3 -I sprite.py <f|b|t> <видео.mp4> <без-фона.mp4> <кэш-папка> <выход.webp> <рендер лицом.png> [<рендер спиной.png>]
# f — идёт к нам (рамка кадра лицом), b — уходит (рамка кадра спиной), t — разворот лицом → спиной
# (рамка плавно переходит от кадра лицом к кадру спиной: концы совпадают с обоими кадрами врача).
# Рамка шире кадра врача на PAD с каждой стороны: при шаге и развороте руки и ноги выходят за силуэт.
# Фон: видео Higgsfield «без фона» приходит на чёрном, без прозрачности, поэтому прозрачность
# считается сравнением с исходным роликом на сером фоне.
# В ответе (в FIGS, catalog.mjs): n, cols, tw — сетка; ms — сколько лента играет на сайте;
# go — доли ленты, между которыми идут ноги: только на этом отрезке врач смещается по экрану,
# поэтому шаги не «скользят». Тон формы каждого кадра приводится к кадру лицом (tone.py).
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

kind, vid, nobg, cache, out, front = sys.argv[1:7]
back = sys.argv[7] if len(sys.argv) > 7 else None
PAD, H, S = 0.32, 560, 0.6
# Ходьба в роликах Kling медленнее живой (шаг около 0,8 с), поэтому лента играет в SPEED раз
# быстрее ролика; кадров в ленте — FPS на секунду показа. Уходящий шагает весь ролик (5 с):
# из середины вырезан кусок до LONG кадров ролика. Разворот — TURN кадров.
SPEED, FPS, LONG, TURN = 1.6, 18, 68, 18


def body_box(im):
    bx = im.split()[3].point(lambda v: 255 if v > 140 else 0).getbbox()
    return (bx[0] - 8, bx[1] - 8, bx[2] + 8, bx[3] + 4)


def matte(o, nb):
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
    return Image.fromarray(np.concatenate([np.clip(F, 0, 255), an * 255], axis=2).astype(np.uint8), "RGBA")


def frames():
    """Все кадры ролика без фона, в 0,6 размера; считаются один раз (кэш)."""
    if not os.path.exists(cache + "/done"):
        for d in ("o", "n"):
            os.makedirs(f"{cache}/{d}", exist_ok=True)
        for src, d in ((vid, "o"), (nobg, "n")):
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-vf", f"scale=iw*{S}:-2:flags=lanczos", f"{cache}/{d}/%03d.png"], check=True)
        names = sorted(os.listdir(cache + "/o"))
        nn = sorted(os.listdir(cache + "/n"))
        os.makedirs(cache + "/m", exist_ok=True)
        for i, f in enumerate(names):
            matte(Image.open(f"{cache}/o/{f}"), Image.open(f"{cache}/n/{nn[min(i, len(nn) - 1)]}")).save(f"{cache}/m/{f}")
        open(cache + "/done", "w").write("1")
    return [Image.open(f"{cache}/m/{f}") for f in sorted(os.listdir(cache + "/m"))]


M = frames()
vw, vh = M[0].size
small = [np.asarray(m.split()[3].resize((96, 172)), dtype=np.float32) / 255 for m in M]
fr = Image.open(front).convert("RGBA")
boxf = [v * vw / fr.width for v in body_box(fr)]
if back:
    bk = Image.open(back).convert("RGBA")
    boxb = [v * vw / bk.width for v in body_box(bk)]

base = boxb if kind == "b" else boxf
ar = max((b[2] - b[0]) / (b[3] - b[1]) for b in ([boxf, boxb] if kind == "t" else [base]))
tw = round(H * ar * (1 + 2 * PAD))

# Камера в ролике отстаёт: в середине ходьбы фигура меньше и смещена. Каждый кадр приводим к
# росту и месту первого: рост, пол под ногами и середина корпуса — по силуэту, сглаженно
# (иначе фигура дрожит в такт шагу).
def smooth(v, w=11):
    v = np.asarray(v, dtype=np.float32)
    return np.array([v[max(0, i - w // 2):i + w // 2 + 1].mean() for i in range(len(v))])


hs, ys, cs = [], [], []
for m in M:
    al = np.asarray(m.split()[3]) > 140
    rows_ = np.where(al.any(axis=1))[0]
    top, bot = int(rows_[0]), int(rows_[-1])
    cols_ = np.where(al[top:top + int((bot - top) * .45)].any(axis=0))[0]
    hs.append(bot - top); ys.append(bot); cs.append((cols_[0] + cols_[-1]) / 2)
hs, ys, cs = smooth(hs), smooth(ys), smooth(cs)


def tile(i, u=0.0, size=None):
    """Кадр i в рамке плитки. u — доля разворота (рамка от кадра лицом к кадру спиной)."""
    if kind == "t":
        b = [boxf[q] + (boxb[q] - boxf[q]) * u for q in range(4)]
        hh, cx, bot = b[3] - b[1], (b[0] + b[2]) / 2, b[3]
    else:
        k = hs[i] / hs[0]
        hh, cx, bot = (base[3] - base[1]) * k, (base[0] + base[2]) / 2 + (cs[i] - cs[0]), base[3] + (ys[i] - ys[0])
    ww = hh * tw / H
    box = (round(cx - ww / 2), round(bot - hh), round(cx + ww / 2), round(bot))
    c = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    c.paste(M[i].crop((max(0, box[0]), max(0, box[1]), min(vw, box[2]), min(vh, box[3]))), (max(0, -box[0]), max(0, -box[1])))
    c = c.resize(size or (tw, H), Image.LANCZOS)
    if not size:
        # Две прозрачные строки сверху и снизу: при масштабе соседний кадр сетки не просвечивает.
        a = np.asarray(c).copy()
        a[:2, :, 3] = 0
        a[-2:, :, 3] = 0
        c = Image.fromarray(a, "RGBA")
    return c


SM = (tw // 4, H // 4)
L = len(M)
note = {}
if kind == "t":
    # Разворот: от первого кадра, непохожего на начало, до последнего, непохожего на конец;
    # концы — ровно первый и последний кадр ролика (это кадры врача лицом и спиной).
    d0 = [float(np.abs(x - small[0]).mean()) for x in small]
    d1 = [float(np.abs(x - small[-1]).mean()) for x in small]
    i0 = max(1, next(i for i, d in enumerate(d0) if d > 0.012) - 2)
    i1 = min(L - 2, L - next(i for i, d in enumerate(reversed(d1)) if d > 0.012) + 1)
    seq = [0] + list(range(i0, i1 + 1)) + [L - 1]
    note["span"] = [i0, i1, L]
else:
    # Признаки кадра: силуэт и светлое в нём (кроссовки), в рамке плитки. Ноги — нижние 45%.
    def feat(i):
        t = np.asarray(tile(i, size=SM), dtype=np.float32) / 255
        a = t[..., 3]
        return np.stack([a, t[..., :3].mean(axis=2) * a])
    F = [feat(i) for i in range(L)]
    cutrow = int(SM[1] * .55)
    E = np.array([float(np.abs(F[min(i + 1, L - 1)][0, cutrow:] - F[max(i - 1, 0)][0, cutrow:]).mean()) for i in range(L)])
    E = np.convolve(E, np.ones(5) / 5, mode="same")
    go_ = np.where(E > 0.25 * np.percentile(E, 90))[0]
    w0, w1 = int(go_[0]), int(go_[-1])
    a0, a1 = max(1, w0 - 3), min(L - 2, w1 + 3)
    seq = [0] + list(range(a0, a1 + 1)) + [L - 1]
    note["walk"] = [w0, w1, L]
    note["ends"] = [round(float(np.abs(F[0] - F[a0]).mean()), 4), round(float(np.abs(F[-1] - F[a1]).mean()), 4)]
    if kind == "b" and len(seq) > LONG + 8:
        # Вырез там, где шаг совпадает: ноги — пять кадров подряд (фаза и направление),
        # верх — руки. Со спины руки просто опущены, поэтому стык не виден.
        def leg(i, j):
            return sum(float(np.abs(F[i + q][:, cutrow:] - F[j + q][:, cutrow:]).mean()) for q in (-2, -1, 0, 1, 2)) / 5
        def top(i, j):
            return float(np.abs(F[i][:, :cutrow] - F[j][:, :cutrow]).mean())
        want, best = len(seq) - LONG, None
        for a_ in range(w0 + 10, w1 - 10):
            for cut in range(max(6, want - 10), want + 11):
                b_ = a_ + cut
                if b_ > w1 - 10:
                    continue
                e = leg(a_, b_) + 0.5 * top(a_, b_)
                if best is None or e < best[0]:
                    best = (e, a_, b_)
        e, a_, b_ = best
        seq = [i for i in seq if i <= a_ or i > b_]
        note["cut"] = [a_, b_, round(e, 4)]
note["len"] = len(seq)

ms = 840 if kind == "t" else round((len(seq) - 1) / 24 / SPEED * 1000)
n = TURN if kind == "t" else min(48, round(ms / 1000 * FPS))
COLS = 6 if n <= 36 else 8
pick = [seq[round(i * (len(seq) - 1) / (n - 1))] for i in range(n)]
tiles = []
for j, i in enumerate(pick):
    u = j / (n - 1)
    tiles.append(tile(i, u * u * (3 - 2 * u)))
# Тон формы — как на кадре лицом: со спины ролик светлее, форма «меняла цвет» на развороте.
# Поправка своя у каждого кадра, сглажена по соседним (иначе лента мигает).
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tone import cloth, retone
ref = cloth(np.asarray(fr, dtype=np.float32))
gains = []
for t in tiles:
    c = cloth(np.asarray(t, dtype=np.float32))
    gains.append(np.clip(ref / np.maximum(c, 1), .6, 1.4) if c is not None else np.ones(3, dtype=np.float32))
gains = np.array(gains)
tiles = [retone(t, ref, gains[max(0, j - 2):j + 3].mean(axis=0)) for j, t in enumerate(tiles)]
note["tone"] = [round(float(gains[0].mean()), 2), round(float(gains[-1].mean()), 2)]
rows = -(-n // COLS)
sheet = Image.new("RGBA", (tw * COLS, H * rows), (0, 0, 0, 0))
for j, t in enumerate(tiles):
    sheet.paste(t, ((j % COLS) * tw, (j // COLS) * H))
sheet.save(out, "WEBP", quality=54, alpha_quality=40, method=6)
res = {"kind": kind, "n": n, "tw": tw, "th": H, "cols": COLS, "rows": rows, "bytes": os.path.getsize(out), "ms": ms, "note": note}
if kind != "t":
    ja = next(j for j, i in enumerate(pick) if i >= w0)
    jb = max(j for j, i in enumerate(pick) if i <= w1)
    res["go"] = [round(ja / (n - 1), 2), round(jb / (n - 1), 2)]
print(json.dumps(res))
