"""Слои облаков для сцены Cosmo World — рисуются кодом, без генераций.

python3 -I clouds.py

Фрактальный шум (несколько октав) → мягкие белые облака на прозрачном.
Три слоя разной плотности и размера: сцена двигает их с разной скоростью
по прокрутке (параллакс) и медленно сносит по времени.
Пишет public/protos/cosmoworld/fx/cloud-{1,2,3}.webp.
"""
import os
import numpy as np
from PIL import Image, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/cosmoworld/fx")
os.makedirs(OUT, exist_ok=True)


def fbm(w, h, seed, base, oct=6):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(oct):
        gw, gh = max(2, int(base * 2 ** o * w / h)), max(2, int(base * 2 ** o))
        g = rng.random((gh + 1, gw + 1)).astype(np.float32)
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += amp * (np.asarray(img, np.float32) / 255)
        tot += amp
        amp *= 0.55
    return out / tot


for i, (w, h, seed, base, lo, hi, band) in enumerate([
    (2400, 900, 11, 3, .46, .78, (.35, 1.0)),
    (2400, 900, 23, 4, .50, .80, (.25, 1.0)),
    (2000, 700, 37, 2, .48, .76, (.1, 1.0)),
], 1):
    n = fbm(w, h, seed, base)
    a = np.clip((n - lo) / (hi - lo), 0, 1) ** 1.4
    y = np.linspace(0, 1, h)[:, None]
    fade = np.clip((y - band[0]) / 0.25, 0, 1) * np.clip((band[1] - y) / 0.08 + 1, 0, 1)
    x = np.linspace(0, 1, w)[None, :]
    edge = np.clip(np.minimum(x, 1 - x) / 0.08, 0, 1)
    a = a * fade * edge
    shade = 200 + 55 * np.clip(n * 1.3, 0, 1)
    rgba = np.dstack([shade, shade, shade + 6, a * 235]).clip(0, 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").filter(ImageFilter.GaussianBlur(9)).save(os.path.join(OUT, f"cloud-{i}.webp"), "WEBP", quality=72, method=6)
print(sorted(os.listdir(OUT)))
