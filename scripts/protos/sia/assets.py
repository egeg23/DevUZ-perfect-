"""
Картинки макета SIA → public/protos/sia. Все снимки — бюро, с sia88.ru.

python3 -I assets.py <папка src> <папка cov> <папка с логотипами>
  src  — снимки избранных проектов (<адрес>-<номер>.jpg) и команды (team-*.jpg);
  cov  — обложки всех проектов архива (<код с _ вместо точки>.jpg);
  logo — logo_footer.png и cropped-logo_s-270x270.png с сайта бюро.

Для каждой обложки избранного проекта собирается «чертёж»: линии рендера
тёмным по бумаге, без цвета. На сайте чертёж проявляется в рендер.
"""
import json, os, sys
from PIL import Image, ImageFilter, ImageOps, ImageChops

SRC, COV, LOGO = sys.argv[1:4]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "../../../public/protos/sia")
data = json.load(open(os.path.join(HERE, "data.json")))
PAPER, INK = (236, 231, 222), (58, 50, 42)

def save(im, path, w, q=72):
    im = im.convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "WEBP", quality=q, method=6)

def drawing(im):
    g = im.convert("L")
    e = ImageChops.difference(g.filter(ImageFilter.GaussianBlur(0.6)), g.filter(ImageFilter.GaussianBlur(2)))
    e = e.point(lambda v: 255 if v > 16 else int(v * 255 / 16 * 0.55))
    return Image.composite(Image.new("RGB", g.size, PAPER), Image.new("RGB", g.size, INK), ImageOps.invert(e))

def src(name):
    for ext in (".jpg", ".jpeg", ".png"):
        if os.path.exists(os.path.join(SRC, name + ext)):
            return Image.open(os.path.join(SRC, name + ext))
    raise SystemExit("нет снимка " + name)

for f in data["featured"]:
    for i in range(len(f["imgs"])):
        im = src(f"{f['slug']}-{i}")
        save(im, f"{OUT}/p/{f['slug']}-{i}.webp", 1500)
        save(im, f"{OUT}/p/{f['slug']}-{i}-m.webp", 800, 70)
        if i == 0:
            d = drawing(im)
            save(d, f"{OUT}/d/{f['slug']}.webp", 1500, 70)
            save(d, f"{OUT}/d/{f['slug']}-m.webp", 800, 70)

for p in data["index"]:
    name = p["code"].replace(".", "_")
    hit = [x for x in os.listdir(COV) if x.rsplit(".", 1)[0] == name]
    if hit:
        save(Image.open(os.path.join(COV, hit[0])), f"{OUT}/t/{p['slug']}.webp", 560, 68)

for x in os.listdir(SRC):
    if x.startswith("team-"):
        save(Image.open(os.path.join(SRC, x)), f"{OUT}/team/{x[5:].split('-')[0]}.webp", 480, 72)

logo = Image.open(os.path.join(LOGO, "logo_footer.png")).convert("RGBA")
logo.save(f"{OUT}/logo-w.png")
r, g, b, a = logo.split()
Image.merge("RGBA", (*[Image.new("L", logo.size, 26)] * 3, a)).save(f"{OUT}/logo-k.png")
icon = Image.open(os.path.join(LOGO, "cropped-logo_s-270x270.png")).convert("RGBA")
icon.resize((192, 192), Image.LANCZOS).save(f"{OUT}/icon-192.png")
icon.resize((180, 180), Image.LANCZOS).save(f"{OUT}/apple-180.png")
total = sum(os.path.getsize(os.path.join(d, x)) for d, _, fs in os.walk(OUT) for x in fs)
print("готово,", round(total / 1e6, 1), "МБ")
