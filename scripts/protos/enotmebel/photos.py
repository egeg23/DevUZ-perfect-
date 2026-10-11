"""Фото прототипа Enotmebel.

python3 -I photos.py <папка с исходниками> <public/protos/enotmebel>

Все снимки — с enotmebel.uz (снято 11.10.2026), со знаком ENOTMEBEL, как у
них на сайте: модели, кадр «девушка на груше» для первого экрана (PNG с
прозрачным фоном), галерея с мероприятий и логотипы клиентов. Ничего не
дорисовано и не увеличено: каждый файл не шире исходника, на экране — не
крупнее половины своей ширины (2x на ретине).
"""
import sys, os
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)


def save(im, name, q=80):
    im.save(os.path.join(out, name), "WEBP", quality=q, method=6)


def fit(im, w):
    return im if im.width <= w else im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)


# Первый экран и заставка: девушка на зелёной груше, сюзане за спиной,
# фон прозрачный — под ним наш цвет. 2560 — компьютер, 1440 — телефон.
hero = Image.open(os.path.join(src, "2025_07_1-scaled.png")).convert("RGBA")
save(hero, "hero-2560.webp", 82)
save(fit(hero, 1440), "hero-1440.webp", 82)

# Модели: исходники 1024 × 1536, отдаём 1024 (2x для карточки в 512) и 600.
MODELS = {
    "mini": "2023_09_мини.png",
    "standart": "x_груша-станд.png",
    "big": "x_бигd.png",
    "gigant": "x_гинант222-1.png",
    "voyvo": "2025_07_ГИГАНТ-№.png",
    "fl-grand": "2025_07_GRAND.png",
    "fl-stand": "2025_07_flaund.png",
    "fl-mini": "2025_07_ФЛАУНД-МИНИ2.png",
    "aero": "2025_07_aero.png",
    "kvadro": "2025_07_кадро.png",
    "piramida": "2025_07_пира2.png",
    "pifagor": "2025_07_пифа.png",
    "maxrelax": "2025_07_MAX-RELA.jpg",
    "sleeprelax": "2025_07_SLEEP-MAx.png",
    "strech": "2025_07_strech.png",
}
for k, f in MODELS.items():
    im = Image.open(os.path.join(src, f)).convert("RGB")
    save(fit(im, 1024), f"m-{k}-1024.webp", 80)
    save(fit(im, 600), f"m-{k}-600.webp", 78)

# Галерея: их снимки с мероприятий и офисов, 960 × 1280 и меньше.
GAL = ["21", "23", "24", "25", "27", "30", "31", "32", "34", "37"]
for n, g in enumerate(GAL, 1):
    im = Image.open(os.path.join(src, f"2026_04_photo_2026-04-19-11.09.{g}.jpeg")).convert("RGB")
    save(im, f"g{n}-960.webp", 80)
    save(fit(im, 520), f"g{n}-520.webp", 78)

# Логотипы клиентов из блока на их главной.
for c in ["asklepiy", "carlsberg", "discover", "enter", "it_park", "sevimli"]:
    im = Image.open(os.path.join(src, f"2025_06_{c}.png")).convert("RGBA")
    save(im, f"c-{c}.webp", 90)

# Иконки вкладки: фигурка из их логотипа на синем.
fav = Image.open(os.path.join(src, "2025_06_favicon-300x300.png")).convert("RGBA")
for s in (192, 180):
    bg = Image.new("RGBA", (s, s), (255, 255, 255, 255))
    bg.alpha_composite(fav.resize((s, s), Image.LANCZOS))
    bg.convert("RGB").save(os.path.join(out, "icon-192.png" if s == 192 else "apple-180.png"))
print(sorted(os.listdir(out)))

# Ткани: карты расцветок со страницы «Ткани» на enotmebel.uz. Каждый образец
# вырезается из карты как есть: большой — для показа (не крупнее исходника),
# квадрат 150 — для выбора цвета, квадрат до 280 — для столбиков в истории.
# Номера цветов — как подписаны на картах.
import json
import numpy as np

CARDS = {
    "polycon": ("polycon.jpg", "w", [str(i) for i in range(1, 21)]),
    "velour2": ("VELUTTO_colourcard-art-77.jpg", "w", ["%02d" % i for i in range(1, 78)]),
    "diagonal": ("DIAGONAL_colourcard.jpg", "w", ["100", "114", "160", "233", "268", "290", "310", "411", "540", "618", "694", "779", "900", "995", "997", "999"]),
    "micro": ("VELVETLUX_colourcard-art.jpg", "k", ["%02d" % i for i in range(1, 101)]),
    "velour": ("ZODIAK_colourcard-art.jpg", "w", ["010", "100", "110", "130", "150", "190", "210", "230", "235", "290", "337", "392", "432", "552", "651", "657", "667", "673", "678", "764", "770", "796", "931", "936", "960", "992", "994", "996", "999"]),
}


def boxes(im, bg):
    a = np.asarray(im.convert("RGB")).astype(int)
    m = (a.min(axis=2) < 244) if bg == "w" else (a.max(axis=2) > 14)
    H, W = m.shape
    # Образец — сплошной прямоугольник: строки и столбцы, где его много.
    seen = np.zeros_like(m, dtype=bool)
    out = []
    import collections
    for y in range(0, H, 6):
        for x in range(0, W, 6):
            if not m[y, x] or seen[y, x]:
                continue
            # заливка по сетке с шагом 3
            q = collections.deque([(y, x)]); seen[y, x] = True
            y0 = y1 = y; x0 = x1 = x; n = 0
            while q:
                cy, cx = q.popleft(); n += 1
                y0, y1, x0, x1 = min(y0, cy), max(y1, cy), min(x0, cx), max(x1, cx)
                for dy, dx in ((3, 0), (-3, 0), (0, 3), (0, -3)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; q.append((ny, nx))
            w, h = x1 - x0, y1 - y0
            if w > W / 14 and h > H / 30 and n * 9 > .8 * w * h:
                out.append((x0, y0, w, h))
    rh = sorted(b[3] for b in out)[len(out) // 2]
    out.sort(key=lambda b: (round(b[1] / rh), b[0]))
    return out


# Образцы для столбиков в истории — тот же список, что STORY_SW в gen.mjs.
STORY = {"polycon": ["5", "18", "12", "20", "3"], "velour2": ["27", "45", "56", "35", "72"], "diagonal": ["540", "779", "411", "694", "310"], "micro": ["09", "72", "45", "28", "84"], "velour": ["432", "667", "337", "796", "552"]}

FAB = {}
for fid, (f, bg, codes) in CARDS.items():
    im = Image.open(os.path.join(src, f)).convert("RGB")
    bs = boxes(im, bg)
    assert len(bs) == len(codes), (fid, len(bs), len(codes))
    FAB[fid] = []
    for (x, y, w, h), code in zip(bs, codes):
        i = max(3, round(min(w, h) * .04))
        x0 = x + i + (round(w * .26) if fid == "polycon" else 0)
        crop = im.crop((x0, y + i, x + w - i, y + h - i))
        save(crop, f"f-{fid}-{code}.webp", 80)
        # У Velvet Lux и Zodiak по центру знак поставщика ткани: плитку берём
        # из левого угла, где его нет.
        if fid in ("micro", "velour"):
            s = min(crop.height, int(crop.width * .38))
            sq = crop.crop((0, 0, s, s))
        else:
            s = min(crop.size)
            sq = crop.crop(((crop.width - s) // 2, (crop.height - s) // 2, (crop.width - s) // 2 + s, (crop.height - s) // 2 + s))
        save(fit(sq, 150), f"f-{fid}-{code}-c.webp", 82)
        if code in STORY[fid]:
            save(fit(sq, 280), f"f-{fid}-{code}-s.webp", 82)
        avg = np.asarray(sq.resize((8, 8), Image.LANCZOS)).reshape(-1, 3).mean(axis=0)
        FAB[fid].append([code, crop.width, crop.height, "#%02x%02x%02x" % tuple(int(v) for v in avg), s if s < 280 else 280])
json.dump(FAB, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "fabrics.json"), "w"))
print({k: len(v) for k, v in FAB.items()})
