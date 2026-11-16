# Кадры врачей лицом и спиной заново: чистый край и тон формы со спины — как лицом.
#   python3 -I stills.py <папка рендеров> <папка сайта>
# Рамка и размеры — те же, что в make.py (FIGS в catalog.mjs не меняются).
import json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tone import cloth, retone, defringe, solo

SRC, OUT = sys.argv[1], sys.argv[2]
H = 1200


def body_box(im):
    return im.split()[3].point(lambda v: 255 if v > 140 else 0).getbbox()


def clean(im):
    r, g, b, a = im.split()
    return Image.merge("RGBA", (r, g, b, a.point(lambda v: 0 if v < 24 else v)))


res = {}
for i in ["doszhanov", "kuznetsova", "namazov", "kadiev"]:
    f = clean(Image.open(f"{SRC}/c-{i}.png").convert("RGBA"))
    bx = body_box(f)
    ref = cloth(np.asarray(f, dtype=np.float32))
    f = defringe(solo(f), 6, 2).crop((bx[0] - 8, bx[1] - 8, bx[2] + 8, bx[3] + 4))
    w = round(f.width * H / f.height)
    f.resize((w, H), Image.LANCZOS).save(f"{OUT}/tm-{i}.webp", "WEBP", quality=84, method=6)
    b = clean(Image.open(f"{SRC}/k-{i}.png").convert("RGBA"))
    bb = body_box(b)
    b = retone(defringe(solo(b), 3, 1), ref).crop((bb[0] - 8, bb[1] - 8, bb[2] + 8, bb[3] + 4))
    bw = round(b.width * H / b.height)
    b.resize((bw, H), Image.LANCZOS).save(f"{OUT}/tm-{i}-b.webp", "WEBP", quality=80, method=6)
    res[i] = {"w": w, "bw": bw, "ref": [round(float(x), 1) for x in ref]}
print(json.dumps(res))
