#!/usr/bin/env python3
"""
Картинки DevUz Box для сайта: public/box/.

Исходники — рендеры владельца (docs/refs/box) и кадры «в разобранном виде»
из презентаций (сессия 01.11.2026); они не в репозитории, путь к папке с
ними — первым аргументом. Запуск:

    python3 -I scripts/box/assets.py <папка с кадрами> <trio-4k.png> [<папка с os-*.png>]

Что делает:
  * режет кадр разреза «Про», «Лайт» и «Джарвис» на горизонтальные слои —
    из них на главной коробка собирается по прокрутке (components/box/scene.tsx);
    границы слоёв подобраны по сетке руками, перекрытия между соседями
    остаются в нижнем слое;
  * собранные коробки, трио для первого экрана промо и обложка Open Graph;
  * экраны DevUz OS (`os-desktop.png`, `os-studio.png`, `os-inbox.png`,
    `os-code.png`): концепт интерфейса, сгенерирован 02.11.2026 (Higgsfield,
    gpt-image, по 0,25 кредита) по описанию из content/box-copy.ts → `os-*.webp`.

WebP с потерями, качество 80; на телефон — вдвое уже. Все размеры и имена
файлов — в LAYERS/ASSETS: компонент берёт те же имена из content/box.ts.
"""
import sys
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1])
trio4k = Path(sys.argv[2])
out = Path(__file__).resolve().parents[2] / "public" / "box"
out.mkdir(parents=True, exist_ok=True)

FRAMES = {
    "pro": src / "fb6165bedfa0699dc1f565e45f9c7207.jpg",
    "lite": src / "a7a32387326188ea103d3654175a1650.jpg",
    "jarvis": src / "c6f9125abdf583d2e9b77be5f9102ed4.jpg",
}
ASSEMBLED = {
    "pro": (src / "ca310cc329d2e986b4dbff4b00191255.jpg", (300, 120, 1620, 1000)),
    "lite": (src / "cffa5fb6514b8b1e002ec331ea3a70e7.jpg", (300, 120, 1620, 1000)),
    "jarvis": (src / "517bcafa3d16f6a2abcdba69e4a465a3.jpg", (420, 40, 1500, 1080)),
}
# Слои сверху вниз: (y0, y1) в кадре 1920×1086; x — общий для модели.
LAYERS = {
    "pro": {"x": (440, 1420), "rows": [(20, 195), (195, 340), (340, 490), (490, 598), (598, 740), (740, 850), (850, 1060)]},
    "lite": {"x": (520, 1360), "rows": [(40, 225), (225, 340), (340, 530), (530, 640), (640, 815), (815, 1020)]},
    "jarvis": {"x": (520, 1500), "rows": [(20, 100), (100, 270), (270, 350), (350, 500), (500, 670), (670, 840), (840, 1070)]},
}


def webp(im: Image.Image, name: str, width: int, quality: int = 80) -> None:
    w, h = im.size
    if width < w:
        im = im.resize((width, round(h * width / w)), Image.LANCZOS)
    im.save(out / f"{name}.webp", "WEBP", quality=quality, method=6)
    print(name, im.size, (out / f"{name}.webp").stat().st_size // 1024, "KB")


for model, spec in LAYERS.items():
    frame = Image.open(FRAMES[model]).convert("RGB")
    x0, x1 = spec["x"]
    for i, (y0, y1) in enumerate(spec["rows"], start=1):
        strip = frame.crop((x0, y0, x1, y1))
        webp(strip, f"{model}-l{i}", 980)
        webp(strip, f"{model}-l{i}-s", 520)
    top, bottom = spec["rows"][0][0], spec["rows"][-1][1]
    print(model, "stage", x1 - x0, bottom - top)

for model, (path, box) in ASSEMBLED.items():
    im = Image.open(path).convert("RGB").crop(box)
    webp(im, model, 1320)
    webp(im, f"{model}-s", 660)

trio = Image.open(trio4k).convert("RGB")
webp(trio, "trio", 2400, 82)
webp(trio, "trio-s", 1080)
# Open Graph 1200×630: середина кадра, коробки целиком.
w, h = trio.size
target = 1200 / 630
ch = round(w / target)
og = trio.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch)).resize((1200, 630), Image.LANCZOS)
og.save(out / "og.jpg", "JPEG", quality=86, optimize=True, progressive=True)
print("og.jpg", (out / "og.jpg").stat().st_size // 1024, "KB")

# Экраны системы: концепт интерфейса, если папка с ними передана.
if len(sys.argv) > 3:
    screens = Path(sys.argv[3])
    for key in ("desktop", "studio", "inbox", "code"):
        src_png = screens / f"os-{key}.png"
        if not src_png.exists():
            print("нет", src_png)
            continue
        im = Image.open(src_png).convert("RGB")
        webp(im, f"os-{key}", 1600, 82)
        webp(im, f"os-{key}-s", 800)
