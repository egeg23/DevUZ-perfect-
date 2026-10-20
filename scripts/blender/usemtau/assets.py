"""Ассеты Poly Haven для кадров макета Юсем Тау: свет склада и бетонный пол.
Всё CC0 (https://polyhaven.com/license). Качается из их API, каждый файл
сверяется по md5. Обычный Python без зависимостей:

    python3 scripts/blender/usemtau/assets.py /tmp/ph-usemtau
"""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

API = "https://api.polyhaven.com/files/"
HDRI = ("empty_warehouse_01", "2k")          # пустой склад: отражения в стали
TEXTURES = {"concrete_floor_worn_001": "2k", "rusty_metal_02": "1k"}
MAPS = {"Diffuse": "diff", "Rough": "rough", "nor_gl": "nor_gl"}


def md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def get(url, dest, want):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and md5(dest) == want:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "devuz-usemtau/1"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
    if md5(dest) != want:
        raise SystemExit(f"md5 не сошёлся: {dest}")


def files(asset):
    req = urllib.request.Request(API + asset, headers={"User-Agent": "devuz-usemtau/1"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main(out):
    out = Path(out)
    name, res = HDRI
    f = files(name)["hdri"][res]["hdr"]
    get(f["url"], out / "hdri" / f"{name}.hdr", f["md5"])
    for tex, res in TEXTURES.items():
        d = files(tex)
        for key, short in MAPS.items():
            f = d[key][res]["jpg" if "jpg" in d[key][res] else "png"]
            get(f["url"], out / "tex" / tex / f"{short}.jpg", f["md5"])
    print("ассеты готовы:", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "/tmp/ph-usemtau")
