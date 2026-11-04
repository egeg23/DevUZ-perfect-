# Каталог SAMIST AUTO с их сайта: python3 -I catalog.py <папка со страницами>
#
# Сайт клиента — витрина дилера на autoline.uz (samist.autoline.uz): 14
# объявлений, у каждого цена в сумах, тип, характеристики и фото. Открытого
# API нет, поэтому страницы объявлений скачиваются руками (curl по ссылкам из
# /stock/, с паузой: сайт отвечает 429 на частые запросы), а этот скрипт
# разбирает их в catalog.json и кладёт фото в public/protos/samist/cat/.
# Ничего не придумываем: в каталог идёт только то, что написано на странице.
import html
import json
import re
import sys
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1])
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / "public/protos/samist/cat"
OUT.mkdir(parents=True, exist_ok=True)
UA = {"user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/130"}


def text(s):
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = html.unescape(re.sub(r"<[^>]+>", "", s))
    return re.sub(r"[ \t ]+", " ", s).strip()


def plain(s):
    """Их текст без длинных тире и лишних знаков (правило «без длинных тире»)."""
    s = s.replace("—", ",").replace("–", "-").replace("“", "«").replace("”", "»")
    return re.sub(r"\s+,", ",", s).strip(" ,")


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


items = []
for page in sorted(SRC.glob("*.html")):
    s = page.read_text(encoding="utf8")
    h1 = text(re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S).group(1))
    price = re.search(r"Цена: ([\d\s\u00a0]+?)\s*UZS", html.unescape(s))
    pairs = re.findall(r'<span class="field">(.*?)</span>\s*<span class="value">(.*?)</span>', s, re.S)
    spec, seen = [], set()
    # Второй раз «Марка» — это двигатель, «Тип» — коробка, «Объем» в см³ — мотор.
    AGAIN = {"Марка": "Двигатель", "Тип": "Коробка", "Объем": "Объём двигателя"}
    for k, v in pairs:
        k, v = text(k).rstrip(":"), text(v)
        if k in ("Место расположения", "Дата размещения", "Autoline ID", "Machineryline ID", "Номер в стоке продавца") or not v:
            continue
        if k in seen and k in AGAIN:
            k = AGAIN[k]
        if k in seen:
            continue
        seen.add(k)
        spec.append([k, plain(v)])
    # «Описание» — свободный текст дилера (комплектация, объём кузова).
    note = ""
    m = re.search(r"Дополнительная информация\s*</strong>(.*?)(?:Как с нами связаться|<div class=\"contacts)", s, re.S)
    if m:
        note = text(m.group(1))
        note = note.split("Дополнительная информация", 1)[-1]
        note = re.sub(r"\n\s*\n+", "\n", note).strip()
    usd = re.search(r"≈\s*([\d\s ]+)\s*\$", text(s))
    imgs = []
    for u in re.findall(r"https://img\.linemedia\.com/img/s/[^\"' ]+_big--\d+\.jpg", s):
        tail = u.rsplit("--", 1)[1].removesuffix(".jpg")
        if tail in page.name and u not in imgs:
            imgs.append(u)
    # Раздел — из «хлебных крошек» их страницы: Грузовики > Автофургоны > …
    flat = [x.strip() for x in text(re.sub(r"<script.*?</script>|<style.*?</style>", "", s, flags=re.S)).split("\n") if x.strip()]
    at = max(i for i, x in enumerate(flat) if x == "Главная")
    crumbs = flat[at + 1:at + 3]
    kind = dict(spec).get("Тип", "")
    brand = dict(spec).get("Марка", "")
    model = dict(spec).get("Модель", "")
    name = f"{brand} {model}".strip() if model else h1
    key = slug(name)
    files = []
    for n, u in enumerate(imgs[:6]):
        f = OUT / f"{key}-{n}.webp"
        if not f.exists():
            raw = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30).read()
            im = Image.open(BytesIO(raw)).convert("RGB")
            im.thumbnail((1280, 1280))
            im.save(f, "WEBP", quality=80, method=6)
        files.append(f.name)
    items.append({
        "id": key,
        "name": name,
        "title": plain(h1),
        "kind": kind,
        "cat": crumbs[0],
        "sub": crumbs[1] if crumbs[1] != h1 else "",
        "new": h1.startswith("Новый"),
        "uzs": int(re.sub(r"\D", "", price.group(1))) if price else None,
        "usd": int(re.sub(r"\D", "", usd.group(1))) if usd else None,
        "spec": spec,
        "note": plain(note)[:1200],
        "url": "https://samist.autoline.uz/" + page.name,
        "img": files,
    })
    print(f"{key}: {len(spec)} полей, {len(files)} фото, {items[-1]['uzs']}")

items.sort(key=lambda x: (x["uzs"] or 0))
(HERE / "catalog.json").write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf8")
print(len(items), "объявлений →", HERE / "catalog.json")
