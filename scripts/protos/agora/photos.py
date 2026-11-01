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
чёрном, 1280×720, ~23 КБ) и снимки уже 360 px не берём (их бутылки 365-447 px идут как есть, без растягивания).
"""
import json, os, sys
from PIL import Image, ImageFilter

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/agora")
os.makedirs(OUT, exist_ok=True)

# Стоки Unsplash → позиции их меню без своего фото: (id снимка, название в меню, «похожее»).
# «Похожее» (True) — тот же вид напитка или блюда, но не их марка: на сайте подпись
# «Похожее фото». Без флага — снимок того же блюда.
STOCK = [
    ("1550304943-4f24f54ddde9", "Цезарь", False),
    ("1548943487-a2e4e43b4853", "Суп Том Ям", False),
    ("1452195100486-9cc805987862", "Сырная тарелка", False),
    ("1546173159-315724a31696", "Лимонад Манго-Маракуя", False),
    ("1497534446932-c925b458314e", "Лимонад Ягодный", False),
    ("1621263764928-df1444c5e859", "Лимонад классический", False),
    ("1551538827-9c037cb4f32a", "Мохито", False),
    ("1556679343-c7306c1976bc", "Айс ти 1л", False),
    ("1600271886742-f049cd451bba", "Фреш апельсиновый", False),
    ("1541167760496-1628856ab772", "Латте", False),
    ("1572442388796-11668a67e53d", "Кофе Cappuccino", False),
    ("1510707577719-ae7c14805e3a", "Эспрессо", False),
    ("1564890369478-c89ca6d9cde9", "Чай (чёрный, зелёный)", False),
    ("1627435601361-ec25f5b1d0e5", "ЧАЙ ЗЕЛЕНЫЙ", False),
    ("1608270586620-248524c67de9", "Кружка пенного фильтрованное", False),
    # 01.11.2026, второй заход: «подставь фото того, где ничего нет».
    ("1589621316382-008455b857cd", "Огурцы свежие", False),
    ("1585059895524-72359e06133a", "Киви", False),
    ("1546094096-0df4bcaaa337", "Помидор", False),
    ("1547514701-42782101795e", "Апельсин", False),
    ("1514756331096-242fdeb70d4a", "Груша", False),
    ("1472476443507-c7a5948772fc", "Соус Пилати 40гр", True),
    ("1509440159596-0249088772ff", "Бородинский хлеб", False),
    ("1628088062854-d1870b4553da", "Тостерный хлеб", False),
    ("1508061253366-f7da158b6d46", "Миндаль", False),
    ("1511381939415-e44015466834", "Шоколад", False),
    ("1590502593747-42a996133562", "Лимон", False),
    ("1558642452-9d2a7deb7f62", "Мед 40гр", False),
    ("1587049352846-4a222e784d38", "Арбуз", False),
    ("1571575173700-afb9492e6a50", "Арбуз - Дыня", True),
    ("1514218953589-2d7d37efd2dc", "Coca-Cola 0,25", False),
    ("1625772299848-391b6a87d7b3", "Sprite 0,250мл", False),
    ("1523362628745-0c100150b504", "Негазированная вода Bonaqua", True),
    ("1523362628745-0c100150b504", "Вода б/г 1л", True),
    ("1548839140-29a749e1cf4d", "Газированная вода Bonaqua 0.5", True),
    ("1621506289937-a8e4df240d0b", "Сок в ассортименте", False),
    ("1587015990127-424b954e38b5", "Фреш Яблочно-апельсиновый", True),
    ("1542990253-0d0f5be5f0ed", "Kakao", False),
    ("1497515114629-f71d768fd07c", "Американо", False),
    ("1571934811356-5cc061b6821f", "Клюквенный чай с корицей", True),
    ("1576092768241-dec231879fc3", "Чай Травяной", False),
    ("1597318181409-cf64d0b5d8a2", "Чай Ягодный", False),
    ("1544787219-7f47ccb76574", "Чай Карак", False),
    ("1627435601361-ec25f5b1d0e5", "Чай жасминовый", True),
    ("1627435601361-ec25f5b1d0e5", "Чай зеленый с лимоном и сахаром", True),
    ("1470337458703-46ad1756a187", "Old fashion", False),
    ("1551751299-1b51cab2694c", "Негрони", False),
    ("1560512823-829485b8bf24", "Aperol Spritz", False),
    ("1546171753-97d7676e4602", "Джин тоник", False),
    ("1546171753-97d7676e4602", "Gin & Tonic", False),
    ("1513558161293-cdaf765ed2fd", "Мохито алкогольное", False),
    ("1571950006418-f226dc106482", "Голубая лагуна", False),
    ("1541546006121-5c3bc5e8c7b9", "Виски саур", False),
    ("1556679343-c7306c1976bc", "Лонг-Айленд", True),
    ("1563223771-5fe4038fbfc9", "Сlover club", False),
    ("1592483648228-b35146a4330c", "Campari 40ml", False),
    ("1600213903598-25be92abde40", "Пиво Corona 0.33l", False),
    ("1614313511387-1436a4480ebb", "Bacardi Carta Negra 50ml", True),
    ("1569529465841-dfecdab7503b", "Johnnie Walker Black Label50ml", False),
    ("1569529465841-dfecdab7503b", "Виски Black Label 50мл", False),
    ("1535958636474-b021ee887b13", "Сарбаст 500 мл разлив", True),
    ("1567696911980-2eed69a46042", "Жатейский гусь 300 мл разлив", True),
    ("1600788886242-5c96aabe3757", "Кружка пиво не фильтрованное", True),
    ("1474722883778-792e7990302f", "Вино Kakabadze Shilda 0,125ml красное", True),
    ("1553361371-9b22f78e8b1d", "Вино Bagizagan 0.7", True),
    ("1584916201218-f4242ceb4809", "Вино Kakabadze Shilda 0,75 красное сухое", True),
    ("1510812431401-41d2bd2722f3", "Вино Kakabadze Shilda Saperavi 0.75", True),
    ("1578911373434-0cb395d2cbfb", "Вино Laguna ассортимент 0,75", True),
    ("1599487488170-d11ec9c172f0", "Шашлык кусковой баранина", False),
    ("1588566565463-180a5b2090d2", "Куриный суп с домашней лапшой", True),
    ("1603105037880-880cd4edfb0d", "Солянка", True),
    ("1607532941433-304659e8198a", "Салат со шпинатом", True),
    ("1523362628745-0c100150b504", "Вода Истису 0,5", True),
    ("1523362628745-0c100150b504", "Вода Истису 0,25", True),
] + [("1504674900247-0877df9cc836", n, True) for n in ["Бизнес ланч (Понедельник)", "Бизнес ланч (Вторник)", "Бизнес ланч (Среда)", "Бизнес Ланч (четверг)", "Бизнес ланч (Пятница)"]] + [("1612528443702-f6741f70a049", n, True) for n in ["Пиво Bud 0.45", "Пиво Bud безалкогольный 0.45л", "Пиво Paulaner 0% 0.45", "Пиво Paulaner 0.5l", "Пиво Efes", "Hoegaarden", "1664", "Пиво Stella Artois 0.45", "Пиво Peroni", "Пиво Asahi Super Dry 0.33"]]


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
        if placeholder(p, im) or im.width < 360:
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
        names = [(n, ex) for u, n, ex in STOCK if u == uid]
        if not names:
            print("пропуск стока", uid)
            continue
        im = Image.open(p).convert("RGB")
        for name, ex in names:
            if name not in by_name:
                print("нет в меню", name)
                continue
            idd = by_name[name]
            w, h = save(im, f"d-{idd}.webp", 1280, 80)
            save(im, f"d-{idd}-s.webp", 560, 76)
            photos[idd] = {"w": w, "h": h, "src": "unsplash:" + uid, **({"ex": True} if ex else {})}

json.dump(photos, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "photos.json"), "w"), ensure_ascii=False, indent=0, sort_keys=True)
print(len(photos), "фото")
