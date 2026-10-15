"""Ассеты Poly Haven для пролёта по вилле SIA APx180.2606: небо, материалы,
мебель, деревья. Всё CC0 (https://polyhaven.com/license). Качается из их API,
каждый файл сверяется по md5. Обычный Python без зависимостей:

    python3 scripts/blender/sia/assets.py /tmp/ph-sia

В Actions папка кэшируется по хешу этого файла (blender-sia.yml).
"""
import hashlib
import json
import sys
import time
import urllib.request
from pathlib import Path

API = "https://api.polyhaven.com/files/"

# Небо: переменная облачность, солнце на 38°, тёплый дневной свет.
HDRI = ("kloppenheim_06_puresky", "4k")

# Материалы, 2k: id → карты. Для каждого — цвет, шероховатость, нормаль.
TEXTURES = {
    "beige_wall_002": "2k",          # пористый травертин: плиты, ламели, стены
    "stone_tile_wall": "2k",         # травертин плитами: терраса, борт бассейна
    "white_oak_veneer": "2k",        # светлый дуб: пол, подшивка плит
    "white_plaster_02": "2k",        # штукатурка: потолки
    "marble_01": "2k",               # камень: остров кухни, столы
    "leafy_grass": "2k",             # трава на склоне
    "rough_linen": "1k",             # лён: диваны и шезлонги
    "poly_wool_herringbone": "1k",   # шерсть: ковёр
    "long_white_tiles": "2k",        # плитка чаши бассейна
    "gravel_floor": "2k",            # гравий: кровля, дорожки
}
MAPS = {"Diffuse": "diff", "Rough": "rough", "nor_gl": "nor_gl"}

# Модели (glTF): мебель и растения.
MODELS = {
    "sofa_03": "1k",
    "modern_arm_chair_01": "1k",
    "modern_coffee_table_01": "1k",
    "coffee_table_round_01": "1k",
    "dining_table": "1k",
    "dining_chair_02": "1k",
    "modern_ceiling_lamp_01": "1k",
    "ceramic_vase_01": "1k",
    "ceramic_vase_03": "1k",
    "brass_vase_01": "1k",
    "potted_plant_01": "1k",
    "potted_plant_04": "1k",
    "island_tree_01": "1k",
    "island_tree_03": "1k",
    "shrub_01": "1k",
    "shrub_02": "1k",
    "shrub_04": "1k",
    "grass_medium_01": "1k",
}


def md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def get(url, dest, want_md5):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and md5(dest) == want_md5:
        return
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "devuz-sia/1"})
            with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
                while chunk := r.read(1 << 20):
                    f.write(chunk)
            if md5(dest) == want_md5:
                return
            print(f"md5 не сошёлся: {dest.name}, ещё раз")
        except OSError as e:
            print(f"{dest.name}: {e}, ещё раз")
        time.sleep(2 ** attempt)
    raise SystemExit(f"не скачался {url}")


def files(asset):
    with urllib.request.urlopen(urllib.request.Request(API + asset, headers={"User-Agent": "devuz-sia/1"}), timeout=60) as r:
        return json.load(r)


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/ph")
    name, res = HDRI
    f = files(name)["hdri"][res]["hdr"]
    get(f["url"], out / "hdri" / f"{name}.hdr", f["md5"])
    for tex, res in TEXTURES.items():
        f = files(tex)
        for key, short in MAPS.items():
            item = f[key][res]["jpg"]
            get(item["url"], out / "tex" / tex / f"{short}.jpg", item["md5"])
    for model, res in MODELS.items():
        g = files(model)["gltf"][res]["gltf"]
        base = out / "models" / model
        get(g["url"], base / f"{model}.gltf", g["md5"])
        for rel, item in g["include"].items():
            get(item["url"], base / rel, item["md5"])
    print(f"ассеты в {out}")


if __name__ == "__main__":
    main()
