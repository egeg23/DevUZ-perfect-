"""Пролёт для макета архбюро: генплан сверху → фасад через бассейн → внутрь.

Вилла собрана кодом: бетонный объём на консоли над стеклянной гостиной,
терраса из камня, бассейн, двор с деревом, мебель. Материалы, небо, мебель и
деревья — Poly Haven (CC0), их качает assets.py. Руками в Blender ничего не
делается.

    python3 scripts/blender/arhbyuro/assets.py /tmp/ph
    blender -b --factory-startup -P scripts/blender/arhbyuro/scene.py -- \\
        --assets /tmp/ph --shot flight --out /tmp/frames/f_ --start 1 --end 180

Кадры:
  flight  180 кадров пролёта, листаются прокруткой на сайте
          1–40     генплан сверху, камера уходит в облёт
          40–85    спуск к фасаду, терраса и бассейн
          85–150   низко над водой к открытой створке
          150–180  внутри: гостиная и двор с деревом
  hero    192 кадра медленного проезда вдоль фасада (фон первого экрана)
  stills  12 кадров для галереи: вилла 1–6, башня 7–9, павильон 10–12

Blender 4.5 LTS, как у ролика студии (scripts/blender/devuz-studio).
"""

import argparse
import math
import random
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

rnd = random.Random(20261015)

FLIGHT = 180
HERO = 192

# Куда смотрит солнце: с юго-запада, светит на южный фасад слева.
SUN_WANT = math.atan2(-0.8, -0.6)


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--assets", required=True, help="папка из assets.py")
    ap.add_argument("--shot", default="flight", choices=["flight", "hero", "stills"])
    ap.add_argument("--out", default="", help="префикс кадров, например /tmp/frames/f_")
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--end", type=int, default=0)
    ap.add_argument("--step", type=int, default=1)
    ap.add_argument("--frames", default="", help="отдельные кадры через запятую")
    ap.add_argument("--samples", type=int, default=96)
    ap.add_argument("--percent", type=int, default=100)
    ap.add_argument("--vertical", action="store_true", help="1080×1920 для телефона")
    ap.add_argument("--save", default="")
    return ap.parse_args(argv)


# ───────────────────────── материалы ─────────────────────────

def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexc(h, a=1.0):
    h = h.lstrip("#")
    return (lin(int(h[0:2], 16) / 255), lin(int(h[2:4], 16) / 255), lin(int(h[4:6], 16) / 255), a)


def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    return m, nt, nt.nodes.new("ShaderNodeOutputMaterial")


ASSETS = Path("/tmp/ph")


def pbr(name, tex, size=2.0, tint=None, sat=1.0, val=1.0, rough=(0.0, 1.0), bump=1.0, rot=0.0, coat=0.0, macro=0.0):
    """Материал Poly Haven по UV в метрах: size — метров на один повтор."""
    m, nt, out = new_mat(name)
    L = nt.links.new
    uv = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / size, 1 / size, 1)
    mp.inputs["Rotation"].default_value[2] = rot
    L(uv.outputs["UV"], mp.inputs["Vector"])

    def img(short, data):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(str(ASSETS / "tex" / tex / f"{short}.jpg"), check_existing=True)
        if data:
            n.image.colorspace_settings.name = "Non-Color"
        n.interpolation = "Cubic" if short == "diff" else "Linear"
        L(mp.outputs[0], n.inputs[0])
        return n

    d, r, nrm = img("diff", False), img("rough", True), img("nor_gl", True)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.inputs["Saturation"].default_value = sat
    hsv.inputs["Value"].default_value = val
    L(d.outputs["Color"], hsv.inputs["Color"])
    col = hsv.outputs["Color"]
    if tint:
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        mx.blend_type = "MULTIPLY"
        mx.inputs["Factor"].default_value = 1.0
        L(col, mx.inputs[6])
        mx.inputs[7].default_value = hexc(tint)
        col = mx.outputs[2]
    if macro:
        # Крупные пятна, чтобы повтор текстуры не читался издалека.
        nz = nt.nodes.new("ShaderNodeTexNoise")
        nz.inputs["Scale"].default_value = 0.035
        nz.inputs["Detail"].default_value = 3
        L(nt.nodes.new("ShaderNodeTexCoord").outputs["Object"], nz.inputs["Vector"])
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.inputs["To Min"].default_value = 1 - macro
        mr.inputs["To Max"].default_value = 1 + macro * 0.6
        L(nz.outputs["Fac"], mr.inputs["Value"])
        mx = nt.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        mx.blend_type = "MULTIPLY"
        mx.inputs["Factor"].default_value = 1.0
        L(col, mx.inputs[6])
        L(mr.outputs["Result"], mx.inputs[7])
        col = mx.outputs[2]
    L(col, b.inputs["Base Color"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = rough[0]
    rr.inputs["To Max"].default_value = rough[1]
    L(r.outputs["Color"], rr.inputs["Value"])
    L(rr.outputs["Result"], b.inputs["Roughness"])
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = bump
    L(nrm.outputs["Color"], nm.inputs["Color"])
    L(nm.outputs["Normal"], b.inputs["Normal"])
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.08
    L(b.outputs[0], out.inputs[0])
    return m


def plain(name, color, rough=0.5, metal=0.0, emit=None, strength=0.0):
    m, nt, out = new_mat(name)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = hexc(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = hexc(emit)
        b.inputs["Emission Strength"].default_value = strength
    nt.links.new(b.outputs[0], out.inputs[0])
    return m


def glass(name, tint="#EEF3F2", rough=0.0):
    m, nt, out = new_mat(name)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = hexc(tint)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Transmission Weight"].default_value = 1.0
    b.inputs["IOR"].default_value = 1.52
    nt.links.new(b.outputs[0], out.inputs[0])
    return m


def water():
    """Вода: преломление, лёгкая рябь (шум 4D, сдвигается по кадрам)."""
    m, nt, out = new_mat("Water")
    L = nt.links.new
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = hexc("#CFE8E6")
    b.inputs["Roughness"].default_value = 0.015
    b.inputs["Transmission Weight"].default_value = 1.0
    b.inputs["IOR"].default_value = 1.333
    co = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.noise_dimensions = "4D"
    nz.inputs["Scale"].default_value = 0.9
    nz.inputs["Detail"].default_value = 6
    nz.inputs["Roughness"].default_value = 0.55
    drv = nz.inputs["W"].driver_add("default_value").driver
    drv.expression = "frame / 90"
    L(co.outputs["Object"], nz.inputs["Vector"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.12
    bp.inputs["Distance"].default_value = 0.02
    L(nz.outputs["Fac"], bp.inputs["Height"])
    L(bp.outputs["Normal"], b.inputs["Normal"])
    L(b.outputs[0], out.inputs[0])
    return m


def ground_mat():
    """Газон с дымкой вдали: к горизонту трава уходит в цвет неба."""
    m = pbr("Lawn", "leafy_grass", size=3.0, tint="#A2C489", sat=0.85, val=0.9, rough=(0.6, 1.0), bump=0.6, macro=0.25)
    nt = m.node_tree
    L = nt.links.new
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    cam = nt.nodes.new("ShaderNodeCameraData")
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 120
    mr.inputs["From Max"].default_value = 1400
    mr.interpolation_type = "SMOOTHSTEP"
    L(cam.outputs["View Distance"], mr.inputs["Value"])
    haze = nt.nodes.new("ShaderNodeBsdfDiffuse")
    haze.inputs["Color"].default_value = hexc("#9FB0B8")
    mix = nt.nodes.new("ShaderNodeMixShader")
    L(mr.outputs["Result"], mix.inputs[0])
    L(b.outputs[0], mix.inputs[1])
    L(haze.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs[0])
    return m


M = {}


def build_materials():
    M["concrete"] = pbr("Concrete", "concrete_slab_wall", size=3.2, sat=0.55, val=1.05, rough=(0.55, 0.95), bump=0.9)
    M["stone"] = pbr("Stone", "marble_01", size=2.4, sat=0.7, val=1.08, rough=(0.35, 0.75), bump=0.5)
    M["stone_dark"] = pbr("StoneWet", "marble_01", size=2.4, sat=0.7, val=0.8, rough=(0.25, 0.6), bump=0.5)
    M["oak"] = pbr("Oak", "grey_oak_veneer_01", size=1.6, tint="#E9D6BE", rough=(0.35, 0.7), bump=0.4)
    M["oak_soffit"] = pbr("OakSoffit", "grey_oak_veneer_01", size=2.0, tint="#CDB89C", rough=(0.45, 0.8), bump=0.4, rot=math.pi / 2)
    M["floor"] = pbr("Floor", "oak_veneer_01", size=1.4, sat=0.7, val=1.1, rough=(0.25, 0.6), bump=0.3, coat=0.15)
    M["plaster"] = pbr("Plaster", "white_plaster_02", size=2.5, sat=0.4, val=1.12, rough=(0.7, 1.0), bump=0.35)
    M["ceiling"] = pbr("Ceiling", "concrete_wall_008", size=3.0, sat=0.45, val=1.05, rough=(0.6, 1.0), bump=0.4)
    M["gravel"] = pbr("Gravel", "gravel_floor", size=1.6, sat=0.5, val=1.05, rough=(0.6, 1.0), bump=0.8)
    M["linen"] = pbr("Linen", "rough_linen", size=0.6, tint="#C2B7A7", sat=0.2, val=1.0, rough=(0.75, 1.0), bump=1.0)
    M["rug"] = pbr("Rug", "poly_wool_herringbone", size=0.5, tint="#D8D0C4", sat=0.2, val=1.2, rough=(0.8, 1.0), bump=0.8)
    M["tiles"] = pbr("PoolTiles", "long_white_tiles", size=1.2, tint="#B4E0DF", rough=(0.1, 0.4), bump=0.6)
    M["sandstone"] = pbr("Sandstone", "white_sandstone_blocks_02", size=3.0, sat=0.6, val=1.05, rough=(0.6, 1.0), bump=0.9)
    M["lawn"] = ground_mat()
    M["glass"] = glass("Glass")
    M["glass_dark"] = glass("GlassTinted", tint="#8FA6AA", rough=0.01)
    M["water"] = water()
    M["frame"] = plain("BlackFrame", "#1C1D1F", rough=0.35, metal=0.6)
    M["dark"] = plain("Shadow", "#0E0F10", rough=0.9)
    M["led"] = plain("Led", "#FFFFFF", emit="#FFD9A8", strength=3.0)
    M["cushion"] = pbr("Cushion", "rough_linen", size=0.5, tint="#8E7F70", sat=0.2, val=0.95, rough=(0.8, 1.0), bump=0.6)


# ───────────────────────── геометрия ─────────────────────────

def link(ob, coll=None):
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def box(name, x0, x1, y0, y1, z0, z1, mat, bevel=0.004, shadow=True):
    """Брус по углам, в метрах. UV — в метрах по главной оси грани."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((x0 if v.co.x < 0 else x1, y0 if v.co.y < 0 else y1, z0 if v.co.z < 0 else z1))
    uvl = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for lp in f.loops:
            c = lp.vert.co
            lp[uvl].uv = (c.y, c.z) if ax == 0 else (c.x, c.z) if ax == 1 else (c.x, c.y)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = False
    me.materials.append(mat)
    ob = link(bpy.data.objects.new(name, me))
    if bevel:
        mod = ob.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        mod.harden_normals = True
        mod.limit_method = "ANGLE"
    if not shadow:
        ob.visible_shadow = False
    return ob


def plane(name, size, z, mat):
    me = bpy.data.meshes.new(name)
    s = size / 2
    me.from_pydata([(-s, -s, z), (s, -s, z), (s, s, z), (-s, s, z)], [], [(0, 1, 2, 3)])
    uvl = me.uv_layers.new(name="UVMap")
    for lp in me.loops:
        v = me.vertices[lp.vertex_index].co
        uvl.data[lp.index].uv = (v.x, v.y)
    me.materials.append(mat)
    return link(bpy.data.objects.new(name, me))


def lawn():
    """Газон вокруг террасы: дыра под террасой и бассейном."""
    E = 1500
    X0, X1, Y0, Y1 = -20.6, 20, -21.6, 16
    rects = [(-E, E, -E, Y0), (-E, E, Y1, E), (-E, X0, Y0, Y1), (X1, E, Y0, Y1)]
    me = bpy.data.meshes.new("Lawn")
    verts, faces = [], []
    for (a, b, c, d) in rects:
        i = len(verts)
        verts += [(a, c, 0), (b, c, 0), (b, d, 0), (a, d, 0)]
        faces.append((i, i + 1, i + 2, i + 3))
    me.from_pydata(verts, [], faces)
    uvl = me.uv_layers.new(name="UVMap")
    for lp in me.loops:
        v = me.vertices[lp.vertex_index].co
        uvl.data[lp.index].uv = (v.x, v.y)
    me.materials.append(M["lawn"])
    return link(bpy.data.objects.new("Lawn", me))


def rounded(name, x0, x1, y0, y1, z0, z1, mat, r=0.05):
    """Мягкая форма (подушки, сиденья): брус с крупной фаской."""
    ob = box(name, x0, x1, y0, y1, z0, z1, mat, bevel=0)
    mod = ob.modifiers.new("soft", "BEVEL")
    mod.width = r
    mod.segments = 5
    mod.limit_method = "NONE"
    ob.modifiers.new("smooth", "WEIGHTED_NORMAL")
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


# ───────────────────────── модели Poly Haven ─────────────────────────

MODELS = {}


def model(name):
    """glTF в свою коллекцию вне сцены — дальше ставим экземплярами."""
    if name in MODELS:
        return MODELS[name]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ASSETS / "models" / name / f"{name}.gltf"))
    new = [o for o in bpy.data.objects if o not in before]
    coll = bpy.data.collections.new("M_" + name)
    for o in new:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        coll.objects.link(o)
    MODELS[name] = coll
    return coll


def place(name, x, y, z=0.0, rot=0.0, scale=1.0):
    e = bpy.data.objects.new(f"{name}@{x:.1f},{y:.1f}", None)
    e.instance_type = "COLLECTION"
    e.instance_collection = model(name)
    e.location = (x, y, z)
    e.rotation_euler[2] = rot
    e.scale = (scale, scale, scale)
    return link(e)


# ───────────────────────── вилла ─────────────────────────

FLOOR = 0.45      # верх террасы и пол гостиной
CEIL = 4.05       # потолок гостиной
SLAB = 4.40       # верх плиты над гостиной
DOOR = (-4.4, -2.0)  # открытая створка фасада


def site():
    lawn()
    # Терраса камнем вокруг чаши бассейна (бассейн x −12…6, y −11.5…−6.5).
    box("TerraceS", -20, 20, -20, -11.5, 0, FLOOR, M["stone"])
    box("TerraceN", -20, 20, -6.5, 8, 0, FLOOR, M["stone"])
    box("TerraceW", -20, -12, -11.5, -6.5, 0, FLOOR, M["stone"])
    box("TerraceE", 6, 20, -11.5, -6.5, 0, FLOOR, M["stone"])
    # Чаша и вода.
    box("PoolFloor", -12, 6, -11.5, -6.5, -1.5, -1.4, M["tiles"], bevel=0)
    box("PoolWallS", -12, 6, -11.5, -11.45, -1.45, FLOOR - 0.02, M["tiles"], bevel=0)
    box("PoolWallN", -12, 6, -6.55, -6.5, -1.45, FLOOR - 0.02, M["tiles"], bevel=0)
    box("PoolWallW", -12, -11.95, -11.5, -6.5, -1.45, FLOOR - 0.02, M["tiles"], bevel=0)
    box("PoolWallE", 5.95, 6, -11.5, -6.5, -1.45, FLOOR - 0.02, M["tiles"], bevel=0)
    w = box("Water", -11.95, 5.95, -11.45, -6.55, -1.45, FLOOR - 0.07, M["water"], bevel=0, shadow=False)
    w.visible_volume_scatter = False
    # Гравийные дорожки и полоса вдоль террасы.
    box("PathW", -34, -20, -3.5, -1.5, 0, 0.03, M["gravel"], bevel=0)
    box("GravelS", -20, 20, -21.6, -20, 0, 0.03, M["gravel"], bevel=0)
    # Стена-пилон из песчаника: уходит с террасы в сад.
    box("FinWall", -20.6, -20, -22, 9, 0, 2.6, M["sandstone"], bevel=0.01)


def mullions(x0, x1, y, z0, z1, step, depth=0.12, skip=()):
    n = round((x1 - x0) / step)
    for k in range(n + 1):
        x = x0 + (x1 - x0) * k / n
        box(f"Mullion{x:.1f}", x - 0.03, x + 0.03, y - depth / 2, y + depth / 2, z0, z1, M["frame"], bevel=0.003)
    box(f"Sill{y:.1f}", x0, x1, y - depth / 2, y + depth / 2, z0, z0 + 0.05, M["frame"], bevel=0.003)
    box(f"Head{y:.1f}", x0, x1, y - depth / 2, y + depth / 2, z1 - 0.06, z1, M["frame"], bevel=0.003)


def villa():
    # Гостиная: стеклянный объём x −14…10, y −4…6.
    box("FloorOak", -14, 10, -4, 6, FLOOR, FLOOR + 0.02, M["floor"], bevel=0)
    box("Slab", -15.4, 11.4, -5.6, 7.4, CEIL, SLAB, M["concrete"], bevel=0.01)
    box("Soffit", -15.4, 11.4, -5.6, -4.06, CEIL - 0.03, CEIL, M["oak_soffit"], bevel=0)
    box("CeilingIn", -14, 10, -4, 6, CEIL - 0.02, CEIL, M["ceiling"], bevel=0)
    # Мягкий свет от потолка: как отражённый от пола и стен день.
    # В кадре и в отражениях его не видно.
    lt = bpy.data.lights.new("Fill", "AREA")
    lt.shape = "RECTANGLE"
    lt.size, lt.size_y = 22, 9
    lt.energy = 450
    lt.color = (1.0, 0.93, 0.84)
    ob = link(bpy.data.objects.new("Fill", lt))
    ob.location = (-2, 1, CEIL - 0.1)
    ob.visible_camera = False
    ob.visible_glossy = False
    ob.visible_transmission = False
    # Южный фасад: стекло от пола до потолка, одна створка откатана.
    mullions(-14, 10, -4, FLOOR, CEIL, 2.4)
    for i in range(10):
        x0 = -14 + 2.4 * i
        if abs(x0 - DOOR[0]) < 0.01:
            # Створка уехала за соседнюю.
            box("DoorSlid", x0 - 2.4 + 0.04, x0 - 0.04, -3.9, -3.88, FLOOR + 0.05, CEIL - 0.06, M["glass"], bevel=0, shadow=False)
            continue
        box(f"GlassS{i}", x0 + 0.03, x0 + 2.37, -4.01, -3.99, FLOOR + 0.05, CEIL - 0.06, M["glass"], bevel=0, shadow=False)
    # Север: стена — стекло во двор — стена.
    box("WallNW", -14, -8, 5.85, 6.1, FLOOR, CEIL, M["plaster"], bevel=0)
    box("WallNE", 2, 10, 5.85, 6.1, FLOOR, CEIL, M["plaster"], bevel=0)
    mullions(-8, 2, 6, FLOOR, CEIL, 2.5)
    for i in range(4):
        x0 = -8 + 2.5 * i
        box(f"GlassN{i}", x0 + 0.03, x0 + 2.47, 5.99, 6.01, FLOOR + 0.05, CEIL - 0.06, M["glass"], bevel=0, shadow=False)
    # Запад: объём входа из песчаника, изнутри — штукатурка.
    box("EntryBlock", -20, -14, -2, 8, FLOOR, SLAB + 0.2, M["sandstone"], bevel=0.01)
    box("WallW", -14.0, -13.97, -4, 6, FLOOR, CEIL, M["plaster"], bevel=0)
    box("WallWS", -14.3, -13.95, -4, -2, FLOOR, CEIL, M["concrete"], bevel=0)
    # Восток: перегородка с камином, за ней кухня.
    box("Partition", 4, 4.4, -2.6, 6, FLOOR, CEIL, M["ceiling"], bevel=0.005)
    box("Firebox", 3.9, 4.41, 0.4, 2.6, FLOOR + 0.35, FLOOR + 0.95, M["dark"], bevel=0)
    box("Hearth", 2.9, 4.0, -0.4, 3.4, FLOOR, FLOOR + 0.3, M["stone"], bevel=0.006)
    box("WallE", 9.85, 10, -4, 6, FLOOR, CEIL, M["plaster"], bevel=0)
    # Лестница на второй этаж: консольные ступени из стены.
    for k in range(13):
        z = FLOOR + 0.27 * (k + 1)
        box(f"Step{k}", -14, -12.9, 5.6 - 0.3 * (k + 1) - 0.3, 5.6 - 0.3 * (k + 1), z - 0.08, z, M["ceiling"], bevel=0.004)

    # Второй этаж: бетонный объём на консоли, ленточное окно на юг.
    X0, X1, Y0, Y1 = -6, 16, -6, 5
    box("UpBottom", X0, X1, Y0, Y1, SLAB, 5.0, M["concrete"], bevel=0.008)
    box("UpTop", X0, X1, Y0, Y1, 7.2, 7.9, M["concrete"], bevel=0.008)
    box("UpPierW", X0, -4.5, Y0, Y1, 5.0, 7.2, M["concrete"], bevel=0.008)
    box("UpPierE", 14.5, X1, Y0, Y1, 5.0, 7.2, M["concrete"], bevel=0.008)
    box("UpCore", -4.5, 14.5, -3.0, Y1, 5.0, 7.2, M["concrete"], bevel=0)
    box("UpBack", -4.5, 14.5, -3.05, -3.0, 5.0, 7.2, M["plaster"], bevel=0)
    box("UpFloor", -4.5, 14.5, Y0 + 0.3, -3.0, 5.0, 5.02, M["floor"], bevel=0)
    box("UpLed", -4.4, 14.4, -4.3, -4.25, 7.17, 7.2, M["led"], bevel=0)
    mullions(-4.5, 14.5, Y0 + 0.3, 5.0, 7.2, 3.8)
    box("UpGlass", -4.47, 14.47, Y0 + 0.29, Y0 + 0.31, 5.05, 7.14, M["glass"], bevel=0, shadow=False)
    # Мебель наверху, видна сквозь ленту окна.
    rounded("UpBed", 0.5, 2.6, -4.6, -3.1, 5.02, 5.5, M["linen"], r=0.06)
    place("pachira_aquatica_01", 10.5, -3.6, 5.02, 0.6, 1.0)
    place("ceramic_vase_03", 4.2, -3.4, 5.02, 0.0, 1.4)
    # Кровли: гравий, парапет, световой фонарь.
    box("RoofUp", X0 + 0.25, X1 - 0.25, Y0 + 0.25, Y1 - 0.25, 7.9, 7.93, M["gravel"], bevel=0)
    # Парапет без нахлёста в углах: совпавшие грани дают чёрное пятно.
    for (a, b, c, d) in ((X0, X1, Y0, Y0 + 0.25), (X0, X1, Y1 - 0.25, Y1), (X0, X0 + 0.25, Y0 + 0.25, Y1 - 0.25), (X1 - 0.25, X1, Y0 + 0.25, Y1 - 0.25)):
        box("Parapet", a, b, c, d, 7.9, 8.15, M["concrete"], bevel=0.004)
    box("Skylight", 3, 9, 0, 3, 7.93, 8.05, M["glass"], bevel=0, shadow=False)
    box("RoofLow", -15.2, X0, -5.4, 7.2, SLAB, SLAB + 0.03, M["gravel"], bevel=0)
    box("RoofDeck", 11.4, 11.6, -5.6, 7.4, SLAB, SLAB + 0.02, M["oak"], bevel=0)


def interior():
    box("Rug", -12.4, -7.6, -2.6, 1.2, FLOOR + 0.02, FLOOR + 0.035, M["rug"], bevel=0.003)
    # Диван: основание, спинка, подлокотники, подушки.
    sx0, sx1, sy = -12.0, -8.4, 1.0
    rounded("SofaBase", sx0, sx1, sy - 1.0, sy, FLOOR + 0.06, FLOOR + 0.38, M["linen"], r=0.03)
    rounded("SofaBack", sx0, sx1, sy - 0.25, sy, FLOOR + 0.38, FLOOR + 0.78, M["linen"], r=0.08)
    rounded("SofaArmL", sx0, sx0 + 0.24, sy - 1.0, sy - 0.25, FLOOR + 0.38, FLOOR + 0.62, M["linen"], r=0.06)
    rounded("SofaArmR", sx1 - 0.24, sx1, sy - 1.0, sy - 0.25, FLOOR + 0.38, FLOOR + 0.62, M["linen"], r=0.06)
    for k in range(2):
        a = sx0 + 0.25 + k * 1.56
        rounded(f"Seat{k}", a, a + 1.54, sy - 0.98, sy - 0.24, FLOOR + 0.38, FLOOR + 0.52, M["linen"], r=0.06)
    rounded("Pillow", sx0 + 0.4, sx0 + 0.9, sy - 0.42, sy - 0.26, FLOOR + 0.52, FLOOR + 0.92, M["cushion"], r=0.07)
    box("SofaShadowGap", sx0 + 0.05, sx1 - 0.05, sy - 0.95, sy - 0.05, FLOOR + 0.02, FLOOR + 0.06, M["frame"], bevel=0)
    # Журнальный стол: два блока камня.
    box("TableA", -11.0, -9.6, -1.6, -0.8, FLOOR + 0.035, FLOOR + 0.36, M["stone"], bevel=0.01)
    box("TableB", -9.5, -8.9, -1.9, -1.2, FLOOR + 0.035, FLOOR + 0.28, M["stone"], bevel=0.01)
    place("ceramic_vase_01", -10.5, -1.2, FLOOR + 0.36, 0.0, 1.0)
    place("mid_century_lounge_chair", -9.6, -2.9, FLOOR + 0.035, math.radians(150), 1.0)
    place("pachira_aquatica_01", -13.2, -3.2, FLOOR, 0.0, 1.1)
    # Обеденный стол из дуба и скамьи, над ним шары-светильники.
    box("DiningTop", -4.2, -0.4, 2.6, 3.6, FLOOR + 0.70, FLOOR + 0.75, M["oak"], bevel=0.004)
    box("DiningLegW", -3.9, -3.8, 2.75, 3.45, FLOOR, FLOOR + 0.70, M["oak"], bevel=0.003)
    box("DiningLegE", -0.8, -0.7, 2.75, 3.45, FLOOR, FLOOR + 0.70, M["oak"], bevel=0.003)
    box("BenchS", -4.0, -0.6, 2.05, 2.4, FLOOR + 0.42, FLOOR + 0.46, M["oak"], bevel=0.003)
    box("BenchN", -4.0, -0.6, 3.8, 4.15, FLOOR + 0.42, FLOOR + 0.46, M["oak"], bevel=0.003)
    for (y0, y1) in ((2.05, 2.4), (3.8, 4.15)):
        for x in (-3.8, -0.8):
            box("BenchLeg", x - 0.03, x + 0.03, y0 + 0.03, y1 - 0.03, FLOOR, FLOOR + 0.42, M["oak"], bevel=0)
    for x in (-3.0, -1.6):
        place("modern_ceiling_lamp_01", x, 3.1, CEIL - 1.2, 0.0, 1.0)
        bpy.data.lights.new(f"Bulb{x}", "POINT")
        lt = bpy.data.lights[f"Bulb{x}"]
        lt.energy = 25
        lt.color = (1.0, 0.82, 0.62)
        lt.shadow_soft_size = 0.08
        ob = link(bpy.data.objects.new(f"Bulb{x}", lt))
        ob.location = (x, 3.1, CEIL - 1.0)
    # Комод у северной стены, вазы.
    box("Credenza", -13.4, -9.8, 5.35, 5.85, FLOOR, FLOOR + 0.62, M["oak"], bevel=0.004)
    place("ceramic_vase_03", -12.6, 5.6, FLOOR + 0.62, 0.0, 1.0)
    place("ceramic_vase_01", -11.9, 5.62, FLOOR + 0.62, 0.0, 0.8)
    place("potted_plant_02", 1.2, 5.3, FLOOR, 0.3, 1.2)


def terrace_furniture():
    for x in (8.6, 11.4, 14.2):
        box(f"Lounger{x}", x - 0.36, x + 0.36, -15.6, -13.6, FLOOR, FLOOR + 0.26, M["oak"], bevel=0.006)
        rounded(f"LoungerPad{x}", x - 0.33, x + 0.33, -15.55, -14.1, FLOOR + 0.26, FLOOR + 0.33, M["linen"], r=0.03)
        rounded(f"LoungerBack{x}", x - 0.33, x + 0.33, -14.1, -13.62, FLOOR + 0.26, FLOOR + 0.62, M["linen"], r=0.04)
    # Под консолью — уличная гостиная.
    rounded("OutSofaBase", 12.2, 15.6, 1.6, 2.6, FLOOR, FLOOR + 0.38, M["linen"], r=0.03)
    rounded("OutSofaBack", 12.2, 15.6, 2.35, 2.6, FLOOR + 0.38, FLOOR + 0.78, M["linen"], r=0.07)
    box("OutTable", 13.2, 14.6, 0.1, 0.9, FLOOR, FLOOR + 0.32, M["stone"], bevel=0.01)
    place("mid_century_lounge_chair", 13.9, -1.6, FLOOR, math.radians(-20), 1.0)
    place("potted_plant_02", 11.9, 3.2, FLOOR, 0.0, 1.3)


def garden():
    # Двор за гостиной: дерево, стены из песчаника.
    box("CourtW", -14, -13.6, 6.1, 16, 0, 3.4, M["sandstone"], bevel=0.008)
    box("CourtE", 9.6, 10, 6.1, 16, 0, 3.4, M["sandstone"], bevel=0.008)
    box("CourtN", -14, 10, 15.6, 16, 0, 3.4, M["sandstone"], bevel=0.008)
    box("CourtGravel", -13.6, 9.6, 8, 15.6, 0, 0.04, M["gravel"], bevel=0)
    box("HoleW", -20.6, -14, 8, 16, -0.02, 0.0, M["lawn"], bevel=0)
    box("HoleE", 10, 20, 8, 16, -0.02, 0.0, M["lawn"], bevel=0)
    box("HoleS", -20.6, 20, -21.6, -20, -0.02, 0.0, M["lawn"], bevel=0)
    place("jacaranda_tree", -3.5, 11.5, 0.04, 0.4, 0.9)
    for (x, y, s) in ((-11, 13.5, 1.0), (6.5, 13, 0.9), (-7, 9.4, 0.7), (2, 9.2, 0.8)):
        place(rnd.choice(["shrub_02", "shrub_04"]), x, y, 0.04, rnd.uniform(0, 6.28), s)
    # Деревья в саду вокруг и кусты по краю террасы.
    for (x, y, s) in ((-28, -6, 1.0), (22, -24, 1.1), (28, 6, 1.2), (-34, 18, 1.0), (14, 26, 1.1), (-24, -28, 0.9), (34, -10, 1.0), (-30, -16, 0.9), (26, 18, 1.0), (-14, 30, 1.2), (4, 34, 1.0), (-40, 2, 1.1), (40, 30, 1.0), (16, -34, 0.9), (-10, -38, 1.0)):
        place("island_tree_02", x, y, 0, rnd.uniform(0, 6.28), s)
    for k in range(16):
        x = -19 + k * 2.5
        place(rnd.choice(["shrub_02", "shrub_04"]), x, -22.4 + rnd.uniform(-0.3, 0.3), 0, rnd.uniform(0, 6.28), rnd.uniform(0.8, 1.2))
    forest(0, 0, 70, 160, 70)


def forest(cx, cy, r0, r1, n):
    """Лес по горизонту: кольцо деревьев, чтобы край земли не читался."""
    for k in range(n):
        a = k / n * 6.283 + rnd.uniform(-0.03, 0.03)
        r = rnd.uniform(r0, r1)
        place(rnd.choice(["island_tree_02", "jacaranda_tree"]), cx + math.cos(a) * r, cy + math.sin(a) * r, 0, rnd.uniform(0, 6.28), rnd.uniform(1.2, 2.0))


# ───────────────────────── ещё два проекта для галереи ─────────────────────────

TOWER = (1000.0, 1000.0)
PAVILION = (-1000.0, 1000.0)


def tower():
    """Жилая башня: бетонные рёбра по всем фасадам, стеклянный холл, площадь."""
    cx, cy = TOWER
    b = lambda n, x0, x1, y0, y1, z0, z1, m, **k: box(n, cx + x0, cx + x1, cy + y0, cy + y1, z0, z1, m, **k)
    b("Plaza", -32, 32, -50, 32, 0, 0.15, M["stone"], bevel=0)
    b("Podium", -15, 15, -15, 15, 0.15, 0.6, M["sandstone"], bevel=0.01)
    b("Lobby", -10, 10, -10, 10, 0.6, 5.1, M["glass"], bevel=0, shadow=False)
    b("LobbyCore", -5, 5, -5, 5, 0.6, 5.1, M["sandstone"], bevel=0.005)
    for (x, y) in ((-7, -7), (7, -7), (-7, 7), (7, 7)):
        lt = bpy.data.lights.new("LobbyLamp", "POINT")
        lt.energy = 120
        lt.color = (1.0, 0.84, 0.66)
        o = link(bpy.data.objects.new("LobbyLamp", lt))
        o.location = (cx + x, cy + y, 4.4)
    floors, h, z0 = 18, 3.3, 5.1
    for k in range(floors + 1):
        z = z0 + k * h
        b(f"TSlab{k}", -12.6, 12.6, -12.6, 12.6, z - 0.32, z, M["concrete"], bevel=0.006)
        if k < floors:
            b(f"TGlass{k}", -11.2, 11.2, -11.2, 11.2, z, z + h - 0.32, M["glass_dark"], bevel=0, shadow=False)
            b(f"TCore{k}", -5.5, 5.5, -5.5, 5.5, z, z + h - 0.32, M["ceiling"], bevel=0)
            for (x0, x1, y0, y1) in ((-11, 11, -11, -10.94), (-11, 11, 10.94, 11), (-11, -10.94, -10.94, 10.94), (10.94, 11, -10.94, 10.94)):
                b(f"TLed{k}", x0, x1, y0, y1, z + h - 0.36, z + h - 0.33, M["led"], bevel=0)
    top = z0 + floors * h
    for i in range(17):
        t = -12 + i * 1.5
        for (x0, x1, y0, y1) in ((t - 0.08, t + 0.08, -12.6, -12.0), (t - 0.08, t + 0.08, 12.0, 12.6), (-12.6, -12.0, t - 0.08, t + 0.08), (12.0, 12.6, t - 0.08, t + 0.08)):
            b("Fin", x0, x1, y0, y1, z0 - 0.3, top + 3.0, M["concrete"], bevel=0.004)
    b("TRoof", -12, 12, -12, 12, top, top + 0.05, M["gravel"], bevel=0)
    # Площадь: аллея деревьев, канал воды, скамьи из камня.
    for k in range(5):
        for side in (-1, 1):
            place("island_tree_02", cx + side * 11, cy - 46 + k * 7, 0.15, rnd.uniform(0, 6.28), 0.55)
    for (x, y) in ((-24, 10), (24, 12), (-22, 26), (20, 26)):
        place("jacaranda_tree", cx + x, cy + y, 0.15, rnd.uniform(0, 6.28), 0.8)
    b("Channel", -2, 2, -48, -17, 0.05, 0.13, M["water"], bevel=0, shadow=False)
    b("ChannelBed", -2.1, 2.1, -48, -17, 0.0, 0.06, M["stone_dark"], bevel=0)
    for k in range(4):
        for side in (-1, 1):
            b(f"Bench{k}", side * 5 - 0.5, side * 5 + 0.5, -44 + k * 7, -40 + k * 7, 0.15, 0.6, M["stone"], bevel=0.01)
    forest(cx, cy, 90, 200, 80)


def pavilion():
    """Павильон в парке: тонкая кровля на стальных стойках, стекло, пруд."""
    cx, cy = PAVILION
    b = lambda n, x0, x1, y0, y1, z0, z1, m, **k: box(n, cx + x0, cx + x1, cy + y0, cy + y1, z0, z1, m, **k)
    b("PPlinth", -20, 20, -11, 11, 0, 0.3, M["stone"], bevel=0.01)
    b("PRoof", -18, 18, -9, 9, 4.0, 4.45, M["concrete"], bevel=0.01)
    b("PSoffit", -18, 18, -9, 9, 3.97, 4.0, M["oak_soffit"], bevel=0)
    b("PRoofTop", -17.8, 17.8, -8.8, 8.8, 4.45, 4.48, M["gravel"], bevel=0)
    for x in range(-15, 16, 6):
        for y in (-7.5, 7.5):
            b("PCol", x - 0.08, x + 0.08, y - 0.08, y + 0.08, 0.3, 3.97, M["frame"], bevel=0.003)
    for (x0, x1, y0, y1) in ((-12, 12, -5.01, -4.99), (-12, 12, 4.99, 5.01), (-12.01, -11.99, -5, 5), (11.99, 12.01, -5, 5)):
        b("PGlass", x0, x1, y0, y1, 0.3, 3.97, M["glass"], bevel=0, shadow=False)
    mullions(cx - 12, cx + 12, cy - 5, 0.3, 3.97, 3.0)
    mullions(cx - 12, cx + 12, cy + 5, 0.3, 3.97, 3.0)
    b("PFloor", -12, 12, -5, 5, 0.3, 0.32, M["floor"], bevel=0)
    b("PTable", -6, 2, -0.6, 0.6, 1.02, 1.07, M["oak"], bevel=0.004)
    b("PTableLeg", -5.6, -5.5, -0.5, 0.5, 0.32, 1.02, M["oak"], bevel=0)
    b("PTableLeg2", 1.5, 1.6, -0.5, 0.5, 0.32, 1.02, M["oak"], bevel=0)
    place("mid_century_lounge_chair", cx + 7, cy - 1.5, 0.32, math.radians(200), 1.0)
    place("mid_century_lounge_chair", cx + 9, cy - 0.5, 0.32, math.radians(160), 1.0)
    place("pachira_aquatica_01", cx - 10.5, cy + 3.5, 0.32, 0.0, 1.2)
    place("potted_plant_02", cx + 10.8, cy + 3.8, 0.32, 0.0, 1.2)
    # Пруд перед павильоном.
    b("PPondBed", -16, 16, -26, -13, 0.0, 0.02, M["stone_dark"], bevel=0)
    b("PPondWater", -16, 16, -26, -13, 0.02, 0.1, M["water"], bevel=0, shadow=False)
    b("PPondEdgeS", -16.3, 16.3, -26.3, -26, 0.0, 0.14, M["stone"], bevel=0.005)
    b("PPondEdgeN", -16.3, 16.3, -13, -12.7, 0.0, 0.14, M["stone"], bevel=0.005)
    b("PPondEdgeW", -16.3, -16, -26, -13, 0.0, 0.14, M["stone"], bevel=0.005)
    b("PPondEdgeE", 16, 16.3, -26, -13, 0.0, 0.14, M["stone"], bevel=0.005)
    for (x, y, sc) in ((-28, 6, 1.1), (26, -4, 1.0), (30, 14, 1.2), (-24, 20, 1.0), (4, 24, 1.1), (34, -22, 1.0)):
        place("island_tree_02", cx + x, cy + y, 0, rnd.uniform(0, 6.28), sc)
    forest(cx, cy, 70, 180, 70)


# ───────────────────────── небо ─────────────────────────

def sky():
    import numpy as np
    w = bpy.data.worlds.new("Sky")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    L = nt.links.new
    path = next((ASSETS / "hdri").glob("*.hdr"))
    img = bpy.data.images.load(str(path))
    # Где солнце на панораме: самый яркий пиксель.
    W, H = img.size
    px = np.empty(W * H * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    lum = px.reshape(-1, 4)[:, :3].sum(axis=1)
    i = int(lum.argmax())
    u, v = (i % W + 0.5) / W, (i // W + 0.5) / H
    psi_h = -(u - 0.5) * 2 * math.pi         # u = −atan2(y, x) / 2π + 0.5
    elev = (v - 0.5) * math.pi
    rz = psi_h - SUN_WANT
    print(f"солнце на панораме: азимут {math.degrees(psi_h):.0f}°, высота {math.degrees(elev):.0f}°, поворот {math.degrees(rz):.0f}°")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value[2] = rz
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = img
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 1.0
    out = nt.nodes.new("ShaderNodeOutputWorld")
    L(tc.outputs["Generated"], mp.inputs["Vector"])
    L(mp.outputs[0], env.inputs["Vector"])
    L(env.outputs[0], bg.inputs[0])
    L(bg.outputs[0], out.inputs[0])
    w.cycles.sampling_method = "MANUAL"
    w.cycles.sample_map_resolution = 2048
    # Порталы в проёмах: небо внутри считается быстрее и чище.
    for (name, loc, rot, sx, sy) in (
        ("PortalS", (-2, -4.15, 2.25), (math.pi / 2, 0, 0), 24, 3.6),
        ("PortalN", (-3, 6.15, 2.25), (-math.pi / 2, 0, 0), 10, 3.6),
    ):
        lt = bpy.data.lights.new(name, "AREA")
        lt.shape = "RECTANGLE"
        lt.size, lt.size_y = sx, sy
        lt.cycles.is_portal = True
        ob = link(bpy.data.objects.new(name, lt))
        ob.location = loc
        ob.rotation_euler = rot


# ───────────────────────── камера ─────────────────────────

# Пролёт: кадр, где камера, куда смотрит, фокусное (мм, по длинной стороне).
FLIGHT_KEYS = [
    (1, (-3.0, -7.0, 92.0), (-3.0, -5.0, 0.0), 30),
    (40, (-40.0, -58.0, 38.0), (-2.0, -2.0, 2.0), 30),
    (85, (-11.0, -20.0, 2.1), (-2.5, -3.0, 2.8), 26),
    (120, (-3.2, -13.0, 1.35), (-3.2, 0.0, 1.9), 24),
    (150, (-3.2, -4.3, 2.0), (-3.6, 6.0, 1.9), 22),
    (180, (-2.2, 0.2, 1.75), (-10.5, 2.6, 1.2), 20),
]
HERO_KEYS = [
    (1, (-15.0, -21.0, 1.75), (-2.0, -3.5, 3.1), 30),
    (HERO, (-9.5, -19.5, 1.75), (-0.8, -3.5, 3.1), 30),
]
# Ракурсы галереи: камера, цель, фокусное.
STILLS = [
    ((-3.0, -7.0, 92.0), (-3.0, -5.0, 0.0), 30),          # 1 генплан
    ((-11.0, -20.0, 2.1), (-2.5, -3.0, 2.8), 26),         # 2 фасад через бассейн
    ((-7.6, -1.8, 1.6), (-10.5, 4.0, 1.4), 22),           # 3 гостиная
    ((24.0, -18.0, 1.7), (12.0, -2.0, 5.0), 28),          # 4 консоль
    ((-1.0, 0.5, 1.7), (-3.5, 12.0, 3.2), 24),            # 5 двор сквозь стекло
    ((-36.0, -46.0, 24.0), (-1.0, -1.0, 2.5), 34),        # 6 облёт
    # башня
    ((1000 + 1.5, 1000 - 52, 1.6), (1000, 1000, 27.0), 18),         # 7 по оси канала
    ((1000 - 58, 1000 - 72, 46.0), (1000, 1000 - 6, 22.0), 30),     # 8 сверху
    ((1000 - 7, 1000 - 27, 1.7), (1000 + 3, 1000, 6.5), 24),        # 9 вход и канал
    # павильон
    ((-1000 - 3, 1000 - 31, 0.9), (-1000, 1000, 2.1), 26),         # 10 через пруд
    ((-1000 - 13, 1000 - 6.2, 1.7), (-1000 + 8, 1000 + 1.5, 2.2), 20),  # 11 под кровлей
    ((-1000 - 38, 1000 - 36, 15.0), (-1000 + 2, 1000 - 4, 1.5), 30),  # 12 сверху
]


def camera(shot, vertical):
    sc = bpy.context.scene
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.sensor_width = 36
    cam_data.sensor_fit = "AUTO"
    cam_data.clip_start = 0.05
    cam_data.clip_end = 4000
    cam = link(bpy.data.objects.new("Cam", cam_data))
    sc.camera = cam
    tgt = link(bpy.data.objects.new("Target", None))
    tr = cam.constraints.new("TRACK_TO")
    tr.target = tgt
    tr.track_axis = "TRACK_NEGATIVE_Z"
    tr.up_axis = "UP_Y"
    # Вертикальный кадр: то же фокусное по длинной стороне сужает обзор вбок,
    # поэтому шире на треть.
    k = 0.66 if vertical else 1.0
    keys = FLIGHT_KEYS if shot == "flight" else HERO_KEYS
    if shot == "stills":
        return cam, tgt
    for f, c, t, lens in keys:
        cam.location = c
        tgt.location = t
        cam_data.lens = lens * k
        cam.keyframe_insert("location", frame=f)
        tgt.keyframe_insert("location", frame=f)
        cam_data.keyframe_insert("lens", frame=f)
    for ob in (cam, tgt, cam_data):
        ad = ob.animation_data
        for fc in ad.action.fcurves if ad and ad.action else []:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"
    if shot == "hero":
        for ob in (cam, tgt):
            for fc in ob.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"
    return cam, tgt


def set_still(cam, tgt, i, vertical):
    c, t, lens = STILLS[i - 1]
    cam.location = c
    tgt.location = t
    cam.data.lens = lens * (0.66 if vertical else 1.0)
    bpy.context.scene.view_settings.exposure = {3: 1.2, 5: 1.0}.get(i, 0.0)


# ───────────────────────── рендер ─────────────────────────

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
    sc.render.film_transparent = False
    if args.vertical:
        sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
    else:
        sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    if args.shot == "stills":
        sc.render.resolution_x = int(sc.render.resolution_x * 4 / 3)
        sc.render.resolution_y = int(sc.render.resolution_y * 4 / 3)
    sc.render.resolution_percentage = args.percent
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_depth = "8"
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
    sc.view_settings.exposure = 0.0
    sc.render.fps = 24
    if args.shot == "flight":
        # Как у камеры: внутри дома экспозиция поднимается.
        for f, ev in ((1, 0.0), (125, 0.0), (150, 0.8), (165, 1.2), (180, 1.2)):
            sc.view_settings.exposure = ev
            sc.view_settings.keyframe_insert("exposure", frame=f)


def main():
    global ASSETS
    args = parse_args()
    ASSETS = Path(args.assets)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    import time
    t0 = time.time()
    build_materials()
    site()
    villa()
    interior()
    terrace_furniture()
    garden()
    if args.shot == "stills":
        tower()
        pavilion()
    sky()
    cam, tgt = camera(args.shot, args.vertical)
    setup_render(args)
    print(f"сцена собрана за {time.time() - t0:.0f} с: объектов {len(bpy.data.objects)}", flush=True)
    sc = bpy.context.scene
    if args.save:
        bpy.ops.wm.save_as_mainfile(filepath=args.save)
    if not args.out:
        return
    total = FLIGHT if args.shot == "flight" else HERO if args.shot == "hero" else len(STILLS)
    frames = [int(x) for x in args.frames.split(",") if x] if args.frames else list(range(args.start, (args.end or total) + 1, args.step))
    for f in frames:
        t = time.time()
        if args.shot == "stills":
            set_still(cam, tgt, f, args.vertical)
            sc.frame_set(1)
        else:
            sc.frame_set(f)
        sc.render.filepath = f"{args.out}{f:04d}.png"
        bpy.ops.render.render(write_still=True)
        print(f"Saved {f:04d}: {time.time() - t:.0f} с", flush=True)


if __name__ == "__main__":
    main()
