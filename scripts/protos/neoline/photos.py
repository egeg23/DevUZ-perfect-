"""Фото товаров с их сайта → WebP с прозрачностью для макета.

Запуск: python3 -I photos.py <папка с ru.json> <папка со скачанными png>
Скачанные файлы названы <id товара>_<номер кадра>.<расш>, кадр, который
повторяется у двух товаров, скачан один раз — у первого (как imgs.tsv).

Берём только вырезанные снимки (прозрачные углы): обложки-баннеры с текстом
и фото в машине не идут. Главный кадр — 1600 и 800 px, ещё до четырёх
ракурсов — 1200 px; у стенда (STAND) — все ракурсы. Обрезка по
непрозрачному, поле 4%. Итог — public/protos/neoline/p/ и photos.json.
"""
import json
import sys
from pathlib import Path

from PIL import Image

RAW, IMG = Path(sys.argv[1]), Path(sys.argv[2])
HERE = Path(__file__).parent
OUT = HERE / "../../../public/protos/neoline/p"
OUT.mkdir(parents=True, exist_ok=True)
cat = json.load(open(HERE / "catalog.json"))
ru = json.load(open(RAW / "ru.json"))

seen, file_of = {}, {}
for p in ru:
    for k, i in enumerate(p["images"]):
        s = i["src"]
        if s not in seen:
            seen[s] = f"{p['id']}_{k:02d}"
        file_of[(p["id"], k)] = seen[s]

STAND = {1000458: [2, 4, 5, 6, 9, 10, 11, 12, 13, 14, 3]}


def cutout(path):
    im = Image.open(path)
    if im.mode != "RGBA":
        return None
    a = im.getchannel("A")
    w, h = im.size
    corners = [a.getpixel((x, y)) for x, y in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]]
    if max(corners) > 8:
        return None
    box = a.point(lambda v: 255 if v > 10 else 0).getbbox()
    if not box:
        return None
    x0, y0, x1, y1 = box
    pad = int(max(x1 - x0, y1 - y0) * 0.04)
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))


def save(im, name, width):
    im = im.copy()
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT / f"{name}-{width}.webp", "WEBP", quality=86, method=6)
    return [im.width, im.height]


info = {}  # при перечисленных id — дописывается к прежнему photos.json
ONLY = {int(x) for x in sys.argv[3:]}
if ONLY:
    info = json.load(open(HERE / "photos.json"))
for p in cat:
    if ONLY and p["id"] not in ONLY:
        continue
    pid, n = p["id"], p["imgs"]
    order = STAND.get(pid) or [p["main"]] + [k for k in range(1, n) if k != p["main"]]
    shots = []
    for k in order:
        f = file_of.get((pid, k))
        hit = next(iter(IMG.glob(f + ".*")), None) if f else None
        im = cutout(hit) if hit else None
        if im is None:
            continue
        name = f"{pid}-{len(shots)}"
        if not shots:
            size = save(im, name, 1600)
            save(im, name, 800)
        else:
            size = save(im, name, 1200 if pid not in STAND else 1600)
        shots.append({"n": name, "w": size[0], "h": size[1]})
        if pid not in STAND and len(shots) >= 5:
            break
    info[str(pid)] = shots
    print(pid, len(shots))

json.dump(info, open(HERE / "photos.json", "w"), indent=1)
