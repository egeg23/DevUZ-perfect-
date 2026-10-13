# Снимки с europegas.uz → public/protos/europegas (WebP, не увеличиваем).
# python3 photos.py <каталог с исходниками>  (исходники скачаны с europegas.uz
# 13.10.2026, адреса — в SOURCES.md). Имя: исходник → (файл, ширины).
import sys, os
from PIL import Image
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../public/protos/europegas")
JOBS = {
    "about2.jpg": ("team", [1600, 800]),
    "panels_panels.jpg": ("panels", [1280, 640]),
    "equipment_italia_injector.png": ("rail", [1280, 640]),
    "equipment_poland_controller.jpg": ("ecu", [1200, 600]),
    **{f"certificates_certificate-{i}.jpg": (f"doc{i}", [1200, 400]) for i in (1, 2, 3, 4, 5, 7, 8, 9)},
    "certificates_certificate-6.jpeg": ("doc6", [1200, 400]),
    **{f"panel-gallery_photo_{i}.jpg": (f"van{i}", [960, 480]) for i in range(1, 13)},
    **{f"p{i}.png": (f"cl{i}", [240]) for i in (1, 2, 3, 4, 5, 6, 7, 11)},
}
for src, (name, widths) in JOBS.items():
    im = Image.open(os.path.join(SRC, src))
    im = im.convert("RGBA" if im.mode in ("RGBA", "P", "LA") else "RGB")
    for k, w in enumerate(widths):
        w = min(w, im.width)
        out = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        fn = f"{name}{'' if k == 0 else '-s'}.webp"
        out.save(os.path.join(OUT, fn), "WEBP", quality=82, method=6)
        print(fn, out.size)
