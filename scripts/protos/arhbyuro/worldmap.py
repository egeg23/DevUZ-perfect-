"""Карта мира точками для блока «География» и страницы проекта.

Суша — Natural Earth 1:110m (общественное достояние,
https://www.naturalearthdata.com/about/terms-of-use/). Точки — сетка через
2 градуса, долгота −180…180, широта 80…−58, в единицах viewBox 0 0 360 138.

    python3 worldmap.py ne_110m_land.geojson > worldmap.json
"""

import json
import sys

STEP = 2.0
TOP, BOTTOM = 80.0, -58.0


def inside(x, y, ring):
    hit = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            hit = not hit
        j = i
    return hit


def main():
    geo = json.load(open(sys.argv[1]))
    polys = []
    for f in geo["features"]:
        g = f["geometry"]
        for poly in ([g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]):
            polys.append(poly)
    dots = []
    lat = TOP - STEP / 2
    while lat > BOTTOM:
        lon = -180 + STEP / 2
        while lon < 180:
            for poly in polys:
                if inside(lon, lat, poly[0]) and not any(inside(lon, lat, h) for h in poly[1:]):
                    dots.append((round(lon + 180, 1), round(TOP - lat, 1)))
                    break
            lon += STEP
        lat -= STEP
    path = "".join(f"M{x:g} {y:g}h0" for x, y in dots)
    json.dump({"viewBox": f"0 0 360 {TOP - BOTTOM:g}", "d": path, "dots": len(dots)}, sys.stdout)


if __name__ == "__main__":
    main()
