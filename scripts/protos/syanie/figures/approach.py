# Первый и последний кадр ролика «врач идёт к камере издалека»: тот же рендер врача на сером
# фоне, далеко (мелко, ноги выше) и близко (как в рендере). Камера стоит, врач растёт в кадре,
# поэтому модели приходится делать настоящие шаги (при камере, едущей назад, ноги «плыли»).
#   python3 -I approach.py <ключ> <папка рендеров> <папка выхода> [back]
# С «back» — те же два кадра со спины (врач уходит от камеры: первый кадр близко, последний далеко).
# Печатает, где стоит фигура в обоих кадрах (масштаб и сдвиг в точках рендера): числа первого
# кадра ролика нужны sprite.py (подход — «far», уход — «near»).
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tone import solo, defringe

key, SRC, OUT = sys.argv[1:4]
BACK = len(sys.argv) > 4 and sys.argv[4] == "back"
W, H = 3072, 5504
FAR, NEAR = (0.47, 0.70), (0.90, 0.975)   # рост фигуры в долях кадра и где стоят ноги


def body_box(im):
    return im.split()[3].point(lambda v: 255 if v > 140 else 0).getbbox()


a = np.asarray(Image.open(f"{SRC}/f-{key}.png").convert("RGB"), dtype=np.float32)
top, bot = a[40:200, 40:400].reshape(-1, 3).mean(0), a[-260:-60, 40:400].reshape(-1, 3).mean(0)
g = np.linspace(0, 1, H)[:, None, None]
bg = Image.fromarray(np.broadcast_to(top[None, None, :] * (1 - g) + bot[None, None, :] * g, (H, W, 3)).astype(np.uint8))
cut = Image.open(f"{SRC}/{'k' if BACK else 'c'}-{key}.png").convert("RGBA")
if cut.size != (W, H):
    cut = cut.resize((W, round(cut.height * W / cut.width)), Image.LANCZOS)   # рендер спиной вдвое мельче
cut = defringe(solo(cut), 6, 2)
bx = body_box(cut)
res = {}
for name, (frac, feet) in (("far", FAR), ("near", NEAR)):
    s = frac * H / (bx[3] - bx[1])
    fig = cut.resize((round(cut.width * s), round(cut.height * s)), Image.LANCZOS)
    ox, oy = round(W / 2 - (bx[0] + bx[2]) / 2 * s), round(feet * H - bx[3] * s)
    fw = (bx[2] - bx[0]) * s
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).ellipse((W / 2 - fw * .6, feet * H - fw * .13, W / 2 + fw * .6, feet * H + fw * .03), fill=80)
    out = Image.composite(Image.new("RGB", (W, H), (60, 62, 66)), bg, sh.filter(ImageFilter.GaussianBlur(fw * .06)))
    out.paste(fig, (ox, oy), fig)
    out.resize((1536, 2752), Image.LANCZOS).save(f"{OUT}/a-{key}-{'b' if BACK else ''}{name}.jpg", quality=93)
    res[name] = {"s": round(s, 5), "ox": ox, "oy": oy}
print(json.dumps(res))
