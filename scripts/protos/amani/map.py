"""Карта Узбекистана для блока «Доставка»: контур страны и областные центры.

Граница — Natural Earth 1:50m admin 0 (общественное достояние,
https://www.naturalearthdata.com/about/terms-of-use/). Проекция —
равнопромежуточная с поправкой на широту 41°, viewBox 0 0 600 H.

    python3 -I map.py ne_50m_admin_0_countries.geojson > map.json
"""
import json, math, sys

CITIES = [
    ("Ташкент", "Toshkent", 41.311, 69.279, 1), ("Самарканд", "Samarqand", 39.654, 66.959, 0),
    ("Бухара", "Buxoro", 39.775, 64.428, 0), ("Наманган", "Namangan", 40.998, 71.672, 0),
    ("Андижан", "Andijon", 40.783, 72.344, 0), ("Фергана", "Farg‘ona", 40.389, 71.784, 0),
    ("Нукус", "Nukus", 42.460, 59.603, 0), ("Ургенч", "Urganch", 41.550, 60.631, 0),
    ("Карши", "Qarshi", 38.861, 65.789, 0), ("Термез", "Termiz", 37.224, 67.278, 0),
    ("Джизак", "Jizzax", 40.116, 67.842, 0), ("Гулистан", "Guliston", 40.490, 68.785, 0),
    ("Навои", "Navoiy", 40.103, 65.379, 0),
]
K = math.cos(math.radians(41))

def main():
    g = json.load(open(sys.argv[1]))
    f = [x for x in g["features"] if x["properties"].get("ADM0_A3") == "UZB"][0]
    polys = f["geometry"]["coordinates"]
    pts = [p for poly in polys for ring in poly for p in ring]
    x0 = min(p[0] for p in pts) * K; x1 = max(p[0] for p in pts) * K
    y0 = min(p[1] for p in pts); y1 = max(p[1] for p in pts)
    s = 580 / (x1 - x0)
    H = round((y1 - y0) * s + 20)
    pr = lambda lon, lat: (round((lon * K - x0) * s + 10, 1), round((y1 - lat) * s + 10, 1))
    d = ""
    for poly in polys:
        for ring in poly:
            d += "M" + "L".join("%s %s" % pr(*p) for p in ring[::2] + [ring[0]]) + "Z"
    json.dump({"w": 600, "h": H, "d": d, "cities": [[a, b, *pr(lon, lat), hq] for a, b, lat, lon, hq in CITIES]}, sys.stdout, ensure_ascii=False)

main()
