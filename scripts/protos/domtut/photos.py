# Рендеры ЖК и фон первого экрана с domtut.uz → public/protos/domtut (WebP,
# не увеличиваем). python3 -I photos.py <каталог с исходниками>.
# Исходники скачаны 14.10.2026: https://domtut.uz/resources/uploads/property/<жк>/main_N.webp
# и https://domtut.uz/resources/uploads/banners/main/bg-3.webp (SOURCES.md).
# Полный размер — до 1080 px (экран ПК и просмотр), малый — 640 px (карточки
# и экран телефона: 320 css px при плотности 2).
import sys, os
from PIL import Image
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/domtut")
os.makedirs(OUT, exist_ok=True)
ZK = {"mavera-squere": 4, "mezon-residence": 4, "mirador": 4, "center-one": 4, "ibn-sino": 4, "afsona-residense": 4,
      "choshtepa-garden": 4, "sky-avenue": 4, "d-casa": 4, "venetsiya": 4, "tashwelll": 4}
JOBS = {"bg-3.webp": ("hero", [1718, 860])}
for z, n in ZK.items():
    for i in range(n):
        JOBS[f"{z}-{i}.webp"] = (f"{z}-{i}", [1080, 640])
JOBS["mirabad-riverside-2.webp"] = ("mirabad-riverside-0", [1080, 640])
for src, (name, widths) in JOBS.items():
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    for k, w in enumerate(widths):
        w = min(w, im.width)
        out = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        fn = f"{name}{'' if k == 0 else '-s'}.webp"
        out.save(os.path.join(OUT, fn), "WEBP", quality=80, method=6)
        print(fn, out.size)
