"""Стенд D-MAX 360°: python3 -I turn.py <папка с a.mp4, b1.mp4, b2.mp4>.

Владелец, 21.10.2026: «при смене цветов… цвет менялся плавно… при выборе
дисков они показывались и машину можно было покрутить на стенде». Стенд — те
же фото-кадры, что и сцена: Kling 3.0 4K вращает подиум (a: перед → зад,
180°; b1: зад → правый профиль, 45°; b2: профиль → перед, 135°). Диски в
исходниках залиты хромакеем #00FF00 — их цвет шейдер берёт по зелёному.
Кузов так не вычленить (тени красные, как подсветка подиума), поэтому маска
кузова считается здесь и лежит в том же кадре снизу, вдвое меньше: кадр d —
1600×(900+450), m — 960×(720+360). Пишет public/protos/samauto/tt/<d|m>/NN.webp
(открытыми; seal.py шифрует), постер и tt.json (число кадров, колёса,
средняя яркость краски и дисков для шейдера).
"""
import colorsys, json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "../../../public/protos/samauto/tt")
# ролик → градусов поворота; кадр — 5°
CLIPS = [("a", 180), ("b1", 45), ("b2", 135)]
STEP = 5
FMT = {"d": (1600, 900, None, 70), "m": (960, 720, (4, 3), 72)}


def frames(path):
    tmp = tempfile.mkdtemp()
    subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", "scale=1920:-2:flags=lanczos", "-q:v", "2", os.path.join(tmp, "%04d.jpg")], check=True)
    return tmp, sorted(os.listdir(tmp))


def pick(clip, deg):
    """Кадры поровну по повороту, а не по времени: Kling разгоняется и тормозит
    у ключевых кадров. Поворот меряем накопленной разницей соседних кадров."""
    tmp, names = frames(os.path.join(SRC, clip + ".mp4"))
    prev, acc = None, [0.0]
    for n in names:
        a = np.asarray(Image.open(os.path.join(tmp, n)).convert("L").resize((240, 134)), dtype=np.float32)
        if prev is not None:
            acc.append(acc[-1] + float(np.abs(a - prev).mean()))
        prev = a
    acc = np.array(acc) / acc[-1]
    k = deg // STEP
    idx = [int(np.argmin(np.abs(acc - i / k))) for i in range(k)]
    return [os.path.join(tmp, names[i]) for i in idx], idx


def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def hsv(c):
    mx, mn = c.max(-1), c.min(-1)
    d = mx - mn + 1e-6
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    return h, d / (mx + 1e-6), mx


def paint_mask(c, ring):
    """Краска — тёплый цвет, кроме видимого кольца подиума (ring). Владелец, 22.10.2026:
    «когда у машины меняется цвет, некоторые области другого цвета при
    вращении» — пятна давали задние фонари (красились вместе с кузовом) и
    кромка бампера с бликом капота (их съедало вычитание кольца подиума)."""
    h, s, v = hsv(c)
    hw = (h + 0.08) % 1.0  # краска: от красного в тени до оранжевого на свету
    warm = ss(0.0, 0.03, hw) * (1 - ss(0.2, 0.24, hw))
    m = warm * ss(0.12, 0.25, s) * ss(0.012, 0.04, v)
    # блик на краске: светлый, почти белый, но с тёплым оттенком
    m = np.maximum(m, warm * ss(0.04, 0.1, s) * ss(0.55, 0.7, v))
    # стоп-сигналы светятся: насыщенный красный, ярче любой краски в тени
    red = (h > 0.95) | (h < 0.012)
    lamp = red & (v > 0.68) & (s > 0.5)
    lamp = np.asarray(Image.fromarray((lamp * 255).astype("uint8")).filter(ImageFilter.MaxFilter(5)), dtype=np.float32) / 255
    return m * (1 - ring) * (1 - lamp)


# источники поворотом подряд — один круг
src, srcidx = [], {}
for clip, deg in CLIPS:
    files, idx = pick(clip, deg)
    srcidx[clip] = idx
    src += [(clip, f) for f in files]
print(len(src), "кадров;", {k: v[:3] + ["…"] + v[-2:] for k, v in srcidx.items()})

# Подсветка подиума неподвижна, машина крутится: тонкое, что попадает в маску
# почти во всех кадрах, — кольцо. Толстое пятно (середина машины, она есть в
# каждом кадре) оставляем: его снимает «открытие».
freq = None
for _, f in src:
    c = np.asarray(Image.open(f).convert("RGB").resize((960, 535)), dtype=np.float32) / 255
    m = (paint_mask(c, 0) > 0.5).astype(np.float32)
    freq = m if freq is None else freq + m
fq = freq / len(src)
# Кольцо — неподвижный эллипс: берём его переднюю дугу (её машина не
# закрывает) и достраиваем весь эллипс полосой.
H9, W9 = fq.shape
lo, hi = int(H9 * 0.6), int(H9 * 0.85)
ys, xs = np.nonzero(fq[lo:hi] > 0.9)
ys = ys + lo
x0 = (xs.min() + xs.max()) / 2
a_ = (xs.max() - xs.min()) / 2
y_bot = ys.max()
# центр по высоте и полуось — перебором: точки дуги должны лечь на эллипс
best = None
for y0 in np.arange(lo, y_bot, 0.5):
    b = y_bot - y0
    err = np.abs(np.sqrt(((xs - x0) / a_) ** 2 + ((ys - y0) / b) ** 2) - 1)
    sc = float((err < 0.03).mean())
    if best is None or sc > best[0]:
        best = (sc, y0, b)
_, y0, b_ = best
yy, xx = np.mgrid[0:H9, 0:W9]
r = ((xx - x0) / a_) ** 2 + ((yy - y0) / b_) ** 2
band = (np.abs(np.sqrt(r) - 1) < 0.035) & (fq > 0.15)
print("кольцо:", round(x0), round(y0), round(a_), round(b_))
ring = Image.fromarray((band * 255).astype("uint8")).filter(ImageFilter.MaxFilter(5)).resize((1920, 1070))
static = np.asarray(ring, dtype=np.float32) / 255
# Кольцо вычитаем, только где его видно: там кадр совпадает с пустым залом
# (медиана кадров). Где кольцо закрыто бампером, маска остаётся — иначе по
# низу бампера шла неперекрашенная полоса.
small = np.stack([np.asarray(Image.open(f).convert("RGB").resize((960, 535)), dtype=np.uint8) for _, f in src])
bg = np.median(small, axis=0).astype(np.float32)
del small
band9 = np.asarray(Image.fromarray((static * 255).astype("uint8")).resize((960, 535)), dtype=np.float32) / 255


def ring_of(full):
    a = np.asarray(full.resize((960, 535)), dtype=np.float32)
    seen = (np.abs(a - bg).max(-1) < 75).astype(np.float32) * band9
    return np.asarray(Image.fromarray((seen * 255).astype("uint8")).filter(ImageFilter.MaxFilter(5)).resize(full.size, Image.BILINEAR), dtype=np.float32) / 255

wheels = {"d": [], "m": []}
yp, yr, cp, cr = 0.0, 0.0, 0.0, 0.0
for fmt, (W, H, crop, q) in FMT.items():
    d = os.path.join(OUT, fmt)
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        os.remove(os.path.join(d, f))
for i, (clip, f) in enumerate(src):
    full = Image.open(f).convert("RGB")
    c = np.asarray(full, dtype=np.float32) / 255
    mp = paint_mask(c, ring_of(full))
    h, s, v = hsv(c)
    mr = ss(0.2, 0.26, h) * (1 - ss(0.42, 0.5, h)) * ss(0.25, 0.45, s) * ss(0.05, 0.12, v)
    lin = c ** 2.2
    y = (lin * [0.2126, 0.7152, 0.0722]).sum(-1)
    yp += float((y * mp).sum()); cp += float(mp.sum()); yr += float((y * mr).sum()); cr += float(mr.sum())
    # ближнее колесо: самое крупное зелёное пятно
    g = mr > 0.5
    cols = np.where(g.any(0))[0]
    wx = wy = None
    if len(cols):
        gaps = np.where(np.diff(cols) > 6)[0]
        parts = np.split(cols, gaps + 1)
        big = max(parts, key=lambda p: g[:, p].sum())
        ys, xs = np.nonzero(g[:, big])
        wx, wy = (big[0] + xs.mean()) / c.shape[1], ys.mean() / c.shape[0]
    # мелкие дыры (блик, шум) закрываем, край смягчаем
    mask = Image.fromarray((np.clip(mp, 0, 1) * 255).astype("uint8")).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(1.2))
    # Отражение в полу тусклое и рваное: там маску закрываем шире и мягче,
    # иначе при светлом цвете отражение выходит пятнами.
    y0 = int(full.size[1] * 0.7)
    low = mask.crop((0, y0, full.size[0], full.size[1])).filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.MinFilter(17)).filter(ImageFilter.GaussianBlur(4))
    mask.paste(low, (0, y0))
    for fmt, (W, H, crop, q) in FMT.items():
        im, mk = full, mask
        x0 = 0
        if crop:
            cw = round(full.size[1] * crop[0] / crop[1])
            x0 = (full.size[0] - cw) // 2
            im, mk = full.crop((x0, 0, x0 + cw, full.size[1])), mask.crop((x0, 0, x0 + cw, full.size[1]))
        sheet = Image.new("RGB", (W, H + H // 2))
        sheet.paste(im.resize((W, H), Image.LANCZOS), (0, 0))
        sheet.paste(mk.resize((W // 2, H // 2), Image.LANCZOS).convert("RGB"), (0, H))
        sheet.save(os.path.join(OUT, fmt, f"{i:02d}.webp"), "WEBP", quality=q, method=6)
        if wx is not None:
            px = (wx * full.size[0] - x0) / (im.size[0])
            wheels[fmt].append([round(min(0.95, max(0.05, px)), 3), round(wy, 3)])
        else:
            wheels[fmt].append(None)
    if i == 0:
        full.resize((1600, 900), Image.LANCZOS).save(os.path.join(OUT, "src-00.png"))

json.dump({"n": len(src), "ref": {"paint": round(yp / cp, 4), "rim": round(yr / cr, 4)}, "wheel": wheels}, open(os.path.join(HERE, "tt.json"), "w"))
for fmt in FMT:
    dd = os.path.join(OUT, fmt)
    print(fmt, round(sum(os.path.getsize(os.path.join(dd, x)) for x in os.listdir(dd)) / 1048576, 1), "МБ")

# Постер до загрузки: первый кадр, диски — «Qora yaltiroq», как шейдер по умолчанию.
src0 = np.asarray(Image.open(os.path.join(OUT, "src-00.png")).convert("RGB"), dtype=np.float32) / 255
h, s, v = hsv(src0)
mr = (ss(0.2, 0.26, h) * (1 - ss(0.42, 0.5, h)) * ss(0.25, 0.45, s) * ss(0.05, 0.12, v))[..., None]
lin = src0 ** 2.2
yv = (lin * [0.2126, 0.7152, 0.0722]).sum(-1, keepdims=True) / (yr / cr)
tc = np.array([(int("1d1f22"[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)])
o = tc * yv
o = o / (1 + np.maximum(0, o.max(-1, keepdims=True) - 0.85) * 1.4) + np.maximum(0, yv - 1.6) * 0.06
post = Image.fromarray((np.clip(lin * (1 - mr) + o * mr, 0, 1) ** (1 / 2.2) * 255).astype("uint8"))
post.save(os.path.join(OUT, "poster-16.webp"), "WEBP", quality=74, method=6)
cw = round(900 * 4 / 3)
post.crop(((1600 - cw) // 2, 0, (1600 + cw) // 2, 900)).resize((960, 720), Image.LANCZOS).save(os.path.join(OUT, "poster-9.webp"), "WEBP", quality=74, method=6)
os.remove(os.path.join(OUT, "src-00.png"))
