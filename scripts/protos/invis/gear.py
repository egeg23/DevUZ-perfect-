# Настоящее железо для сцены «Сетап» → public/protos/invis/gear-*.webp и gear.json.
# Снимки Unsplash (лицензия Unsplash: можно менять и использовать бесплатно,
# в том числе в коммерческих целях), список — SOURCES.md. Что делаем:
#  - видеокарта: вырезаем из светлого фона, закрашиваем чужие логотипы на
#    ступицах и боковине, поворачиваем горизонтально, каждый вентилятор —
#    отдельный круглый слой (чёткий и смазанный вращением), чтобы он крутился;
#  - мышь: закрашиваем светящийся логотип производителя;
#  - клавиатура, наушники, стол с монитором: кадрируем.
# python3 -I gear.py <пустой каталог для исходников>
import sys, os, json, math, random, urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageChops
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/invis")
os.makedirs(OUT, exist_ok=True)
IDS = {
    "gpu": "1621164071312-67bb68821b3f",    # видеокарта анфас, три вентилятора, светлый фон
    "kb": "1634554423386-494bc98e26a8",     # клавиатура с радужной подсветкой
    "mouse": "1616296425622-4560a2ad83de",  # игровая мышь с RGB-полосой на чёрном
    "hs": "1600186279172-fdbaefd74383",     # наушники с микрофоном на тёмной ткани
    "desk": "1603481546238-487240415921",   # стол: монитор и ПК в красно-синем свете
}
def get(name):
    p = os.path.join(SRC, name + ".jpg")
    if not os.path.exists(p):
        urllib.request.urlretrieve(f"https://images.unsplash.com/photo-{IDS[name]}?w=2400&q=90&fm=jpg", p)
    return Image.open(p).convert("RGB")
def save(im, name, w, q=82):
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, f"gear-{name}.webp"), "WEBP", quality=q, method=6)
    return im.size
rnd = random.Random(7)
meta = {}

# ── Видеокарта ──
g = get("gpu")                       # 2400 × 3199, вертикально
W, H = g.size
FANS = [(1247, 825), (1233, 1582), (1223, 2403)]
HUB, FAN = 128, 362
d = ImageDraw.Draw(g)
# Ступицы: вместо чужого знака — шлифованный металл, как у самой ступицы.
for cx, cy in FANS:
    hub = Image.new("RGB", (2 * HUB, 2 * HUB))
    hp = hub.load()
    for yy in range(2 * HUB):
        for xx in range(2 * HUB):
            dx, dy = xx - HUB + .5, yy - HUB + .5
            r = math.hypot(dx, dy) / HUB
            a = math.atan2(dy, dx)
            v = 150 + 28 * math.cos(2 * a + .6) - 22 * r * r + rnd.uniform(-6, 6)
            if .93 < r: v -= 70
            hp[xx, yy] = (int(v), int(v), int(v + 3))
    hub = hub.filter(ImageFilter.GaussianBlur(1.2))
    hm = Image.new("L", hub.size, 0)
    ImageDraw.Draw(hm).ellipse((0, 0, 2 * HUB - 1, 2 * HUB - 1), fill=255)
    g.paste(hub, (cx - HUB, cy - HUB), hm.filter(ImageFilter.GaussianBlur(1.5)))
# Надпись на боковине — закрашиваем цветом пластика рядом.
box = (700, 960, 790, 1180)
patch = g.crop((box[0] + 110, box[1], box[2] + 110, box[3]))
g.paste(patch, box[:2])
# Маска: тёмный пластик карты (фон и тень светлее), щели закрываем
# расширением, дыры (светлые ступицы и рёбра радиатора) заливаем: фон —
# только то, что достижимо от краёв кадра.
small = g.resize((W // 2, H // 2))
sw, sh = small.size
dark = small.convert("L").point(lambda v: 255 if v < 78 else 0).filter(ImageFilter.MaxFilter(9))
dp = dark.load()
bg = bytearray(sw * sh)
stack = [(x, 0) for x in range(sw)] + [(x, sh - 1) for x in range(sw)] + [(0, y) for y in range(sh)] + [(sw - 1, y) for y in range(sh)]
while stack:
    x, y = stack.pop()
    i = y * sw + x
    if bg[i] or dp[x, y]: continue
    bg[i] = 1
    if x > 0: stack.append((x - 1, y))
    if x < sw - 1: stack.append((x + 1, y))
    if y > 0: stack.append((x, y - 1))
    if y < sh - 1: stack.append((x, y + 1))
mask = Image.frombytes("L", (sw, sh), bytes(0 if v else 255 for v in bg))
mask = mask.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MinFilter(3)).resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.6))
g.putalpha(mask)
# Горизонтально: верх уходит влево.
g = g.rotate(90, expand=True)
fans = [(cy, W - 1 - cx) for cx, cy in FANS]
bb = g.getchannel("A").point(lambda a: 255 if a > 40 else 0).getbbox()
pad = 24
bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(g.width, bb[2] + pad), min(g.height, bb[3] + pad))
g = g.crop(bb)
fans = [(x - bb[0], y - bb[1]) for x, y in fans]
OUTW = 1600
# Контур карты (в долях кадра 1200 × 576 после поворота): отсекает тень на
# столе и обрывки планки крепления, оставляет разъём PCIe снизу.
POLY = [(18, 150), (60, 72), (290, 40), (700, 38), (1122, 33), (1104, 72), (1138, 150), (1142, 470), (1100, 492), (880, 497), (480, 470), (480, 512), (210, 512), (210, 478), (40, 470), (18, 440)]
pm = Image.new("L", g.size, 0)
ImageDraw.Draw(pm).polygon([(x / 1200 * g.width, y / 576 * g.height) for x, y in POLY], fill=255)
g.putalpha(ImageChops.multiply(g.getchannel("A"), pm.filter(ImageFilter.GaussianBlur(2))))

s = OUTW / g.width
base = g.resize((OUTW, round(g.height * s)), Image.LANCZOS)
base.save(os.path.join(OUT, "gear-gpu.webp"), "WEBP", quality=84, method=6)
meta["gpu"] = {"w": base.width, "h": base.height, "fans": []}
R = round(FAN * s)
for k, (x, y) in enumerate(fans):
    x, y = round(x * s), round(y * s)
    disc = base.crop((x - R, y - R, x + R, y + R)).convert("RGBA")
    m = Image.new("L", disc.size, 0)
    ImageDraw.Draw(m).ellipse((2, 2, 2 * R - 2, 2 * R - 2), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(2))
    sharp = disc.copy(); sharp.putalpha(m)
    sharp.save(os.path.join(OUT, f"gear-fan{k}.webp"), "WEBP", quality=84, method=6)
    # Смазанный вращением: среднее по поворотам на ±14°.
    acc = None; n = 0
    for a in range(-14, 15, 2):
        r = disc.rotate(a, resample=Image.BICUBIC)
        acc = r if acc is None else Image.blend(acc, r, 1 / (n + 1))
        n += 1
    blur = acc.copy(); blur.putalpha(m)
    blur.save(os.path.join(OUT, f"gear-fan{k}b.webp"), "WEBP", quality=80, method=6)
    meta["gpu"]["fans"].append({"x": round(x / base.width * 100, 3), "y": round(y / base.height * 100, 3), "d": round(2 * R / base.width * 100, 3)})
print("gpu", base.size, meta["gpu"])

# ── Мышь: логотип производителя закрашиваем пластиком с той же тенью ──
m = get("mouse")
d = ImageDraw.Draw(m)
# Светящиеся пиксели знака (фиолетовые) и их ореол — в маску, дальше
# заполняем по соседям нормализованной свёрткой: тёмный глянец без пятна.
logo = (560, 730, 840, 980)
reg = m.crop(logo)
rp = reg.load()
mk = Image.new("L", reg.size, 0); mp = mk.load()
for yy in range(reg.height):
    for xx in range(reg.width):
        r, gg, b = rp[xx, yy]
        if max(r, gg, b) > 34 and b > gg + 8: mp[xx, yy] = 255
mk = mk.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(3))
valid = ImageChops.invert(mk)
fill = reg.copy()
for rad in (40, 24, 12):
    num = Image.composite(reg, Image.new("RGB", reg.size), valid).filter(ImageFilter.GaussianBlur(rad))
    den = valid.filter(ImageFilter.GaussianBlur(rad))
    np_, dp = num.load(), den.load(); fp = fill.load(); kp = mk.load()
    for yy in range(reg.height):
        for xx in range(reg.width):
            if kp[xx, yy] > 0 and dp[xx, yy] > 8:
                w = dp[xx, yy] / 255
                fp[xx, yy] = tuple(int(c / w) for c in np_[xx, yy])
noise = Image.effect_noise(reg.size, 6).convert("RGB")
fill = ImageChops.add(fill, noise, 1, -128)
reg = Image.composite(fill, reg, mk)
m.paste(reg, logo[:2])
m = m.crop((240, 420, 2240, 1754))
meta["mouse"] = save(m, "mouse", 1200)
# ── Клавиатура ──
k = get("kb").crop((0, 260, 2400, 1600))
meta["kb"] = save(k, "kb", 1400)
# ── Наушники ──
h = get("hs").crop((360, 0, 2240, 1600))
meta["hs"] = save(h, "hs", 1100)
# ── Стол с монитором ──
dk = get("desk").crop((640, 360, 2400, 1460))
meta["desk"] = save(dk, "desk", 1400)
json.dump(meta, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "gear.json"), "w"), indent=1)
print(meta)
