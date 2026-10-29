"""Карта покрытия Cosmo World: 14 регионов Узбекистана в SVG.

python3 -I map.py <uz.geojson>

Контуры — Natural Earth, admin 1 (ne_10m_admin_1_states_provinces, v5.1.2,
общественное достояние), из файла взяты только строки adm0_a3 = UZB.
Проекция простая: долгота × cos 41°, широта вниз. Пишет map.mjs: путь, центр
и подпись каждого региона, точки Ташкента и Бишкека (филиал cosmo.kg).
"""
import json, math, os, sys

K = 60
LON0, LAT0 = 55.8, 46.0
CX = math.cos(math.radians(41))
CODES = {
    "UZ-QR": 0, "UZ-XO": 1, "UZ-NW": 2, "UZ-BU": 3, "UZ-SA": 4, "UZ-QA": 5, "UZ-SU": 6,
    "UZ-JI": 7, "UZ-SI": 8, "UZ-TO": 9, "UZ-NG": 10, "UZ-AN": 11, "UZ-FA": 12, "UZ-TK": 13,
}


def xy(lon, lat):
    return ((lon - LON0) * CX * K, (LAT0 - lat) * K)


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-9
    far, at = -1, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]
        dd = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L
        if dd > far:
            far, at = dd, i
    if far <= eps:
        return [pts[0], pts[-1]]
    return rdp(pts[: at + 1], eps)[:-1] + rdp(pts[at:], eps)


def ring(r):
    q = [xy(*c) for c in r[:-1]]
    h = len(q) // 2
    p = rdp(q[: h + 1], 0.6)[:-1] + rdp(q[h:] + q[:1], 0.6)[:-1]
    return "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in p) + "Z" if len(p) > 3 else ""


g = json.load(open(sys.argv[1]))
regions = [None] * 14
for f in g["features"]:
    i = CODES[f["properties"]["iso_3166_2"]]
    geo = f["geometry"]
    polys = geo["coordinates"] if geo["type"] == "MultiPolygon" else [geo["coordinates"]]
    d = "".join(ring(poly[0]) for poly in polys)
    pts = [xy(*c) for poly in polys for c in poly[0]]
    big = max(polys, key=lambda p: len(p[0]))
    bp = [xy(*c) for c in big[0]]
    cx = sum(p[0] for p in bp) / len(bp)
    cy = sum(p[1] for p in bp) / len(bp)
    regions[i] = {"d": d, "c": [round(cx, 1), round(cy, 1)]}
xs = [float(v) for r in regions for v in r["d"].replace("M", " ").replace("L", " ").replace("Z", " ").split()[0::2]]
ys = [float(v) for r in regions for v in r["d"].replace("M", " ").replace("L", " ").replace("Z", " ").split()[1::2]]
W = math.ceil(max(xy(75.2, 42.9)[0], max(xs)) + 20)
H = math.ceil(max(ys) + 10)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "map.mjs")
open(out, "w").write(
    "/* Карта покрытия: сгенерировано map.py из Natural Earth (общественное достояние). Порядок — как REGIONS в data.mjs. */\n"
    f"export const MAP = {json.dumps({'w': W, 'h': H, 'regions': regions, 'tashkent': [round(v, 1) for v in xy(69.28, 41.31)], 'bishkek': [round(v, 1) for v in xy(74.6, 42.87)]}, ensure_ascii=False)};\n"
)
print("viewBox", W, H, "байт", os.path.getsize(out), file=sys.stderr)
