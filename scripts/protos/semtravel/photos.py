# Фото макета SEM Travel → public/protos/semtravel (WebP).
# Unsplash (лицензия Unsplash: бесплатно и в коммерческих целях) и Wikimedia
# Commons (CC BY, автор в SOURCES.md и в подвале макета). Их собственных фото
# направлений нет: на semtravel.uz снимки отелей идут из базы туроператоров.
# python3 -I photos.py <пустой каталог для исходников>
import sys, os, time, urllib.request, urllib.error
from PIL import Image
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/semtravel")
os.makedirs(OUT, exist_ok=True)
U = "https://images.unsplash.com/photo-{}?w=2000&q=85&fm=jpg"
# Commons отдаёт оригиналы скупо (429): сначала их готовые копии 1280 и
# 1920 px, потом оригинал; на 429 ждём и пробуем снова.
def C(path):
    name = path.rsplit("/", 1)[1]
    base = "https://upload.wikimedia.org/wikipedia/commons/"
    return [f"{base}thumb/{path}/{w}px-{name}" for w in (1280, 960, 1920)] + [base + path]
PHOTOS = {
    "hero": U.format("1507525428034-b723cf961d3e"),
    "d-dubai": U.format("1512453979798-5ea266f8880c"),
    "d-turkey": U.format("1524231757912-21f4fe3a7200"),
    "d-egypt": U.format("1539650116574-8efeb43e2750"),
    "d-thai": U.format("1552733407-5d5c46c3bb3b"),
    "d-vietnam": U.format("1528127269322-539801943592"),
    "d-china": U.format("1474181487882-5abf3f0ba6c2"),
    "d-lanka": U.format("1566296314736-6eaac1ca0cb9"),
    "h-pool": U.format("1566073771259-6a8506099945"),
    "h-room": U.format("1576675784201-0e142b423952"),
    "h-sea": U.format("1584132967334-10e028bd69f7"),
    "d-georgia": C("d/d4/Tbilisi%2C_Old_town%2C_Georgia.jpg"),
    "d-azer": C("e/ee/Baku_Flame_Towers.jpg"),
    "d-qatar": C("8/86/Doha_skyline_in_the_morning_%2812544910974%29.jpg"),
}
def save(im, name, w):
    w = min(w, im.width)
    out = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    out.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=76, method=6)
    return out.size
for name, url in PHOTOS.items():
    src = os.path.join(SRC, name + ".jpg")
    if not os.path.exists(src):
        data = None
        for wait in (0, 60, 120, 240):
            for u in url if isinstance(url, list) else [url]:
                time.sleep(wait)
                try:
                    req = urllib.request.Request(u, headers={"User-Agent": "DevUzBot/1.0 (https://devuz.studio)"})
                    with urllib.request.urlopen(req) as r: data = r.read()
                    break
                except urllib.error.HTTPError as e:
                    if e.code not in (404, 429): raise
            if data: break
        open(src, "wb").write(data)
    im = Image.open(src).convert("RGB")
    if name == "hero":
        print(name, im.size, save(im, "hero", 1920))
        # телефон: вертикальный кадр из середины
        h = im.height; w = round(h * 9 / 16); x = (im.width - w) // 2
        print(save(im.crop((x, 0, x + w, h)), "hero-9", 900))
        continue
    # карточки — 3:2, высокий кадр режем по середине
    if im.height > im.width * 2 / 3 + 2:
        h = round(im.width * 2 / 3); y = (im.height - h) // 2
        im = im.crop((0, y, im.width, y + h))
    print(name, im.size, save(im, name, 1200), save(im, name + "-s", 640))
