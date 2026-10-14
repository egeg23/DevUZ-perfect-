# Фото макета TurBron → public/protos/turbron (WebP 1080 и 640 px).
# Все снимки — Unsplash (лицензия Unsplash: можно бесплатно и в коммерческих
# целях, без разрешения автора), список и ссылки — SOURCES.md.
# python3 -I photos.py <пустой каталог для исходников>
import sys, os, urllib.request
from PIL import Image
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/turbron")
os.makedirs(OUT, exist_ok=True)
PHOTOS = {
    # направления
    "d-turkey": "1524231757912-21f4fe3a7200", "d-egypt": "1539650116574-8efeb43e2750",
    "d-uae": "1512453979798-5ea266f8880c", "d-thai": "1552733407-5d5c46c3bb3b",
    "d-maldives": "1514282401047-d79a71a590e8", "d-vietnam": "1528127269322-539801943592",
    # демо-отели: фасад или бассейн, номер, море
    "h-lara-0": "1566073771259-6a8506099945", "h-lara-1": "1576675784201-0e142b423952", "h-lara-2": "1507525428034-b723cf961d3e",
    "h-kemer-0": "1606046604972-77cc76aee944", "h-kemer-1": "1611892440504-42a792e24d32", "h-kemer-2": "1584132967334-10e028bd69f7",
    "h-sharm-0": "1551882547-ff40c63fe5fa", "h-sharm-1": "1586611292717-f828b167408c", "h-sharm-2": "1544551763-46a013bb70d5",
    "h-dubai-0": "1542314831-068cd1dbfeeb", "h-dubai-1": "1582719478250-c89cae4dc85b",
    "h-phuket-0": "1520250497591-112f2f40a3f4", "h-phuket-1": "1571896349842-33c89424de2d",
    "h-male-0": "1573843981267-be1999ff37cd", "h-male-1": "1590523277543-a94d2e4eb00b",
    "h-nha-0": "1568084680786-a84f91d1153c", "h-nha-1": "1540541338287-41700207dee6",
    "hero": "1505881502353-a1986add3762",
}
for name, pid in PHOTOS.items():
    src = os.path.join(SRC, name + ".jpg")
    if not os.path.exists(src):
        urllib.request.urlretrieve(f"https://images.unsplash.com/photo-{pid}?w={1800 if name == 'hero' else 1200}&q=85&fm=jpg", src)
    im = Image.open(src).convert("RGB")
    widths = [1600, 860] if name == "hero" else [1080, 640]
    for k, w in enumerate(widths):
        w = min(w, im.width)
        out = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        out.save(os.path.join(OUT, f"{name}{'' if k == 0 else '-s'}.webp"), "WEBP", quality=78, method=6)
    print(name, im.size)
