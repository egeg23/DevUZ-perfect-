# Общие правки вырезок врачей: тон формы и чистый край.
# Со спины рендер и ролик светлее, чем лицом: форма «меняла цвет» на развороте. Тон ткани
# (тёмно-синее: синего больше красного, не светлое) приводится к тону кадра лицом.
import numpy as np
from PIL import Image, ImageFilter


def weight(a):
    """Насколько точка — ткань формы: 0…1 (кожа, волосы, кроссовки — 0)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = (r + g + b) / 3
    return np.clip((b - r) / 8, 0, 1) * np.clip((150 - lum) / 30, 0, 1)


def cloth(a):
    """Медиана цвета ткани (массив RGBA float)."""
    m = (a[..., 3] > 240) & (weight(a) > .9)
    if m.sum() < 500:
        return None
    return np.array([np.median(a[..., c][m]) for c in range(3)], dtype=np.float32)


def retone(im, ref, gain=None):
    """Тон ткани кадра — к ref. gain задан — им (чтобы соседние кадры не мигали)."""
    a = np.asarray(im.convert("RGBA"), dtype=np.float32).copy()
    if gain is None:
        c = cloth(a)
        if c is None:
            return im
        gain = np.clip(ref / np.maximum(c, 1), .6, 1.4)
    w = weight(a)[..., None]
    a[..., :3] = np.clip(a[..., :3] * (1 + w * (gain - 1)), 0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def defringe(im, r=5, cut=2):
    """Светлая кайма фона по краю вырезки: цвет полупрозрачного края берётся изнутри фигуры,
    сам край подрезан на cut точек."""
    a = np.asarray(im.convert("RGBA"), dtype=np.float32)
    al = a[..., 3]
    core = Image.fromarray(((al >= 250) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * cut + 1))
    k = np.asarray(core, dtype=np.float32) / 255
    den = np.asarray(Image.fromarray((k * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255
    out = a.copy()
    for c in range(3):
        num = np.asarray(Image.fromarray((a[..., c] * k).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), dtype=np.float32)
        inner = num / np.maximum(den, 1e-3)
        t = np.clip(den * 4, 0, 1) * (1 - k)          # край: рядом есть «нутро», сама точка не нутро
        out[..., c] = a[..., c] * (1 - t) + inner * t
    er = np.asarray(Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.MinFilter(2 * cut + 1)).filter(ImageFilter.GaussianBlur(cut * .6)), dtype=np.float32)
    out[..., 3] = np.minimum(al, er)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def solo(im, thr=200):
    """Только сама фигура: отдельные пятна (остаток тени пола между кроссовок) убрать.
    Фигура — связная область плотной альфы от середины корпуса, с запасом в несколько точек."""
    from PIL import ImageDraw
    a = np.asarray(im.convert("RGBA")).copy()
    m = Image.fromarray(((a[..., 3] >= thr) * 255).astype(np.uint8)).copy()   # копия: заливка пишет в картинку
    bx = m.getbbox()
    y = (bx[1] + bx[3]) // 2
    xs = np.where(np.asarray(m)[y] > 0)[0]
    if not len(xs):
        return im
    x = int(xs[np.argmin(np.abs(xs - (bx[0] + bx[2]) / 2))])
    ImageDraw.floodfill(m, (x, y), 128)
    got = np.array(m) == 128
    if got.sum() < 1000:
        return im
    body = np.asarray(Image.fromarray((got * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13))) > 0
    a[..., 3] = np.where(body, a[..., 3], 0)
    return Image.fromarray(a, "RGBA")
