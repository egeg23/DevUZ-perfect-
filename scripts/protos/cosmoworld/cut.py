"""Товары брендов без фона — для стеклянных папок (из них товары выпадают).

python -I cut.py <папка со снимками брендов>

Снимки — те же, что у pics.py (их блок «Каталог» на cosmoworld.uz). Фон
снимает rembg (isnet-general-use) на этой машине, без платных сервисов:
ставится в отдельное окружение (`python -m venv rb && rb/bin/pip install
"rembg[cpu]"`), в зависимости проекта не входит. Полупрозрачный след
светового завитка под товарами срезается порогом прозрачности. Где rembg
оставлял след или съедал товар (Арнест, Весна, Dr. Rashel, Forest
Clean, Parachute), фон снят Higgsfield (image_background_remover, 1 кредит
за снимок): готовые вырезки лежат в <папка>/hf/<бренд>.png и берутся вместо
rembg.

Пишет public/protos/cosmoworld/cut/<бренд>.webp (по рамке товаров, 900 px по
ширине) и cut.json: ширина, высота и два места разреза между товарами, по
которым папка делит снимок на три части, падающие по отдельности.
"""
import json, os, sys
from PIL import Image
from rembg import new_session, remove

SRC = {
    "arnest": "01_1-min.png", "vesna": "04_2_1-min.png", "rashel": "07_3-min.png", "peros": "09_5-min.png",
    "forest": "11_6-min.png", "bily": "14_6_1-min.png", "parachute": "15_-min.png", "brandfree": "17_brandfree-min.jpg",
    "mixit": "18_Frame-min.jpg", "nefis": "20_Nefis-min.jpg",
}
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "../../../public/protos/cosmoworld/cut")
os.makedirs(OUT, exist_ok=True)
W = 900
session = new_session("isnet-general-use")


def cuts(a):
    """Два разреза около 1/3 и 2/3 ширины там, где товаров меньше всего."""
    w, h = a.size
    px = a.load()
    col = [sum(1 for y in range(0, h, 2) if px[x, y] > 0) for x in range(w)]
    out = []
    for c in (w / 3, 2 * w / 3):
        lo, hi = int(c - w * 0.12), int(c + w * 0.12)
        out.append(min(range(lo, hi), key=lambda x: (col[x], abs(x - c))))
    return [round(x / w, 4) for x in out]


meta = {}
for k, f in SRC.items():
    ready = os.path.join(sys.argv[1], "hf", f"{k}.png")
    if os.path.exists(ready):
        out = Image.open(ready).convert("RGBA")
        a = out.getchannel("A").point(lambda v: 0 if v < 60 else v)
    else:
        out = remove(Image.open(os.path.join(sys.argv[1], f)).convert("RGB"), session=session)
        a = out.getchannel("A").point(lambda v: 0 if v < 150 else min(255, (v - 150) * 3))
    out.putalpha(a)
    box = a.getbbox()
    out = out.crop(box)
    out = out.resize((W, round(out.height * W / out.width)), Image.LANCZOS)
    out.save(os.path.join(OUT, f"{k}.webp"), "WEBP", quality=82, method=6)
    meta[k] = {"w": out.width, "h": out.height, "cut": cuts(out.getchannel("A"))}
    print(k, meta[k], file=sys.stderr)
json.dump(meta, open(os.path.join(HERE, "cut.json"), "w"))
