"""
Слои фотографий для прототипа AUTOMECHANIC: кадрирование, вырезка, цвет.

    python3 -I photos.py <папка с оригиналами> <куда класть>

Оригиналы — открытые снимки с Wikimedia Commons (SOURCES.md, имена файлов
там же). Нейросетью ничего не рисуется: машина отделена от фона сегментацией
(rembg, модель isnet-general-use — она только решает, какой пиксель машина,
а какой фон), струя масла — по цвету, места под ней и под колпаками
заполнены классическим cv2.inpaint из соседних пикселей. Всё остальное —
кадр, масштаб, яркость, размытие.

Результат — WebP: слои с прозрачностью, фон и фото услуг без неё.
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)


def save(img: Image.Image, name: str, q: int = 74) -> None:
    path = OUT / name
    img.save(path, "WEBP", quality=q, method=6)
    print(f"{name:22} {img.size[0]}x{img.size[1]}  {path.stat().st_size // 1024} KB")


def grade(img: Image.Image, light: float = 1.0, sat: float = 1.0, contrast: float = 1.0) -> Image.Image:
    """Общий цвет сцены: чуть холоднее и темнее, чтобы слои из разных снимков сошлись."""
    img = ImageEnhance.Color(img).enhance(sat)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    img = ImageEnhance.Brightness(img).enhance(light)
    return img


# ── BMW: кузов и два колёсных диска ────────────────────────────────────────
def bmw() -> None:
    from rembg import new_session, remove

    photo = Image.open(SRC / "bmw.jpg").convert("RGB")
    cut = remove(photo, session=new_session("isnet-general-use"))
    # Тень и асфальт под колёсами модель иногда цепляет полупрозрачными:
    # всё, что прозрачнее трети, — фон.
    alpha = np.array(cut.getchannel("A"))
    alpha[alpha < 85] = 0
    cut.putalpha(Image.fromarray(alpha))
    box = cut.getbbox()
    body = cut.crop(box)
    scale = 1800 / body.width
    # Центры и радиусы дисков измерены по сетке на исходном кадре 3840×1444.
    rims = {"rim-f": (685, 1048, 184), "rim-r": (2961, 1038, 180)}
    rgb = np.array(photo)
    for name, (cx, cy, r) in rims.items():
        r2 = r + 6
        disc = photo.crop((cx - r2, cy - r2, cx + r2, cy + r2))
        mask = Image.new("L", disc.size, 0)
        m = np.zeros((disc.height, disc.width), np.uint8)
        cv2.circle(m, (r2, r2), r, 255, -1, lineType=cv2.LINE_AA)
        mask = Image.fromarray(m).filter(ImageFilter.GaussianBlur(1.5))
        disc.putalpha(mask)
        side = round(disc.width * scale)
        save(disc.resize((side, side), Image.LANCZOS), f"{name}.webp", 80)
    # Под дисками в кузове — тёмная арка: когда диск крутится, по краю не
    # мелькает его же неподвижная копия.
    hole = np.zeros(rgb.shape[:2], np.uint8)
    for cx, cy, r in rims.values():
        cv2.circle(hole, (cx, cy), r - 2, 255, -1)
    flat = rgb.copy()
    flat[hole > 0] = (24, 24, 26)
    body_rgb = Image.fromarray(flat).crop(box)
    body_rgb.putalpha(body.getchannel("A"))
    body_rgb = grade(body_rgb.convert("RGBA"), light=0.96, contrast=1.04)
    save(body_rgb.resize((1800, round(body.height * scale)), Image.LANCZOS), "car.webp", 80)
    print("  колёса в кузове car.webp:", {k: (round((cx - box[0]) * scale), round((cy - box[1]) * scale), round(r * scale)) for k, (cx, cy, r) in rims.items()})


# ── Цех: дальний фон и платформа подъёмника ───────────────────────────────
def garage() -> None:
    photo = Image.open(SRC / "garage.jpg").convert("RGB")
    far = photo.resize((2400, 1600), Image.LANCZOS).filter(ImageFilter.GaussianBlur(5))
    far = grade(far, light=0.42, sat=0.55, contrast=1.1)
    save(far, "garage-far.webp", 62)
    # Платформа — балка подъёмника с инструментом из того же кадра; канистра
    # с надписью остаётся за краем.
    deck = photo.crop((0, 1990, 1600, 2450))
    deck = grade(deck, light=0.7, sat=0.6, contrast=1.08)
    # Верх и низ платформы растворяются, чтобы не было прямого среза кадра.
    a = np.full((deck.height, deck.width), 255, np.float32)
    ramp = 60
    for y in range(ramp):
        a[y, :] *= y / ramp
        a[-1 - y, :] *= y / ramp
    for x in range(ramp):
        a[:, x] *= x / ramp
        a[:, -1 - x] *= x / ramp
    deck = deck.convert("RGBA")
    deck.putalpha(Image.fromarray(a.astype(np.uint8)))
    save(deck.resize((1400, round(deck.height * 1400 / deck.width)), Image.LANCZOS), "deck.webp", 70)


# ── Стойки подъёмника ─────────────────────────────────────────────────────
def posts() -> None:
    photo = Image.open(SRC / "lift.jpg").convert("RGB")
    # Синяя стойка двухстоечного подъёмника — ровный прямоугольник: кадр
    # берётся точно по её граням (измерено по сетке на кадре 3840×5760),
    # шкаф управления и мотор слева остаются за краем.
    post = photo.crop((1668, 0, 2378, 5600))
    post = grade(post, light=0.8, sat=0.9, contrast=1.06)
    save(post.resize((round(post.width * 1600 / post.height), 1600), Image.LANCZOS), "post.webp", 74)


# ── Масло: кадр без струи, струя отдельно, капля ──────────────────────────
def oil() -> None:
    photo = Image.open(SRC / "oil.jpg").convert("RGB")
    # Кадр справа от эмблемы на крышке мотора — чужой знак в кадр не идёт.
    box = (1200, 520, 3560, 2880)
    rgb = np.array(photo)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    # Струя: жёлто-зелёное, насыщенное, ниже горлышка канистры.
    stream = (hsv[..., 0] >= 18) & (hsv[..., 0] <= 42) & (hsv[..., 1] > 110) & (hsv[..., 2] > 70)
    region = np.zeros_like(stream)
    region[1330:1800, 1880:2060] = True
    stream &= region
    stream = cv2.morphologyEx(stream.astype(np.uint8) * 255, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    stream = cv2.dilate(stream, np.ones((5, 5), np.uint8))
    ys, xs = np.where(stream > 0)
    print("  струя:", xs.min(), xs.max(), ys.min(), ys.max())
    soft = cv2.GaussianBlur(stream, (0, 0), 2)
    base = cv2.inpaint(rgb, cv2.dilate(stream, np.ones((15, 15), np.uint8)), 9, cv2.INPAINT_TELEA)
    scale = 1600 / (box[2] - box[0])
    frame = Image.fromarray(base).crop(box)
    frame = grade(frame, light=0.9, sat=0.95, contrast=1.05)
    save(frame.resize((1600, round(frame.height * scale)), Image.LANCZOS), "oil-base.webp", 72)
    full = Image.fromarray(rgb).convert("RGBA")
    full.putalpha(Image.fromarray(soft))
    sb = (int(xs.min()) - 6, int(ys.min()) - 6, int(xs.max()) + 6, int(ys.max()) + 6)
    piece = grade(full.crop(sb), light=1.05, sat=1.1)
    size = (round(piece.width * scale), round(piece.height * scale))
    save(piece.resize(size, Image.LANCZOS), "oil-stream.webp", 82)
    print("  струя в кадре:", round((sb[0] - box[0]) * scale), round((sb[1] - box[1]) * scale), size)
    tip = full.crop((sb[0], sb[3] - 120, sb[2], sb[3]))
    save(tip.resize((round(tip.width * scale), round(tip.height * scale)), Image.LANCZOS), "oil-drop.webp", 82)


# ── Фото услуг: 4:3, 1200 px ──────────────────────────────────────────────
SERVICES = {
    "s-dvs": "s-dvs.jpg",
    "s-svarka": "s-svarka.jpg",
    "s-salon": "s-salon.jpg",
    "s-hodovaya": "s-hodovaya.jpg",
    "s-elektro": "s-elektro.jpg",
    "s-diag": "s-diag.jpg",
    "s-meh": "s-meh.jpg",
    "s-farkop": "s-farkop.jpg",
    "lift": "lift.jpg",
}


def services() -> None:
    for name, file in SERVICES.items():
        path = SRC / file
        if not path.exists():
            print("  нет", file)
            continue
        img = Image.open(path).convert("RGB")
        img = ImageOps.fit(img, (1200, 900), Image.LANCZOS, centering=(0.5, 0.45))
        save(grade(img, light=0.92, sat=0.9, contrast=1.05), f"{name}.webp", 70)


# ── Иконка приложения: диск того же BMW на графите ────────────────────────
def icons() -> None:
    rim = Image.open(OUT / "rim-f.webp").convert("RGBA")
    for name, size, pad in (("icon-192.png", 192, 0.16), ("icon-512.png", 512, 0.16), ("icon-mask-512.png", 512, 0.26), ("apple-180.png", 180, 0.14)):
        icon = Image.new("RGBA", (size * 4, size * 4), (16, 18, 23, 255))
        ring = Image.new("L", icon.size, 0)
        m = np.zeros((size * 4, size * 4), np.uint8)
        c = size * 2
        r = round(size * 4 * (0.5 - pad))
        cv2.circle(m, (c, c), r, 255, -1, lineType=cv2.LINE_AA)
        red = Image.new("RGBA", icon.size, (214, 30, 38, 255))
        icon.paste(red, (0, 0), Image.fromarray(m))
        disc = rim.resize((round(r * 2 * 0.88), round(r * 2 * 0.88)), Image.LANCZOS)
        icon.alpha_composite(disc, (c - disc.width // 2, c - disc.height // 2))
        icon = icon.resize((size, size), Image.LANCZOS).convert("RGB")
        icon.save(OUT / name, "PNG", optimize=True)
        print(f"{name:22} {size}x{size}  {(OUT / name).stat().st_size // 1024} KB")


for step in sys.argv[3:] or ["bmw", "garage", "posts", "oil", "services", "icons"]:
    print("==", step)
    globals()[step]()
