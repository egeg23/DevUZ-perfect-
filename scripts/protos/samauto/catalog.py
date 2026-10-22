"""Каталог SamAuto с их сайта: python3 -I catalog.py <папка с products.json, dealers.json>.

Владелец, 21.10.2026: «Информацию вытащи с их сайта, что продают, как».
Данные — открытый API samauto.uz (тот же, что рисует их каталог):
POST https://samauto.uz/v1/object/get-list/{products,dealers,categories}
с телом {"data":{}}. Цены на их сайте скрыты (price_visibility = false) —
в макет не идут. Пишет catalog.json рядом и фото моделей в
public/protos/samauto/cat/<n>.webp (640 px).
"""
import io, json, os, re, subprocess, sys
from PIL import Image

SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "../../../public/protos/samauto/cat")
os.makedirs(OUT, exist_ok=True)

CATS = {"Pikaplar": "pikap", "Yuk avtomobillari": "yuk", "Avtobuslar": "avtobus", "Maxsus texnikalar": "maxsus"}
# Кузов — по словам из их названия.
BODY = [("kran-manipulyator", "Kran-manipulyator"), ("sovutgich", "Refrijerator"), ("ag‘dargich", "Samosval"), ("tentli", "Tentli bort"),
        ("bortli", "Bortli"), ("furgon", "Furgon"), ("suv tashuvchi", "Suv tashuvchi"), ("yoqilg‘i tashuvchi", "Yoqilg‘i tashuvchi"),
        ("sepib-yuvuvchi", "Sug‘orish-yuvish"), ("yuvib supuruvchi", "Yuvib-supurish"), ("minora", "Avtominora"),
        ("qutqaruv", "Avariya-qutqaruv"), ("tibbiy", "Tez tibbiy yordam")]
# Кириллические двойники латиницы в их названиях («SAZ НС45») — латиницей.
LOOK = str.maketrans("АВСЕНКМОРТХаеосрх", "ABCEHKMOPTXaeocpx")
fix = lambda s: re.sub(r"\s+", " ", (s or "").replace("'", "‘").replace("`", "‘")).strip().translate(LOOK)


def body_of(t):
    t = t.lower()
    return next((b for k, b in BODY if k in t), "")


def chassis_of(t):
    m = re.search(r"(D-MAX [A-Z]+|NMR\w+|NPR\w+|NQR\w+(?:-\w)?|NPS\w+|FVR\w+|CYZ\w+|LE60|HD50|НС45|HC45)", t)
    return (m.group(1).replace("НС", "HC") if m else "")


def photo(url, n):
    path = os.path.join(OUT, f"{n}.webp")
    if os.path.exists(path):
        return
    raw = subprocess.run(["curl", "-sSL", "--retry", "4", "--retry-all-errors", "-A", "Mozilla/5.0", "--max-time", "120", url], capture_output=True, check=True).stdout
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    im.thumbnail((640, 640), Image.LANCZOS)
    im.save(path, "WEBP", quality=78, method=6)


items = []
for n, p in enumerate(sorted(json.load(open(os.path.join(SRC, "products.json")))["data"], key=lambda p: (p.get("priority") or 99))):
    cat = CATS.get((p.get("category") or {}).get("title_uz", ""))
    if not cat or not p.get("photo"):
        continue
    t = fix(p["title_uz"])
    vol = (p.get("volume_of_engine_id_data") or {}).get("text")
    it = {"n": n, "cat": cat, "title": t, "body": body_of(t), "chassis": chassis_of(t),
          "engine": fix(p.get("engine_model")), "power": fix(p.get("engine_power_uz")), "volume": fix(vol),
          "load": fix(str(p.get("load_capacity") or "")), "weight": p.get("weight") or None, "seats": p.get("passengers") or None,
          "wheels": fix((p.get("wheel_formula_id_data") or {}).get("text")), "fuel": fix((p.get("fuel_types_id_data") or {}).get("title_uz")),
          "dims": fix((p.get("dimensions") or "").replace("х", "×").replace("x", "×")), "base": fix(p.get("wheelbase_uz")),
          # PDF характеристик лежит у них на CDN (кнопка «Xususiyatlarni yuklab olish»)
          "pdf": ("https://ncdn.samauto.uz" + p["catalog_file_uz"]) if p.get("catalog_file_uz") else ""}
    photo(p["photo"], n)
    items.append({k: v for k, v in it.items() if v not in ("", None)})

dealers = []
for d in json.load(open(os.path.join(SRC, "dealers.json")))["data"]:
    if not d.get("isActive"):
        continue
    # Зарубежных показываем только страной: их названия — кириллицей.
    if d["republic"]["title_uz"] != "O'zbekiston":
        dealers.append({"country": fix(d["republic"]["title_uz"])})
        continue
    dealers.append({"country": fix(d["republic"]["title_uz"]), "region": fix(d["region"]["title_uz"]), "name": fix(d["title_uz"].replace("ООО", "MChJ").replace("ЧП", "XK").replace("«", "\"").replace("»", "\"")),
                    "address": fix(d.get("address_uz")), "phone": fix(d.get("phone")),
                    "lat": float(d["latitude"]) if d.get("latitude") else None, "lng": float(d["longitude"]) if d.get("longitude") else None})

# Вопросы и ответы — их раздел «Ko‘p so‘raladigan savollar» (faqs), новости —
# четыре свежих (news), фото новостей сжаты в public/protos/samauto/news/.
strip = lambda h: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", (h or "").replace("&nbsp;", " "))).strip()
faq, seen = [], set()
for f in json.load(open(os.path.join(SRC, "api-faqs.json")))["data"]["data"]["response"]:
    q = fix(f["question_uz"]).replace("o zidan", "o‘zidan")
    key = re.sub(r"\W", "", q.lower())[:40]
    if key in seen:
        continue
    seen.add(key)
    faq.append({"q": q, "a": fix(strip(f.get("answer_uz")))})
# Значки и тире из их текста макету нельзя (правило «без длинных тире»).
plain = lambda t: re.sub(r"\s+", " ", re.sub(r"\s*[—–]\s*", ": ", re.sub(r"[\u2600-\u27bf\u25aa-\u25ff\ufe0f\U0001F300-\U0001FAFF]", " ", t))).strip()
NEWS = os.path.join(HERE, "../../../public/protos/samauto/news")
os.makedirs(NEWS, exist_ok=True)
news = []
for i, x in enumerate(sorted(json.load(open(os.path.join(SRC, "api-news.json")))["data"], key=lambda x: x.get("publish_date") or x.get("createdAt") or "", reverse=True)[:4]):
    raw = subprocess.run(["curl", "-sSL", "--retry", "4", "--retry-all-errors", "-A", "Mozilla/5.0", "--max-time", "120", x["photo"] or x["image"]], capture_output=True, check=True).stdout
    im = Image.open(io.BytesIO(raw)).convert("RGB")
    im.thumbnail((960, 960), Image.LANCZOS)
    im.save(os.path.join(NEWS, f"{i}.webp"), "WEBP", quality=76, method=6)
    news.append({"t": fix(x["title_uz"]), "d": (x.get("publish_date") or x.get("createdAt") or "")[:10], "s": plain(fix(strip(x.get("shortContent_uz") or x.get("description_uz"))))[:220]})

json.dump({"source": "samauto.uz, 21.10.2026", "items": items, "dealers": dealers, "faq": faq, "news": news}, open(os.path.join(HERE, "catalog.json"), "w"), ensure_ascii=False, indent=1)
print(len(items), "моделей,", len(dealers), "дилеров")
