"""Каталог Neoline из их магазина (WooCommerce Store API, открытый).

Запуск: python3 -I catalog.py <папка с ответами>, где лежат
  ru.json  — https://neoline.uz/wp-json/wc/store/v1/products?per_page=100&lang=ru
  uz.json  — https://neoline.uz/wp-json/wc/store/v1/products?per_page=100
Итог — catalog.json рядом: названия, цены в сумах, наличие, описание
по-русски и по-узбекски, какие фото взять. Ничего не выдумывается:
всё, что на сайте макета о товаре, — отсюда.
"""
import html
import json
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1])
ru = json.load(open(SRC / "ru.json"))
uz = [p for p in json.load(open(SRC / "uz.json")) if "/ru/" not in p["permalink"]]

CAT = {"Радар-детекторы и гибриды": "radar", "Видеорегистраторы": "dvr", "Акустика": "audio", "Аксессуары": "acc", "Уценка": "sale"}
# Обложка (кадр 0) — баннер с текстом; у 8900 и 7900 кадр 1 — с кругом подарка.
MAIN = {1000458: 2, 1000435: 2}


def base(slug):
    return re.sub(r"-(ru|uz)$", "", slug)


STAMP = [("Уникальная ", ""), ("уникальная ", ""), ("Инновационная ", ""), ("noyob ", ""), (" innovatsion", ""), ("фиксирует каждую деталь", "чётко снимает детали")]


def plain(s):
    """Их текст без длинных тире, значков и штампов (правило макетов)."""
    s = html.unescape(s)
    for a, b in STAMP:
        s = s.replace(a, b)
    s = s.replace("​", "").replace(" ", " ")
    s = re.sub(r"\s*[—–]\s*", ": ", s, count=0)
    s = s.replace("″", "″").replace("”", "″")
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"^[:\-\s]+", "", s)
    return s[:1].upper() + s[1:]


def lines(desc):
    d = html.unescape(desc)
    d = re.sub(r"<br\s*/?>|</p>|</li>", "\n", d)
    d = re.sub(r"<[^>]+>", "", d)
    out = []
    parts = d.split("\n")
    if len([x for x in parts if x.strip()]) == 1:
        parts = re.split(r"(?<=[.!])\s+(?=[A-ZА-ЯЁ])", parts[0] if parts[0].strip() else [x for x in parts if x.strip()][0])
    for l in parts:
        l = plain(l)
        if l and l != ":":
            out.append(l)
    return out


def name_of(p):
    n = plain(p["name"]).replace(": витринный образец", ", витринный образец").replace(": vitrina namunas", ", vitrina namunasi")
    return n


by_base = {base(p["slug"]): p for p in uz}
items = []
SKIP = {999401}  # узбекская карточка уценки, попавшая в русский список
for p in ru:
    if p["id"] in SKIP:
        continue
    b = base(p["slug"])
    q = by_base.get(b)
    if q is None:
        q = next((x for x in uz if plain(x["name"]).split(",")[0] == plain(p["name"]).split(",")[0] and x["prices"]["price"] == p["prices"]["price"]), None)
    cats = [CAT[c["name"]] for c in p["categories"] if c["name"] in CAT]
    cat = "sale" if "sale" in cats else (cats[0] if cats else "radar")
    price = int(p["prices"]["price"]) // 100
    old = int(p["prices"]["regular_price"]) // 100
    imgs = [i["src"].split("/uploads/")[1] for i in p["images"]]
    main = MAIN.get(p["id"], 1 if len(imgs) > 1 else 0)
    items.append({
        "id": p["id"],
        "slug": base(p["slug"]),
        "sku": p.get("sku") or "",
        "cat": cat,
        "pop": "Популярное" in [c["name"] for c in p["categories"]],
        "name": {"ru": name_of(p), "uz": name_of(q) if q else name_of(p)},
        "price": price,
        "old": old if old > price else 0,
        "stock": bool(p["is_in_stock"]),
        "url": {"ru": p["permalink"], "uz": q["permalink"] if q else p["permalink"]},
        "text": {"ru": lines(p["description"]), "uz": lines(q["description"]) if q else []},
        "main": main,
        "imgs": len(imgs),
    })

json.dump(items, open(Path(__file__).with_name("catalog.json"), "w"), ensure_ascii=False, indent=1)
print(len(items), "товаров")
