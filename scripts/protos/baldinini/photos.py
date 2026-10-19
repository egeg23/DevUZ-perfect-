# Фото Baldinini в WebP для макета: официальные снимки бренда с
# baldinini-shop.com (товары 2000×2000 на белом, кампания FW26/27, Heritage).
# Источник каждого файла — SOURCES.md. Сырые файлы в репозиторий не кладём.
#
#   python3 -I scripts/protos/baldinini/photos.py <папка с raw/img и raw/hero>
import sys, os, glob
from PIL import Image

RAW = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/baldinini")
os.makedirs(OUT, exist_ok=True)

for f in sorted(glob.glob(os.path.join(RAW, "raw/img/bal-*.jpg"))):
    base = os.path.basename(f)[4:-4]          # d7b704-0000-1
    pid, n = base.rsplit("-", 1)
    im = Image.open(f).convert("RGB")
    for w, q in ((600, 76), (1000, 74)):
        x = im.resize((w, w), Image.LANCZOS)
        x.save(os.path.join(OUT, f"p-{pid}-{int(n) - 1}-{w}.webp"), "WEBP", quality=q, method=6)

HERO = {  # файл → (имя, ширина)
    "hp-fw2627-banner-2.jpg": ("hero-lift", 1600),
    "hp-fw2627-banner-3.jpg": ("hero-man", 1600),
    "hp-fw2627-banner-4-mobile.jpg": ("hero-tall", 900),
    "heritage-craft-1.jpg": ("craft-lasts", 900),
    "heritage-craft-2.jpg": ("craft-sole", 900),
    "heritage-hero.jpg": ("roots", 1600),
}
for src, (name, w) in HERO.items():
    im = Image.open(os.path.join(RAW, "raw/hero", src)).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=72, method=6)
    print(name, im.size)
