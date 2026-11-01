"""Фото Agora для макета: их снимки из меню rezvo и бесплатные стоки → WebP.

Запуск: python3 -I scripts/protos/agora/photos.py <папка-выгрузки>

В папке выгрузки:
  d-<8 знаков id>.<ext>  — фото блюд из их меню rezvo (list.tsv собирает выгрузку);
  g0..g11.<ext>          — галерея зала из их меню rezvo;
  us-<id unsplash>.jpg   — стоки Unsplash (лицензия Unsplash), только где их фото нет.

Пишет public/protos/agora:
  d-<id>.webp (до 1280 px) и d-<id>-s.webp (560 px) — блюда;
  h-<n>.webp (до 1680 px), h-<n>-s.webp (960 px), h-<n>-b.webp (размытый фон 640 px) — зал;
  photos.json — какие блюда с фото и размеры.

Правила (SKILL proto-master, п. 6): не растягиваем; заглушки rezvo (логотип на
чёрном, 1280×720, ~23 КБ) и снимки уже 560 px не берём.
"""
import json, os, sys
from PIL import Image, ImageFilter

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/agora")
os.makedirs(OUT, exist_ok=True)

# Стоки Unsplash → id блюда в их меню (только позиции без своего фото).
STOCK = {
    "1550304943-4f24f54ddde9": "Цезарь",
    "1548943487-a2e4e43b4853": "Суп Том Ям",
    "1452195100486-9cc805987862": "Сырная тарелка",
    "1546173159-315724a31696": "Лимонад Манго-Маракуя",
    "1497534446932-c925b458314e": "Лимонад Ягодный",
    "1621263764928-df1444c5e859": "Лимонад классический",
    "1551538827-9c037cb4f32a": "Мохито",
    "1556679343-c7306c1976bc": "Айс ти 1л",
    "1600271886742-f049cd451bba": "Фреш апельсиновый",
    "1541167760496-1628856ab772": "Латте",
    "1572442388796-11668a67e53d": "Кофе Cappuccino",
    "1510707577719-ae7c14805e3a": "Эспрессо",
    "1564890369478-c89ca6d9cde9": "Чай (чёрный, зелёный)",
    "1627435601361-ec25f5b1d0e5": "ЧАЙ ЗЕЛЕНЫЙ",
    "1608270586620-248524c67de9": "Кружка пенного фильтрованное",
}


def save(im, name, width, q=80):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name), "WEBP", quality=q, method=6)
    return im.size


def placeholder(path, im):
    # Заглушка rezvo: логотип на ровном чёрном, файл ~23 КБ.
    return os.path.getsize(path) < 30000 and im.size == (1280, 720)


menu = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "menu-src.json")))
by_name = {}
for c in menu["categories"]:
    for d in c["items"]:
        by_name.setdefault(d["name"], d["id"][:8])

photos = {}
for f in sorted(os.listdir(SRC)):
    p = os.path.join(SRC, f)
    key, _ = os.path.splitext(f)
    if key.startswith("d-"):
        im = Image.open(p).convert("RGB")
        if placeholder(p, im) or im.width < 560:
            continue
        idd = key[2:]
        w, h = save(im, f"d-{idd}.webp", 1280, 82)
        save(im, f"d-{idd}-s.webp", 560, 78)
        photos[idd] = {"w": w, "h": h, "src": "rezvo"}
    elif key.startswith("g"):
        im = Image.open(p).convert("RGB")
        n = key[1:]
        w, h = save(im, f"h-{n}.webp", 1680, 80)
        save(im, f"h-{n}-s.webp", 960, 76)
        b = im.copy()
        b.thumbnail((640, 640))
        b.filter(ImageFilter.GaussianBlur(14)).save(os.path.join(OUT, f"h-{n}-b.webp"), "WEBP", quality=70)
        photos["h" + n] = {"w": w, "h": h, "src": "rezvo"}
    elif key.startswith("us-"):
        uid = key[3:]
        name = STOCK.get(uid)
        if not name or name not in by_name:
            print("пропуск стока", uid, name)
            continue
        idd = by_name[name]
        im = Image.open(p).convert("RGB")
        w, h = save(im, f"d-{idd}.webp", 1280, 80)
        save(im, f"d-{idd}-s.webp", 560, 76)
        photos[idd] = {"w": w, "h": h, "src": "unsplash:" + uid}

json.dump(photos, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "photos.json"), "w"), ensure_ascii=False, indent=0, sort_keys=True)
print(len(photos), "фото")
