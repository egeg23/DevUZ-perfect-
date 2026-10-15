# Фото макета Invis → public/protos/invis (WebP 1080 и 640 px, первый экран 1600 и 860).
# Все снимки — Unsplash (лицензия Unsplash: бесплатно, в том числе в
# коммерческих целях, без разрешения автора), список — SOURCES.md. Фото
# самого клуба в сети мельче 1200 px (docs/research/invis.md), их не берём.
# python3 -I photos.py <пустой каталог для исходников>
import sys, os, urllib.request
from PIL import Image
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/invis")
os.makedirs(OUT, exist_ok=True)
PHOTOS = {
    "hero": "1633545495735-25df17fb9f31",   # зал клуба, ряды ПК, фиолетовый свет
    "z-std": "1633545491399-54a16aa6a871",  # длинный ряд мест
    "z-vip": "1633545486613-feaf749f7805",  # зал с креслами
    "z-boot": "1558008258-7ff8888b42b0",    # ряды игроков, турнир
    "z-ps": "1607853202273-797f1c22a38e",   # PS5 с джойстиком
}
for name, pid in PHOTOS.items():
    src = os.path.join(SRC, name + ".jpg")
    if not os.path.exists(src):
        urllib.request.urlretrieve(f"https://images.unsplash.com/photo-{pid}?w={2000 if name == 'hero' else 1400}&q=85&fm=jpg", src)
    im = Image.open(src).convert("RGB")
    if name == "z-ps":  # вертикальный кадр — в 4:3 по центру
        h = round(im.width * 3 / 4); top = (im.height - h) // 2
        im = im.crop((0, top, im.width, top + h))
    widths = [1600, 860] if name == "hero" else [1080, 640]
    for k, w in enumerate(widths):
        w = min(w, im.width)
        out = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        out.save(os.path.join(OUT, f"{name}{'' if k == 0 else '-s'}.webp"), "WEBP", quality=80, method=6)
    print(name, im.size)
