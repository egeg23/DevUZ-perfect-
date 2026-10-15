"""Пролёт для макета SIA: вилла APx180.2606 — с долины, над бассейном, внутрь.

Модель собрана кодом по пяти рендерам бюро (sia88.ru, APx180.2606): три
уровня плит со скруглёнными краями уходят уступами назад, у каждой плиты
тёплая подсветка снизу, фасад — стекло от пола до потолка за травертиновыми
ламелями, на террасах стеклянные ограждения и зелень, внизу терраса с
бассейном-инфинити и каскадом ступеней на склоне. Это наша интерпретация
по рендерам, не рабочая модель бюро.

Материалы, небо, мебель и деревья — Poly Haven (CC0, assets.py). Задник с
горами — backdrop.jpg, сгенерирован для макета (gpt-image-2.5 через ProxyAPI).
Общие функции (материалы, брусья, модели) — из сцены архбюро.

    python3 scripts/blender/sia/assets.py /tmp/ph-sia
    blender -b --factory-startup -P scripts/blender/sia/scene.py -- \\
        --assets /tmp/ph-sia --out /tmp/frames/f_ --start 1 --end 180

Кадры пролёта (180, листаются прокруткой):
  1–45     над оливковой рощей: вилла на склоне, горы за ней
  45–90    спуск к террасе, над краем бассейна
  90–142   низко над водой к открытой створке гостиной
  142–180  внутри: гостиная, разворот над диваном к окну на долину
"""

import argparse
import math
import random
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "arhbyuro"))
import scene as base  # noqa: E402  материалы, брусья, модели

rnd = random.Random(20261016)
FLIGHT = 180
M = base.M
box, rounded, place, link, pbr, plain, glass, hexc, new_mat = base.box, base.rounded, base.place, base.link, base.pbr, base.plain, base.glass, base.hexc, base.new_mat


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--assets", required=True)
    ap.add_argument("--out", default="")
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--end", type=int, default=0)
    ap.add_argument("--step", type=int, default=1)
    ap.add_argument("--frames", default="")
    ap.add_argument("--samples", type=int, default=96)
    ap.add_argument("--percent", type=int, default=100)
    ap.add_argument("--vertical", action="store_true")
    ap.add_argument("--save", default="")
    return ap.parse_args(argv)


# ───────────────────────── материалы ─────────────────────────

def water():
    m = base.water()
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = hexc("#9ADCD6")
    return m


def slope_mat():
    """Сухая трава склона, вдали уходит в дымку цвета задника."""
    m = pbr("Slope", "leafy_grass", size=4.0, tint="#C2AE72", sat=0.6, val=0.95, rough=(0.65, 1.0), bump=0.7, macro=0.35)
    nt = m.node_tree
    L = nt.links.new
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    cam = nt.nodes.new("ShaderNodeCameraData")
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 160
    mr.inputs["From Max"].default_value = 900
    mr.interpolation_type = "SMOOTHSTEP"
    L(cam.outputs["View Distance"], mr.inputs["Value"])
    # Роща: дальше ~60 м от дома склон — кроны олив сверху (ячейки Вороного,
    # тёмные просветы между ними), как холмы на заднике.
    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 0.3
    vor.inputs["Randomness"].default_value = 0.9
    L(tc.outputs["Object"], vor.inputs["Vector"])
    crown = nt.nodes.new("ShaderNodeValToRGB")
    crown.color_ramp.elements[0].position = 0.0
    crown.color_ramp.elements[0].color = hexc("#A39C62")
    crown.color_ramp.elements[1].position = 0.62
    crown.color_ramp.elements[1].color = hexc("#3E3A22")
    L(vor.outputs["Distance"], crown.inputs["Fac"])
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 0.02
    nz.inputs["Detail"].default_value = 4.0
    L(tc.outputs["Object"], nz.inputs["Vector"])
    tone = nt.nodes.new("ShaderNodeMix")
    tone.data_type = "RGBA"
    tone.blend_type = "MULTIPLY"
    tone.inputs["Factor"].default_value = 0.35
    L(crown.outputs["Color"], tone.inputs[6])
    L(nz.outputs["Color"], tone.inputs[7])
    grove = nt.nodes.new("ShaderNodeBsdfPrincipled")
    L(tone.outputs[2], grove.inputs["Base Color"])
    grove.inputs["Roughness"].default_value = 0.9
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.8
    bp.inputs["Distance"].default_value = 2.0
    inv = nt.nodes.new("ShaderNodeMath")
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    L(vor.outputs["Distance"], inv.inputs[1])
    L(inv.outputs[0], bp.inputs["Height"])
    L(bp.outputs["Normal"], grove.inputs["Normal"])
    # Маска: расстояние от дома по земле + шум по краю.
    xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(tc.outputs["Object"], xyz.inputs[0])
    vec = nt.nodes.new("ShaderNodeCombineXYZ")
    L(xyz.outputs["X"], vec.inputs["X"])
    L(xyz.outputs["Y"], vec.inputs["Y"])
    ln = nt.nodes.new("ShaderNodeVectorMath")
    ln.operation = "LENGTH"
    L(vec.outputs[0], ln.inputs[0])
    nzm = nt.nodes.new("ShaderNodeTexNoise")
    nzm.inputs["Scale"].default_value = 0.05
    L(tc.outputs["Object"], nzm.inputs["Vector"])
    add = nt.nodes.new("ShaderNodeMath")
    add.operation = "MULTIPLY_ADD"
    L(nzm.outputs["Fac"], add.inputs[0])
    add.inputs[1].default_value = 40.0
    L(ln.outputs["Value"], add.inputs[2])
    gm = nt.nodes.new("ShaderNodeMapRange")
    gm.inputs["From Min"].default_value = 110
    gm.inputs["From Max"].default_value = 150
    gm.interpolation_type = "SMOOTHSTEP"
    L(add.outputs[0], gm.inputs["Value"])
    gmix = nt.nodes.new("ShaderNodeMixShader")
    L(gm.outputs["Result"], gmix.inputs[0])
    L(b.outputs[0], gmix.inputs[1])
    L(grove.outputs[0], gmix.inputs[2])
    haze = nt.nodes.new("ShaderNodeBsdfDiffuse")
    haze.inputs["Color"].default_value = hexc("#B9A98F")
    mix = nt.nodes.new("ShaderNodeMixShader")
    L(mr.outputs["Result"], mix.inputs[0])
    L(gmix.outputs[0], mix.inputs[1])
    L(haze.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs[0])
    return m


def backdrop_mat():
    m, nt, out = new_mat("Backdrop")
    L = nt.links.new
    tx = nt.nodes.new("ShaderNodeTexImage")
    tx.image = bpy.data.images.load(str(HERE / "backdrop.jpg"))
    tx.extension = "EXTEND"
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 1.0
    L(tx.outputs["Color"], em.inputs["Color"])
    # Задник светит только в камеру: свет и отражения дают небо и солнце.
    lp = nt.nodes.new("ShaderNodeLightPath")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    # Верх задника растворяется в небе сцены: шва по краю дуги нет.
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(tc.outputs["UV"], sep.inputs[0])
    fade = nt.nodes.new("ShaderNodeMapRange")
    fade.inputs["From Min"].default_value = 0.97
    fade.inputs["From Max"].default_value = 0.8
    fade.interpolation_type = "SMOOTHSTEP"
    L(sep.outputs["Y"], fade.inputs["Value"])
    cut = nt.nodes.new("ShaderNodeMath")
    cut.operation = "MULTIPLY"
    L(lp.outputs["Is Camera Ray"], cut.inputs[0])
    L(fade.outputs["Result"], cut.inputs[1])
    L(cut.outputs[0], mix.inputs[0])
    L(tr.outputs[0], mix.inputs[1])
    L(em.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs[0])
    return m


def build_materials():
    M["trav"] = pbr("Travertine", "beige_wall_002", size=2.4, tint="#EFE2CB", sat=0.75, val=1.08, rough=(0.55, 0.9), bump=0.7, macro=0.12)
    M["trav_dark"] = pbr("TravertineShade", "beige_wall_002", size=2.4, tint="#D9C7AA", sat=0.75, val=0.95, rough=(0.55, 0.9), bump=0.7)
    M["pavers"] = pbr("Pavers", "stone_tile_wall", size=3.2, tint="#EADCC6", sat=0.45, val=1.06, rough=(0.4, 0.85), bump=0.5, macro=0.1)
    M["oak"] = pbr("Oak", "white_oak_veneer", size=1.8, tint="#F0DCC0", rough=(0.35, 0.7), bump=0.3)
    M["oak_soffit"] = pbr("OakSoffit", "white_oak_veneer", size=2.2, tint="#E8D8C0", sat=0.5, val=1.0, rough=(0.45, 0.8), bump=0.3, rot=math.pi / 2)
    M["floor"] = pbr("Floor", "white_oak_veneer", size=1.4, tint="#EBD6B8", rough=(0.25, 0.6), bump=0.25, coat=0.12)
    M["plaster"] = pbr("Plaster", "white_plaster_02", size=2.5, tint="#F3ECE2", sat=0.4, val=1.1, rough=(0.7, 1.0), bump=0.3)
    M["marble"] = pbr("Marble", "marble_01", size=2.0, sat=0.6, val=1.08, rough=(0.2, 0.55), bump=0.3, coat=0.2)
    M["linen"] = pbr("Linen", "rough_linen", size=0.6, tint="#D8CDBB", sat=0.2, val=1.0, rough=(0.75, 1.0), bump=1.0)
    M["rug"] = pbr("Rug", "poly_wool_herringbone", size=0.5, tint="#D5C8B4", sat=0.2, val=1.15, rough=(0.8, 1.0), bump=0.8)
    M["tiles"] = pbr("PoolTiles", "long_white_tiles", size=1.2, tint="#7CC7C2", rough=(0.1, 0.4), bump=0.5)
    M["gravel"] = pbr("Gravel", "gravel_floor", size=1.6, sat=0.5, val=1.05, rough=(0.6, 1.0), bump=0.8)
    M["slope"] = slope_mat()
    M["wall"] = pbr("WallIn", "white_plaster_02", size=2.5, tint="#EADBC6", sat=0.5, val=1.05, rough=(0.7, 1.0), bump=0.2)
    M["glass"] = glass("Glass", tint="#F1F4F2")
    M["rail"] = glass("RailGlass", tint="#DCE9E4", rough=0.02)
    M["water"] = water()
    M["bronze"] = plain("Bronze", "#4A3B2C", rough=0.32, metal=0.85)
    M["dark"] = plain("Shadow", "#14110E", rough=0.9)
    M["led"] = plain("Led", "#FFFFFF", emit="#FFC98F", strength=6.0)
    M["led_soft"] = plain("LedSoft", "#FFFFFF", emit="#FFD7A8", strength=2.2)
    M["soil"] = plain("Soil", "#3A2E22", rough=0.95)
    M["backdrop"] = backdrop_mat()
    M["leaf"] = leaf_mat()
    M["lav"] = plain("LavenderFlower", "#8C68B4", rough=0.8)
    M["sage"] = plain("LavenderLeaf", "#7D8A62", rough=0.85)


# ───────────────────────── скруглённые плиты ─────────────────────────

def outline(x0, x1, y0, y1, r, seg=14):
    """Контур прямоугольника со скруглёнными углами, против часовой стрелки."""
    r = min(r, (x1 - x0) / 2, (y1 - y0) / 2)
    pts = []
    for (cx, cy, a0) in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
        for k in range(seg + 1):
            a = math.radians(a0 + 90 * k / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def prism(name, pts, z0, z1, mat, holes=None):
    """Призма по контуру; UV стен — по длине контура и высоте, крышек — по x, y."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    n = len(pts)
    bot = [bm.verts.new((x, y, z0)) for (x, y) in pts]
    top = [bm.verts.new((x, y, z1)) for (x, y) in pts]
    s = [0.0]
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % n]
        s.append(s[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    for i in range(n):
        j = (i + 1) % n
        f = bm.faces.new((bot[i], bot[j], top[j], top[i]))
        for lp, (u, v) in zip(f.loops, ((s[i], z0), (s[i + 1], z0), (s[i + 1], z1), (s[i], z1))):
            lp[uvl].uv = (u, v)
    for ring, rev in ((top, False), (bot, True)):
        f = bm.faces.new(list(reversed(ring)) if rev else ring)
        for lp in f.loops:
            lp[uvl].uv = (lp.vert.co.x, lp.vert.co.y)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    ob = link(bpy.data.objects.new(name, me))
    mod = ob.modifiers.new("bevel", "BEVEL")
    mod.width = 0.02
    mod.segments = 2
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(50)
    return ob


def ring(name, pts_out, pts_in, z0, z1, mat):
    """Полоса между двумя контурами (подсветка по краю плиты)."""
    me = bpy.data.meshes.new(name)
    n = len(pts_out)
    verts = [(x, y, z0) for (x, y) in pts_out] + [(x, y, z0) for (x, y) in pts_in]
    faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    me.from_pydata(verts, [], faces)
    me.materials.append(mat)
    ob = link(bpy.data.objects.new(name, me))
    ob.visible_shadow = False
    return ob


def inset(pts, d):
    """Контур, сдвинутый внутрь на d (для выпуклого контура — по биссектрисам)."""
    n = len(pts)
    out = []
    for i in range(n):
        p0, p1, p2 = Vector(pts[i - 1]), Vector(pts[i]), Vector(pts[(i + 1) % n])
        e1, e2 = (p1 - p0).normalized(), (p2 - p1).normalized()
        n1, n2 = Vector((-e1.y, e1.x)), Vector((-e2.y, e2.x))
        b = (n1 + n2).normalized()
        k = d / max(0.3, b.dot(n1))
        q = p1 + b * k
        out.append((q.x, q.y))
    return out


# ───────────────────────── вилла ─────────────────────────

H = 3.9      # высота этажа
T = 0.45     # толщина плиты
LEVELS = [
    # (низ этажа, плита над ним: x0, x1, y0 (край), y1, радиус; линия стекла y, ширина стекла)
    (0.0, (-19.0, 19.0, -6.5, 12.0, 4.5), -2.0, 16.0),
    (H + T, (-17.0, 17.0, -3.0, 12.0, 4.0), 0.4, 14.0),
    (2 * (H + T), (-14.0, 14.0, -0.2, 12.0, 3.5), 2.6, 11.0),
]
DOOR = (-6.4, -3.2)   # откатанная створка гостиной (между рифлёными простенками)


def glazing(level, z0, y, half, door=None):
    """Стекло от пола до потолка, бронзовые стойки, травертиновые ламели."""
    z1 = z0 + H
    step = 3.2
    n = round(2 * half / step)
    for k in range(n):
        x0 = -half + k * step
        x1 = x0 + step
        if door and abs(x0 - door[0]) < 0.05:
            box(f"DoorSlid{level}", x0 + step + 0.04, x1 + step - 0.04, y + 0.12, y + 0.14, z0 + 0.04, z1 - 0.05, M["glass"], bevel=0, shadow=False)
            continue
        box(f"Glass{level}_{k}", x0 + 0.03, x1 - 0.03, y - 0.01, y + 0.01, z0 + 0.04, z1 - 0.05, M["glass"], bevel=0, shadow=False)
    for k in range(n + 1):
        x = -half + k * step
        box(f"Mull{level}_{k}", x - 0.035, x + 0.035, y - 0.06, y + 0.06, z0, z1, M["bronze"], bevel=0.003)
    box(f"Head{level}", -half, half, y - 0.06, y + 0.06, z1 - 0.07, z1, M["bronze"], bevel=0.003)
    # Ламели из травертина: группы по краям и на простенках, как на рендерах бюро.
    for k in range(n + 1):
        if k % 2:
            continue
        x = -half + k * step
        flutes(f"Fin{level}_{k}", x, y - 0.36, z0, z1)


def flutes(name, x, y, z0, z1, n=7, w=0.15):
    """Рифлёная панель из травертина: полуцилиндры вплотную, как на рендерах бюро."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    for i in range(n):
        c = bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=w / 2, radius2=w / 2, depth=z1 - z0)
        for v in c["verts"]:
            v.co.x += x + (i - (n - 1) / 2) * w
            v.co.y += y
            v.co.z += (z0 + z1) / 2
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(M["trav"])
    ob = link(bpy.data.objects.new(name, me))
    box(name + "Core", x - n * w / 2, x + n * w / 2, y, y + 0.22, z0, z1, M["trav"], bevel=0.005)
    return ob


def interior_lights(level, z0, y, half):
    z = z0 + H - 0.08
    lt = bpy.data.lights.new(f"Room{level}", "AREA")
    lt.shape = "RECTANGLE"
    lt.size, lt.size_y = 2 * half - 2, 6
    lt.energy = 7000 if level else 8000
    lt.color = (1.0, 0.8, 0.58)
    ob = link(bpy.data.objects.new(f"Room{level}", lt))
    ob.location = (0, y + 4.5, z)
    ob.visible_glossy = False
    ob.visible_transmission = False
    # Линия света в потолке вдоль стекла.
    box(f"CeilLed{level}", -half + 0.6, half - 0.6, y + 0.5, y + 0.58, z0 + H - 0.02, z0 + H, M["led_soft"], bevel=0, shadow=False)


def villa():
    for lvl, (z0, (x0, x1, y0, y1, r), gy, half) in enumerate(LEVELS):
        zs = z0 + H
        out = outline(x0, x1, y0, y1, r)
        prism(f"Slab{lvl}", out, zs, zs + T, M["plaster"])
        # Подшивка из дуба и тёплая полоса по краю снизу.
        prism(f"Soffit{lvl}", inset(out, 0.25), zs - 0.02, zs, M["plaster"])
        ring(f"EdgeLed{lvl}", inset(out, 0.06), inset(out, 0.16), zs - 0.025, zs - 0.025, M["led"])
        # Пол этажа внутри, задняя стена, боковые объёмы из травертина.
        box(f"Floor{lvl}", -half, half, gy, y1 - 0.4, z0, z0 + 0.03 if lvl == 0 else z0 + 0.02, M["floor"], bevel=0)
        box(f"Back{lvl}", -half, half, y1 - 0.6, y1 - 0.4, z0, zs, M["wall"], bevel=0)
        box(f"Ceil{lvl}", -half, half, gy, y1 - 0.4, zs - 0.03, zs - 0.01, M["oak_soffit"], bevel=0)
        for sx in (-1, 1):
            xa, xb = (x0 + 1.2, -half) if sx < 0 else (half, x1 - 1.2)
            if xb - xa > 0.4:
                box(f"Side{lvl}{sx}", min(xa, xb), max(xa, xb), gy - 0.4, y1 - 0.4, z0, zs, M["trav"], bevel=0.01)
        glazing(lvl, z0, gy, half, DOOR if lvl == 0 else None)
        interior_lights(lvl, z0, gy, half)
        # Терраса над нижней плитой: стеклянное ограждение и зелень по краю.
        if lvl > 0:
            px0, px1, py0, py1, pr = LEVELS[lvl - 1][1]
            edge = inset(outline(px0, px1, py0, py1, pr), 0.35)
            front = [p for p in edge if p[1] < gy - 1.0]
            for i in range(len(front) - 1):
                a, b = front[i], front[i + 1]
                if math.hypot(b[0] - a[0], b[1] - a[1]) < 0.05:
                    continue
                cx, cy = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
                ln = math.hypot(b[0] - a[0], b[1] - a[1])
                g = box(f"Rail{lvl}_{i}", -ln / 2, ln / 2, -0.012, 0.012, z0, z0 + 1.05, M["rail"], bevel=0, shadow=False)
                g.location = (cx, cy, 0)
                g.rotation_euler[2] = math.atan2(b[1] - a[1], b[0] - a[0])
            # Плантеры с зеленью вдоль переднего края, она свисает за плиту.
            for k in range(int((px1 - px0 - 2 * pr) / 2.2)):
                x = px0 + pr + 1.1 + k * 2.2
                place("shrub_02", x, py0 + 0.9, z0, rnd.uniform(0, 6.28), rnd.uniform(0.45, 0.6))
                lavender(x + 1.1, py0 + 0.8, z0, 0.8)
            box(f"Deck{lvl}", px0 + 0.4, px1 - 0.4, py0 + 0.4, gy - 0.65, z0, z0 + 0.03, M["pavers"], bevel=0)
    # Кровля: гравий, сад, парапет.
    x0, x1, y0, y1, r = LEVELS[-1][1]
    ztop = LEVELS[-1][0] + H + T
    prism("RoofGravel", inset(outline(x0, x1, y0, y1, r), 0.5), ztop, ztop + 0.04, M["gravel"])
    for k in range(6):
        place("shrub_02", x0 + 3 + k * 4.4, y0 + 2.4, ztop, rnd.uniform(0, 6.28), 0.6)


def terrace():
    # Терраса перед гостиной, бассейн-инфинити с краем на долину.
    Y0 = -19.0
    box("DeckFront", -21, 21, Y0, -16.4, -0.32, 0.0, M["pavers"], bevel=0.004)
    box("DeckBack", -21, 21, -8.6, -2.0, -0.32, 0.0, M["pavers"], bevel=0.004)
    box("DeckW", -21, -15, -16.4, -8.6, -0.32, 0.0, M["pavers"], bevel=0.004)
    box("DeckE", 7, 21, -16.4, -8.6, -0.32, 0.0, M["pavers"], bevel=0.004)
    box("PoolFloor", -15, 7, -16.4, -8.6, -1.6, -1.5, M["tiles"], bevel=0)
    for (n, a, b, c, d) in (("PwS", -15, 7, -16.4, -16.3), ("PwN", -15, 7, -8.7, -8.6), ("PwW", -15, -14.9, -16.4, -8.6), ("PwE", 6.9, 7, -16.4, -8.6)):
        box(n, a, b, c, d, -1.55, -0.02 if n != "PwS" else -0.06, M["tiles"], bevel=0)
    w = box("Water", -14.9, 6.9, -16.3, -8.7, -1.55, -0.04, M["water"], bevel=0, shadow=False)
    w.visible_volume_scatter = False
    # Подсветка чаши снизу: вода светится бирюзой, как на рендерах бюро.
    pl = bpy.data.lights.new("PoolGlow", "AREA")
    pl.shape = "RECTANGLE"
    pl.size, pl.size_y = 21.0, 7.0
    pl.energy = 2500
    pl.color = (0.75, 0.95, 1.0)
    o = link(bpy.data.objects.new("PoolGlow", pl))
    o.location = (-4.0, -12.5, -1.45)
    o.rotation_euler = (math.pi, 0, 0)
    o.visible_camera = False
    # Подпорная стена из травертина и каскад ступеней вниз по склону.
    box("Retain", -21, 21, Y0 - 0.5, Y0, -6.0, -0.32, M["trav"], bevel=0.01)
    for k in range(12):
        z = -0.32 - 0.3 * (k + 1)
        y = Y0 - 0.5 - 0.42 * (k + 1)
        box(f"Step{k}", 9.0, 13.0, y, y + 0.42, z - 0.3, z, M["pavers"], bevel=0.004)
        box(f"StepLed{k}", 9.05, 12.95, y + 0.4, y + 0.42, z - 0.06, z - 0.03, M["led_soft"], bevel=0, shadow=False)
    # Шезлонги и зона у воды.
    for x in (-12.0, -9.6, -7.2, -4.8):
        box(f"Lounger{x}", x - 0.38, x + 0.38, -7.9, -5.8, 0.0, 0.28, M["oak"], bevel=0.008)
        rounded(f"Pad{x}", x - 0.35, x + 0.35, -7.85, -6.3, 0.28, 0.36, M["linen"], r=0.03)
        rounded(f"Back{x}", x - 0.35, x + 0.35, -6.3, -5.85, 0.28, 0.66, M["linen"], r=0.04)
    rounded("OutSofa", 10.0, 15.0, -6.4, -5.4, 0.0, 0.42, M["linen"], r=0.04)
    rounded("OutSofaBack", 10.0, 15.0, -5.6, -5.3, 0.42, 0.8, M["linen"], r=0.06)
    box("FirePit", 11.3, 13.7, -9.4, -7.6, 0.0, 0.34, M["trav"], bevel=0.01)
    box("Fire", 11.6, 13.4, -9.1, -7.9, 0.34, 0.36, M["led"], bevel=0, shadow=False)
    for (x, y, s) in ((-18.5, -4.0, 1.0), (17.8, -3.4, 1.1), (18.5, -14.5, 0.9), (-19.0, -15.0, 0.9)):
        olive(x, y, 0.55 * s)


def interior():
    y0 = LEVELS[0][2]
    box("Rug", -11.5, -5.5, y0 + 2.5, y0 + 7.0, 0.03, 0.045, M["rug"], bevel=0.003)
    # Низкий модульный диван из льна (вместо модели: у Poly Haven он потёртый, винтажный).
    rounded("SofaBase", -11.6, -5.4, y0 + 5.6, y0 + 6.7, 0.03, 0.42, M["linen"], r=0.06)
    rounded("SofaBack", -11.6, -5.4, y0 + 6.45, y0 + 6.85, 0.42, 0.82, M["linen"], r=0.1)
    for xa in (-11.6, -6.0):
        rounded(f"SofaArm{xa}", xa, xa + 0.6, y0 + 5.6, y0 + 6.85, 0.42, 0.66, M["linen"], r=0.1)
    for k in range(3):
        xa = -11.0 + k * 1.86
        rounded(f"SofaCush{k}", xa + 0.02, xa + 1.84, y0 + 5.62, y0 + 6.45, 0.42, 0.56, M["linen"], r=0.07)
    place("modern_arm_chair_01", -10.8, y0 + 3.4, 0.03, math.radians(-50), 1.0)
    place("modern_arm_chair_01", -6.2, y0 + 3.3, 0.03, math.radians(50), 1.0)
    place("modern_coffee_table_01", -8.5, y0 + 4.6, 0.03, 0.0, 1.0)
    place("brass_vase_01", -8.4, y0 + 4.6, 0.42, 0.0, 1.0)
    # Кухня-остров из камня, обеденный стол, светильники.
    box("Island", 3.0, 8.0, y0 + 6.0, y0 + 7.1, 0.03, 0.95, M["marble"], bevel=0.01)
    place("dining_table", 4.8, y0 + 3.0, 0.03, 0.0, 1.0)
    for (x, dy, r) in ((3.6, 2.3, 0.0), (6.0, 2.3, 0.0), (3.6, 3.7, math.pi), (6.0, 3.7, math.pi)):
        place("dining_chair_02", x, y0 + dy, 0.03, r, 1.0)
    for x in (3.9, 5.7):
        place("modern_ceiling_lamp_01", x, y0 + 3.0, H - 1.25, 0.0, 1.0)
        lt = bpy.data.lights.new(f"Pend{x}", "POINT")
        lt.energy = 40
        lt.color = (1.0, 0.78, 0.52)
        lt.shadow_soft_size = 0.08
        o = link(bpy.data.objects.new(f"Pend{x}", lt))
        o.location = (x, y0 + 3.0, H - 1.05)
    # Ниша в травертиновой стене с подсветкой, растения.
    box("Niche", -12.0, -5.0, 11.35, 11.45, 0.6, 2.9, M["oak"], bevel=0)
    box("NicheLed", -12.0, -5.0, 11.3, 11.36, 2.85, 2.88, M["led_soft"], bevel=0, shadow=False)
    place("ceramic_vase_03", -10.6, 11.0, 0.03, 0.0, 1.6)
    place("ceramic_vase_01", -6.4, 11.1, 0.03, 0.0, 1.3)
    place("potted_plant_01", -14.2, y0 + 1.2, 0.03, 0.4, 1.3)
    place("potted_plant_04", 13.5, y0 + 1.4, 0.03, 0.0, 1.3)


# ───────────────────────── склон и сад ─────────────────────────

def ground_z(x, y):
    """Склон: площадка под виллой, вниз к долине на юг, вверх к лесу на север."""
    z = 0.0
    if y < -19.5:
        z = -5.2 - (-19.5 - y) * 0.16
    elif y < -18.0:
        z = -5.2
    if y > 13:
        z += min((y - 13) * 0.16, 14.0)
    z += 0.9 * math.sin(x * 0.045) * math.cos(y * 0.037) * min(1.0, max(0.0, (abs(y) - 22) / 30))
    if abs(x) > 24:
        z -= (abs(x) - 24) * 0.04
    return z


def terrain():
    me = bpy.data.meshes.new("Terrain")
    N, S = 150, 1400.0
    verts, faces = [], []
    for j in range(N + 1):
        for i in range(N + 1):
            u, v = i / N, j / N
            # Плотнее у виллы: сетка сжата к центру.
            x = math.copysign(abs(u * 2 - 1) ** 1.8, u * 2 - 1) * S / 2
            y = math.copysign(abs(v * 2 - 1) ** 1.8, v * 2 - 1) * S / 2
            verts.append((x, y, ground_z(x, y)))
    for j in range(N):
        for i in range(N):
            a = j * (N + 1) + i
            faces.append((a, a + 1, a + N + 2, a + N + 1))
    me.from_pydata(verts, [], faces)
    uvl = me.uv_layers.new(name="UVMap")
    for lp in me.loops:
        v = me.vertices[lp.vertex_index].co
        uvl.data[lp.index].uv = (v.x, v.y)
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(M["slope"])
    ob = link(bpy.data.objects.new("Terrain", me))
    # Под домом и террасой склон не нужен: уводим вершины вниз.
    for v in me.vertices:
        if -22 < v.co.x < 22 and -19 < v.co.y < 12.5:
            v.co.z = -0.4
    return ob


CYPRESS = []


def cypress_mesh():
    """Кипарис кодом: веретено из комков листвы (~20 тыс. треугольников).

    Сосна Poly Haven — 17 млн треугольников и 0,9 ГБ: на раннере GitHub
    сцена с ней не помещается в память, а кипарис издали — это силуэт."""
    if CYPRESS:
        return CYPRESS[0]
    r = random.Random(7)
    bm = bmesh.new()
    n = 220
    for k in range(n):
        t = r.random()
        z = 0.7 + t * 9.6
        w = 0.95 * math.sin(math.pi * min(1.0, 0.1 + t * 0.92)) ** 0.7 * (1 - t * 0.45)
        a = r.uniform(0, 6.28)
        d = w * r.uniform(0.35, 0.95)
        m = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=max(0.12, w * r.uniform(0.3, 0.5)))
        for v in m["verts"]:
            v.co.x = v.co.x * 1.0 + math.cos(a) * d
            v.co.y = v.co.y * 1.0 + math.sin(a) * d
            v.co.z = v.co.z * 2.2 + z
            j = r.uniform(-0.07, 0.07)
            v.co += v.normal * j
    trunk = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.12, radius2=0.08, depth=1.4)
    for v in trunk["verts"]:
        v.co.z += 0.7
    me = bpy.data.meshes.new("Cypress")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(M["leaf"])
    ob = bpy.data.objects.new("Cypress", me)
    coll = bpy.data.collections.new("M_cypress")
    coll.objects.link(ob)
    base.MODELS["cypress"] = coll
    CYPRESS.append(coll)
    return coll


def leaf_mat():
    """Тёмная хвоя кипариса: шум по цвету, просвет на солнце."""
    m, nt, out = new_mat("CypressLeaf")
    L = nt.links.new
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 3.5
    nz.inputs["Detail"].default_value = 8.0
    L(tc.outputs["Object"], nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = hexc("#1C2814")
    ramp.color_ramp.elements[1].color = hexc("#4A5A2A")
    L(nz.outputs["Fac"], ramp.inputs["Fac"])
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    L(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.85
    b.inputs["Subsurface Weight"].default_value = 0.15
    b.inputs["Subsurface Radius"].default_value = (0.2, 0.4, 0.1)
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.9
    nz2 = nt.nodes.new("ShaderNodeTexNoise")
    nz2.inputs["Scale"].default_value = 28.0
    nz2.inputs["Detail"].default_value = 6.0
    L(tc.outputs["Object"], nz2.inputs["Vector"])
    L(nz2.outputs["Fac"], bp.inputs["Height"])
    L(bp.outputs["Normal"], b.inputs["Normal"])
    L(b.outputs[0], out.inputs[0])
    return m


def cypress(x, y, h):
    """Кипарис: колонна листвы, высота ~10 м × h."""
    cypress_mesh()
    z = ground_z(x, y)
    e = place("cypress", x, y, z - 0.2, rnd.uniform(0, 6.28), 1.0)
    e.scale = (h * rnd.uniform(0.85, 1.1), h * rnd.uniform(0.85, 1.1), h)
    return e


def olive(x, y, s):
    """Олива 5–7 м: модели Poly Haven 5 и 2,6 м в исходном размере."""
    n = rnd.choice(["island_tree_01", "island_tree_03"])
    k = 1.0 if n == "island_tree_01" else 1.9
    return place(n, x, y, ground_z(x, y) - 0.1, rnd.uniform(0, 6.28), s * k)


LAV = []


def lavender_mesh():
    """Куст лаванды: шар из стеблей с сиреневыми колосками (~6 тыс. треугольников)."""
    if LAV:
        return LAV[0]
    r = random.Random(11)
    bm = bmesh.new()
    for k in range(90):
        a, el = r.uniform(0, 6.28), r.uniform(0.15, 1.35)
        ln = r.uniform(0.45, 0.62)
        d = Vector((math.cos(a) * math.cos(el), math.sin(a) * math.cos(el), math.sin(el) + 0.25)).normalized()
        tip = d * ln
        c = bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.022, radius2=0.012, depth=0.13)
        q = d.to_track_quat("Z", "Y")
        for v in c["verts"]:
            v.co = q @ v.co + tip
    me = bpy.data.meshes.new("Lavender")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M["lav"])
    leaf = bpy.data.meshes.new("LavenderLeaf")
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.36)
    for v in bm.verts:
        v.co.z = v.co.z * 0.6 + 0.16
        v.co += v.normal * r.uniform(-0.05, 0.05)
    bm.to_mesh(leaf)
    bm.free()
    for p in leaf.polygons:
        p.use_smooth = True
    leaf.materials.append(M["sage"])
    coll = bpy.data.collections.new("M_lavender")
    coll.objects.link(bpy.data.objects.new("Lavender", me))
    coll.objects.link(bpy.data.objects.new("LavenderLeaf", leaf))
    base.MODELS["lavender"] = coll
    LAV.append(coll)
    return coll


def lavender(x, y, z=None, s=1.0):
    lavender_mesh()
    return place("lavender", x, y, ground_z(x, y) if z is None else z, rnd.uniform(0, 6.28), s * rnd.uniform(0.85, 1.15))


def off_path(x, y, gap=9.0):
    """Дерево не встаёт на пути камеры."""
    pts = [Vector((c[0], c[1])) for _, c, _, _ in FLIGHT_KEYS]
    p = Vector((x, y))
    for a, b in zip(pts, pts[1:]):
        ab = b - a
        t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-6)))
        if (a + ab * t - p).length < gap:
            return False
    return True


def garden():
    # Кипарисы группами у виллы, как на рендерах бюро.
    for (x, y, h) in ((-25, -9, 1.25), (-27.5, -5, 1.45), (-24, 2, 1.1), (-27, 7, 1.35), (24, -10, 1.3), (27, -6, 1.1),
                      (25, 3, 1.45), (-30, 16, 1.2), (30, 18, 1.1), (-14, 22, 1.3), (12, 24, 1.2), (2, 28, 1.1)):
        cypress(x, y, h)
    # Оливковая роща по склону к долине и за домом.
    for k in range(900):
        x = rnd.uniform(-220, 220)
        y = rnd.uniform(-300, -24)
        if (abs(x) < 24 and y > -30) or not off_path(x, y):
            continue
        olive(x, y, rnd.uniform(1.15, 1.6))
        if k % 5 == 0 and off_path(x + 5, y):
            cypress(x + rnd.uniform(3, 6), y + rnd.uniform(-3, 3), rnd.uniform(0.9, 1.4))
    for k in range(320):
        x, y = rnd.uniform(-240, 240), rnd.uniform(16, 260)
        if abs(x) < 22 and y < 30:
            continue
        (cypress if k % 3 == 0 else olive)(x, y, rnd.uniform(0.9, 1.5) if k % 3 == 0 else rnd.uniform(0.9, 1.2))
    # Ближняя роща вокруг пути камеры: кроны в кадре снизу, как на рендерах бюро.
    for k in range(420):
        x, y = rnd.uniform(-110, 70), rnd.uniform(-130, -26)
        if (abs(x) < 24 and y > -30) or not off_path(x, y, 7.0):
            continue
        olive(x, y, rnd.uniform(1.2, 1.7))
    for k in range(700):
        x, y = rnd.uniform(-110, 70), rnd.uniform(-130, -24)
        if (abs(x) < 23 and y > -26) or not off_path(x, y, 3.5):
            continue
        place(rnd.choice(["shrub_02", "shrub_02", "shrub_01"]), x, y, ground_z(x, y) - 0.1, rnd.uniform(0, 6.28), rnd.uniform(1.0, 1.7))
    for k in range(400):
        x, y = rnd.uniform(-90, 50), rnd.uniform(-110, -24)
        if (abs(x) < 23 and y > -26) or not off_path(x, y, 3.0):
            continue
        (lavender if k % 3 == 0 else (lambda a, b: place("grass_medium_01", a, b, ground_z(a, b), rnd.uniform(0, 6.28), rnd.uniform(2.5, 3.5))))(x, y)
    # Подлесок рощи: кусты между оливами, склон не голый.
    for k in range(900):
        x, y = rnd.uniform(-220, 220), rnd.uniform(-300, 200)
        if (abs(x) < 24 and -30 < y < 16) or not off_path(x, y, 4.0):
            continue
        place("shrub_02", x, y, ground_z(x, y) - 0.1, rnd.uniform(0, 6.28), rnd.uniform(0.9, 1.6))
    # Сад у дома: лаванда полосами вдоль подпорной стены и ступеней, кусты, травы.
    for row in range(3):
        y = -20.4 - row * 1.1
        for k in range(30):
            x = -20.5 + k * 1.0 + rnd.uniform(-0.2, 0.2)
            if 8.4 < x < 13.6:
                continue
            lavender(x, y + rnd.uniform(-0.2, 0.2))
    for k in range(40):
        x, y = rnd.uniform(-24, 24), rnd.uniform(-34, -24)
        if 7.5 < x < 14.5 or not off_path(x, y, 3.0):
            continue
        place(rnd.choice(["shrub_02", "shrub_02", "shrub_01"]), x, y, ground_z(x, y), rnd.uniform(0, 6.28), rnd.uniform(0.8, 1.3))
    for k in range(120):
        x, y = rnd.uniform(-30, 30), rnd.uniform(-40, -21)
        if 8 < x < 14 or not off_path(x, y, 2.0):
            continue
        place("grass_medium_01", x, y, ground_z(x, y), rnd.uniform(0, 6.28), rnd.uniform(2.0, 3.2))
    # Сад по бокам и за домом: оливы, кусты, лаванда, травы — склон у дома не голый.
    for k in range(500):
        x, y = rnd.uniform(-70, 70), rnd.uniform(-34, 40)
        if abs(x) < 23 and y < 14:
            continue
        if not off_path(x, y, 3.0):
            continue
        c = k % 6
        if c == 0:
            olive(x, y, rnd.uniform(1.1, 1.5))
        elif c in (1, 2):
            place(rnd.choice(["shrub_02", "shrub_01"]), x, y, ground_z(x, y) - 0.1, rnd.uniform(0, 6.28), rnd.uniform(1.0, 1.6))
        elif c == 3:
            lavender(x, y)
        else:
            place("grass_medium_01", x, y, ground_z(x, y), rnd.uniform(0, 6.28), rnd.uniform(2.5, 3.5))
    # Бока террасы: лаванда и кусты в клумбах.
    for sx in (-1, 1):
        for k in range(16):
            x = sx * rnd.uniform(21.5, 26)
            y = rnd.uniform(-19, 8)
            (lavender if k % 2 else (lambda a, b: place("shrub_02", a, b, ground_z(a, b), rnd.uniform(0, 6.28), rnd.uniform(0.8, 1.2))))(x, y)
    # Дальний лес кольцом: край земли не читается.
    for k in range(140):
        a = math.radians(rnd.uniform(195, 345))
        r = rnd.uniform(240, 650)
        x, y = math.cos(a) * r, math.sin(a) * r
        (cypress if k % 3 == 0 else olive)(x, y, rnd.uniform(1.0, 1.6) if k % 3 == 0 else rnd.uniform(1.0, 1.4))


def backdrop():
    """Горы с задника: две дуги радиусом 1800 м — за домом (север) и над долиной (юг).

    Южная дуга зеркальна, чтобы закат на ней тоже был справа, с запада."""
    for name, a_left, a_right, flip in (("BackdropN", 172, 8, False), ("BackdropS", 352, 188, True)):
        R, z0, z1, n = 1800.0, -640.0, 800.0, 64
        me = bpy.data.meshes.new(name)
        verts, faces = [], []
        for i in range(n + 1):
            a = math.radians(a_left + (a_right - a_left) * i / n)
            for z in (z0, z1):
                verts.append((math.cos(a) * R, math.sin(a) * R, z))
        for i in range(n):
            faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
        me.from_pydata(verts, [], faces)
        uvl = me.uv_layers.new(name="UVMap")
        for lp in me.loops:
            k = lp.vertex_index
            u = (k // 2) / n
            uvl.data[lp.index].uv = (1 - u if flip else u, k % 2)
        me.materials.append(M["backdrop"])
        ob = link(bpy.data.objects.new(name, me))
        ob.visible_shadow = False


# ───────────────────────── свет и небо ─────────────────────────

SUN_DIR = Vector((-0.86, -0.42, 0.18)).normalized()   # откуда светит: слева-спереди, низко


def sky():
    w = bpy.data.worlds.new("Sky")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    L = nt.links.new
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(str(next((base.ASSETS / "hdri").glob("*.hdr"))))
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 0.55
    out = nt.nodes.new("ShaderNodeOutputWorld")
    L(env.outputs[0], bg.inputs[0])
    # В камеру — небо в тон задника (персиковый горизонт, голубой зенит), свет — от HDRI.
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(tc.outputs["Generated"], sep.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = hexc("#F4C79A")
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = hexc("#9DB6D2")
    L(sep.outputs["Z"], ramp.inputs["Fac"])
    sbg = nt.nodes.new("ShaderNodeBackground")
    sbg.inputs["Strength"].default_value = 1.0
    L(ramp.outputs["Color"], sbg.inputs[0])
    lp = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    L(lp.outputs["Is Camera Ray"], mix.inputs[0])
    L(bg.outputs[0], mix.inputs[1])
    L(sbg.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs[0])
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 3.6
    sun.angle = math.radians(1.2)
    sun.color = (1.0, 0.74, 0.5)
    ob = link(bpy.data.objects.new("Sun", sun))
    ob.rotation_euler = (-SUN_DIR).to_track_quat("-Z", "Y").to_euler()
    # Порталы в проёмах гостиной: свет внутри чище.
    lt = bpy.data.lights.new("Portal0", "AREA")
    lt.shape = "RECTANGLE"
    lt.size, lt.size_y = 32, H
    lt.cycles.is_portal = True
    o = link(bpy.data.objects.new("Portal0", lt))
    o.location = (0, LEVELS[0][2] - 0.2, H / 2)
    o.rotation_euler = (math.pi / 2, 0, 0)


# ───────────────────────── камера ─────────────────────────

FLIGHT_KEYS = [
    (1, (-74.0, -100.0, 17.0), (0.0, 1.0, 8.0), 34),
    (45, (-42.0, -62.0, 9.5), (-2.0, 1.0, 5.5), 30),
    (90, (-17.0, -36.0, 3.2), (-4.0, 3.0, 3.0), 28),
    (120, (-5.0, -15.0, 0.95), (-5.0, 6.0, 1.7), 26),
    (142, (-5.0, -3.6, 1.55), (-5.6, 8.0, 1.6), 24),
    (162, (-4.4, 3.0, 1.65), (-13.0, 6.0, 1.3), 22),
    (180, (-7.8, 8.6, 1.9), (-10.5, -24.0, -1.2), 22),
]


def camera(vertical):
    sc = bpy.context.scene
    cd = bpy.data.cameras.new("Cam")
    cd.sensor_width = 36
    cd.clip_start = 0.05
    cd.clip_end = 5000
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = 5.6
    cam = link(bpy.data.objects.new("Cam", cd))
    sc.camera = cam
    tgt = link(bpy.data.objects.new("Target", None))
    tr = cam.constraints.new("TRACK_TO")
    tr.target = tgt
    tr.track_axis = "TRACK_NEGATIVE_Z"
    tr.up_axis = "UP_Y"
    cd.dof.focus_object = tgt
    k = 0.75 if vertical else 1.0
    for f, c, t, lens in FLIGHT_KEYS:
        cam.location = c
        tgt.location = t
        cd.lens = lens * k
        cam.keyframe_insert("location", frame=f)
        tgt.keyframe_insert("location", frame=f)
        cd.keyframe_insert("lens", frame=f)
    for ob in (cam, tgt, cd):
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"
    return cam


def setup_render(args):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    cy = sc.cycles
    cy.device = "CPU"
    cy.samples = args.samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.015
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    cy.denoising_prefilter = "ACCURATE"
    cy.max_bounces = 10
    cy.diffuse_bounces = 4
    cy.glossy_bounces = 4
    cy.transmission_bounces = 10
    cy.transparent_max_bounces = 16
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.sample_clamp_indirect = 8.0
    cy.blur_glossy = 1.0
    sc.render.use_persistent_data = True
    sc.render.resolution_x, sc.render.resolution_y = (1080, 1920) if args.vertical else (1920, 1080)
    sc.render.resolution_percentage = args.percent
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_depth = "8"
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
    sc.render.fps = 24
    # Внутри экспозиция поднимается, как у камеры.
    for f, ev in ((1, 0.55), (115, 0.55), (142, 0.6), (160, 0.7), (180, 0.45)):
        sc.view_settings.exposure = ev
        sc.view_settings.keyframe_insert("exposure", frame=f)


def main():
    args = parse_args()
    base.ASSETS = Path(args.assets)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    import time
    t0 = time.time()
    build_materials()
    villa()
    terrace()
    interior()
    terrain()
    garden()
    backdrop()
    sky()
    cam = camera(args.vertical)
    setup_render(args)
    print(f"сцена собрана за {time.time() - t0:.0f} с: объектов {len(bpy.data.objects)}", flush=True)
    sc = bpy.context.scene
    if args.save:
        bpy.ops.wm.save_as_mainfile(filepath=args.save)
    if not args.out:
        return
    frames = [int(x) for x in args.frames.split(",") if x] if args.frames else list(range(args.start, (args.end or FLIGHT) + 1, args.step))
    for f in frames:
        t = time.time()
        sc.frame_set(f)
        sc.render.filepath = f"{args.out}{f:04d}.png"
        bpy.ops.render.render(write_still=True)
        print(f"Saved {f:04d}: {time.time() - t:.0f} с", flush=True)


if __name__ == "__main__":
    main()
