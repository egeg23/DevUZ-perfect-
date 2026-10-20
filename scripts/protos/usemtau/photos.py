"""Фото и знак Юсем Тау с usemtau.kz в WebP для макета.

python3 -I photos.py <папка с выгрузкой>   (выгрузка — curl с usemtau.kz/wp-content/uploads,
имена файлов как в SOURCES.md; в репозиторий кладём только готовое в public/protos/usemtau).
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parents[3] / "public/protos/usemtau"
OUT.mkdir(parents=True, exist_ok=True)

# Знак (гора «А») и надпись «ЮСЕМ ТАУ»: их логотип, без изменений.
mark = Image.open(SRC / "2023_07_cropped-icon.png").convert("RGBA")
mark.resize((128, 128), Image.LANCZOS).save(OUT / "mark.webp", "WEBP", quality=90, method=6)
mark.resize((192, 192), Image.LANCZOS).save(OUT / "icon-192.png")
bg = Image.new("RGBA", (180, 180), (255, 255, 255, 255))
bg.alpha_composite(mark.resize((150, 150), Image.LANCZOS), (15, 15))
bg.convert("RGB").save(OUT / "apple-180.png")
word = Image.open(SRC / "2020_04_1-1-600x567.png").convert("RGBA")
word.crop(word.getbbox()).resize((300, 284), Image.LANCZOS).save(OUT / "word.webp", "WEBP", quality=90, method=6)

# Фото услуг: ширина как есть (до 1088), WebP, имена по смыслу.
PHOTOS = {
    "2023_07_stroitelstvo-angarov.jpg": "angar",
    "2023_07_stroitelstvo-skladov.jpg": "sklad",
    "2023_07_stroitelstvo-promyshlennyh-zdanij.jpg": "prom",
    "2023_07_stroitelstvo-sportivnyh-sooruzhenij.jpg": "sport",
    "2023_07_proizvodstvo-gofrobalok.jpg": "gofro",
    "2023_07_montazh-sendvich-panelej.jpg": "sendvich",
    "2020_03_fgbgbfgbf.jpg": "karkas",
}
for src, name in PHOTOS.items():
    im = Image.open(SRC / src).convert("RGB")
    if im.width > 960:
        im = im.resize((960, round(im.height * 960 / im.width)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", "WEBP", quality=74, method=6)
    print(name, im.size)
