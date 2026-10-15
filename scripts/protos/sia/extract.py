"""
Данные макета SIA — только с сайта бюро (sia88.ru, открытый WordPress API).

Запуск: python3 -I extract.py <папка с выгрузкой>, где лежат posts.json,
tags.json (wp-json/wp/v2/posts и tags). Пишет data.json рядом: архив всех
проектов (код, что за объект, тип, площадь, срок, дата) и подробные карточки
избранных — тексты и адреса снимков бюро. Ничего не дописывает от себя.
"""
import html, json, re, sys, os

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")

# Избранные: архитектура в галерею, интерьеры в стопку. Номера снимков —
# порядок картинок проекта на сайте бюро; первый — обложка.
FEATURED = {
    "APx182.1208": [1, 2, 3, 4],
    "APx181.2607": [1, 2, 3, 4, 5],
    "APx180.2606": [0, 1, 2, 3, 4],
    "APx179.2510": [0, 1, 2, 3, 4],
    "APx178.2509": [0, 1, 2, 3, 4],
    "APx183.2504": [0, 1, 2, 3, 4],
    "APx189.2412": [0, 1, 2, 3, 4],
    "APx196.2411": [0, 1, 2, 3, 4],
    "ИНт238.2606": [0, 1, 2, 3, 4],
    "ИНт219.2409": [0, 1, 2, 3, 4],
    "ИНт230.2502": [0, 1, 2, 3, 4],
    "ИНт222.2410": [0, 1, 2, 3, 4],
    "ИНт232.2503": [0, 1, 2, 3, 4],
    "ИНт237.2605": [1, 2, 3, 4],
}

def text(h):
    h = re.sub(r"<(script|style|svg)[^>]*>.*?</\1>", "", h, flags=re.S)
    h = re.sub(r"<(br|/p|/h\d|/li|/div)[^>]*>", "\n", h)
    t = html.unescape(re.sub(r"<[^>]+>", " ", h))
    return [l.strip() for l in re.sub(r"[ \t]+", " ", t).split("\n") if l.strip()]

def after(lines, head, n=2):
    for i, l in enumerate(lines):
        if l == head and i + n < len(lines):
            return lines[i + n]
    return None

tags = {t["id"]: t["name"] for t in json.load(open(os.path.join(SRC, "tags.json")))}
posts = json.load(open(os.path.join(SRC, "posts.json")))
index, featured = [], []
for p in posts:
    if "/proekty/" not in p["link"]:
        continue
    code = html.unescape(p["title"]["rendered"]).strip()
    L = text(p["content"]["rendered"])
    i0 = L.index(code)
    title, sub = L[i0 + 1], L[i0 + 2]
    term = after(L, "Срок выполнения")
    area = after(L, "Площадь")
    kinds = [tags[t] for t in p["tags"] if t in tags and tags[t] not in ("Архитектурное проектирование", "Дизайн-проект", "Новость")]
    item = {
        "code": code,
        "slug": p["link"].rstrip("/").split("/")[-1],
        "cat": "arh" if "/arhitektura/" in p["link"] else "int",
        "title": title, "sub": sub,
        "term": term if term and re.fullmatch(r"[\d,]+", term) else None,
        "area": area.replace("'", " ") if area and re.fullmatch(r"[\d' ]+", area) else None,
        "kinds": kinds, "date": p["date"][:10],
    }
    index.append(item)
    if code in FEATURED:
        c = p["content"]["rendered"]
        imgs = []
        for u in re.findall(r"https://sia88\.ru/wp-content/uploads/[^\"\s,]+?\.(?:jpe?g|png|webp)", c):
            u = re.sub(r"-\d+x\d+(\.\w+)$", r"\1", u)
            if u not in imgs and "logo" not in u and "/2025/02/" not in u and "mironova" not in u:
                imgs.append(u)
        k = L.index("Что было сделано") if "Что было сделано" in L else len(L)
        s = L.index("Стоимость,") + 2 if "Стоимость," in L else i0 + 3
        lead = [l for l in L[s:k] if len(l) > 60]
        end = next((j for j, l in enumerate(L) if l.startswith("Обзор ")), len(L))
        steps = [l for l in L[k + 1:end] if len(l) > 40]
        crew = L.index("Над проектом работали") if "Над проектом работали" in L else len(L)
        more = [l for l in L[end + 1:crew] if len(l) > 120]
        featured.append({**item, "lead": lead, "steps": steps, "more": more, "imgs": [imgs[j] for j in FEATURED[code] if j < len(imgs)]})

order = list(FEATURED)
featured.sort(key=lambda f: order.index(f["code"]))
json.dump({"index": index, "featured": featured}, open(OUT, "w"), ensure_ascii=False, indent=1)
print(len(index), "в архиве,", len(featured), "избранных")
for f in featured:
    print(f["code"], f["area"], f["term"], len(f["lead"]), len(f["steps"]), len(f["more"]), len(f["imgs"]), f["kinds"])
