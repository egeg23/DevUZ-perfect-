"""Каталог макета Oson Apteka: 20 популярных лекарств с их главной.

python3 -I catalog.py → catalog.json

Только GET их же страниц, как браузер: главная (список «Популярные товары»)
и страница каждого лекарства (данные Nuxt в разметке: название, бренд,
производитель, АТХ, цена «от», рецептурный ли, фото; разделы инструкции).
Цены — их «от … сум» на 30.10.2026; цен по аптекам на странице нет (их
грузит API), поэтому в макете по аптекам цена не придумывается.
"""
import html, json, os, re, sys, urllib.request

UA = {"User-Agent": "Mozilla/5.0"}
SITE = "https://osonapteka.uz"
DIR = os.path.dirname(os.path.abspath(__file__))


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read().decode("utf-8", "ignore")


def nuxt(s):
    d = json.loads(re.search(r'id="__NUXT_DATA__"[^>]*>(.*?)</script>', s, re.S).group(1))
    for x in d:
        if isinstance(x, dict) and "productName" in x:
            return {k: (d[v] if isinstance(v, int) else v) for k, v in x.items()}


def lines(s):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", s, flags=re.S)
    t = re.sub(r"<br\s*/?>", "\n", t)
    t = html.unescape(re.sub(r"<[^>]+>", "\n", t))
    return [l.strip() for l in t.split("\n") if l.strip()]


HEADS = ["Показания", "Противопоказания", "Форма выпуска", "Состав", "Свойства", "Фармакодинамика", "Фармакокинетика", "Побочные действия", "Особенности продажи", "Особые условия", "Особые условия хранения", "Описание", "Дозировка", "Передозировка", "Способ применения", "Применение", "Лекарственное взаимодействие", "Условия отпуска из аптек", "Срок годности", "Условия хранения"]


def sections(ls):
    # второе появление заголовка — начало раздела (первое — оглавление)
    seen, out, cur = {}, {}, None
    for l in ls:
        if l in HEADS:
            seen[l] = seen.get(l, 0) + 1
            if seen[l] >= 2:
                cur = l
                out.setdefault(cur, [])
                continue
        if cur:
            out[cur].append(l)
    return {k: " ".join(v)[:900] for k, v in out.items()}


home = get(SITE + "/")
slugs = []
for m in re.finditer(r'href="/([a-z0-9-]+-[A-Za-z0-9_-]{4,})"', home):
    if m.group(1) not in slugs and m.group(1) not in ("popular-products",):
        slugs.append(m.group(1))
items = []
for slug in slugs:
    s = get(f"{SITE}/{slug}")
    p = nuxt(s)
    if not p:
        continue
    sec = sections(lines(s))
    items.append({
        "slug": slug, "name": p["productName"], "brand": p["brandName"], "maker": p["manufacturerName"],
        "atc": p["anatomicalTherapeuticChemicalCode"], "atcName": p["anatomicalTherapeuticChemicalName"],
        "price": p["minPrice"], "rx": bool(p["isByPrescription"]), "img": p["imageURI"], "url": p["uri"],
        "sec": {k: sec[k] for k in ("Показания", "Форма выпуска", "Состав", "Способ применения", "Особенности продажи", "Условия отпуска из аптек") if k in sec},
    })
    print(len(items), p["productName"], p["minPrice"], file=sys.stderr)
json.dump({"taken": "2026-10-30", "source": SITE, "items": items}, open(os.path.join(DIR, "catalog.json"), "w"), ensure_ascii=False, indent=1)
