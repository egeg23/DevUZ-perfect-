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
