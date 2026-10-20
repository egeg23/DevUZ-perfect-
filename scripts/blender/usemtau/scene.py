"""Кадры для макета Юсем Тау, только кодом, в Blender 4.5 (Cycles).

  aisle   — проход металлобазы: по сторонам пакеты арматуры, балок, швеллера,
            труб и профильной трубы на прокладках, сверху рамы и полосы
            света, синяя кран-балка; камера низко, вдоль прохода, глубина
            резкости. Горизонтальный и вертикальный кадр.
  product — студийный снимок одного вида проката на тёмном фоне: торцы
            пакета под углом, жёсткий свет сбоку. --kind armatura|balka|…

Сечения — по ГОСТ (арматура d16, балка 30Ш1, швеллер 16П, труба 108×4,
профильная 80×80×4, уголок 63×5, лист 8 мм). Это визуализация, не их
склад: на макете так и подписано.

    blender -b --factory-startup -P scripts/blender/usemtau/scene.py -- \\
      --assets /tmp/ph-usemtau --shot aisle --out /tmp/u/aisle.png --percent 50 --samples 32
"""
import argparse
import math
import random
import sys

import bpy
import bmesh
from mathutils import Vector


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--assets", required=True)
    ap.add_argument("--shot", default="aisle")
    ap.add_argument("--kind", default="armatura")
    ap.add_argument("--out", required=True)
    ap.add_argument("--vertical", action="store_true")
    ap.add_argument("--percent", type=int, default=100)
    ap.add_argument("--samples", type=int, default=64)
    ap.add_argument("--size", type=int, default=0)
    return ap.parse_args(argv)


A = parse_args()
EXPOSURE = -0.6 if A.shot == "aisle" else 0.0
rnd = random.Random(7)

# ── Сцена ────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


def link(ob):
    sc.collection.objects.link(ob)
    return ob


def mesh_obj(name, bm, mat):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = False
    return link(bpy.data.objects.new(name, me))


# ── Материалы ────────────────────────────────────────────────────────────
def node_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links


def steel(name, base=(0.23, 0.25, 0.28), rough=0.42, scale_tint=0.0):
    """Горячекатаная сталь: тёмная окалина с пятнами, металл."""
    m, n, l = node_mat(name)
    bs = n["Principled BSDF"]
    bs.inputs["Metallic"].default_value = 1.0
    tc = n.new("ShaderNodeTexCoord")
    noise = n.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    noise.inputs["Detail"].default_value = 9.0
    l.new(tc.outputs["Object"], noise.inputs["Vector"])
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*[c * 0.7 for c in base], 1)
    ramp.color_ramp.elements[1].color = (*[min(1, c * 1.35 + scale_tint) for c in base], 1)
    l.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    l.new(ramp.outputs["Color"], bs.inputs["Base Color"])
    rr = n.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = rough - 0.12
    rr.inputs["To Max"].default_value = rough + 0.15
    l.new(noise.outputs["Fac"], rr.inputs["Value"])
    l.new(rr.outputs["Result"], bs.inputs["Roughness"])
    return m


def ribbed(name, base=(0.15, 0.16, 0.18)):
    """Арматура: та же окалина и поперечные рёбра бампом вдоль стержня."""
    m = steel(name, base=base, rough=0.5)
    n, l = m.node_tree.nodes, m.node_tree.links
    tc = n.new("ShaderNodeTexCoord")
    wave = n.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "Y"
    wave.inputs["Scale"].default_value = 90.0
    wave.inputs["Distortion"].default_value = 0.0
    l.new(tc.outputs["Object"], wave.inputs["Vector"])
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.6
    bump.inputs["Distance"].default_value = 0.002
    l.new(wave.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], n["Principled BSDF"].inputs["Normal"])
    return m


def flat(name, color, rough=0.6, metal=0.0, emit=0.0):
    m, n, _ = node_mat(name)
    bs = n["Principled BSDF"]
    bs.inputs["Base Color"].default_value = (*color, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    if emit:
        bs.inputs["Emission Color"].default_value = (*color, 1)
        bs.inputs["Emission Strength"].default_value = emit
    return m


def textured(name, folder, scale=1.0, tint=None):
    m, n, l = node_mat(name)
    bs = n["Principled BSDF"]
    tc = n.new("ShaderNodeTexCoord")
    mp = n.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale)
    l.new(tc.outputs["UV"], mp.inputs["Vector"])

    def img(fn, color):
        t = n.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(f"{folder}/{fn}.jpg")
        t.image.colorspace_settings.name = "sRGB" if color else "Non-Color"
        l.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t

    d = img("diff", True)
    if tint:
        mix = n.new("ShaderNodeMixRGB")
        mix.blend_type = "MULTIPLY"
        mix.inputs["Fac"].default_value = 1.0
        mix.inputs["Color2"].default_value = (*tint, 1)
        l.new(d.outputs["Color"], mix.inputs["Color1"])
        l.new(mix.outputs["Color"], bs.inputs["Base Color"])
    else:
        l.new(d.outputs["Color"], bs.inputs["Base Color"])
    l.new(img("rough", False).outputs["Color"], bs.inputs["Roughness"])
    nm = n.new("ShaderNodeNormalMap")
    l.new(img("nor_gl", False).outputs["Color"], nm.inputs["Color"])
    l.new(nm.outputs["Normal"], bs.inputs["Normal"])
    return m


MAT = {
    "steel": steel("steel", base=(0.15, 0.16, 0.18), rough=0.46),
    "rebar": ribbed("rebar"),
    "steel2": steel("steel2", base=(0.2, 0.21, 0.23), rough=0.4),
    "pipe": steel("pipe", base=(0.24, 0.25, 0.27), rough=0.34),
    "galv": steel("galv", base=(0.62, 0.64, 0.66), rough=0.28),
    "dark": flat("dark", (0.004, 0.004, 0.005), 0.9),
    "wood": flat("wood", (0.33, 0.22, 0.13), 0.75),
    "blue": flat("blue", (0.02, 0.18, 0.62), 0.45),
    "paint": flat("paint", (0.02, 0.2, 0.75), 0.55),
    "orange": flat("orange", (0.85, 0.22, 0.03), 0.5),
    "frame": steel("frame", base=(0.42, 0.44, 0.47), rough=0.45),
    "rack": flat("rack", (0.03, 0.09, 0.28), 0.5, 0.3),
    "roof": flat("roof", (0.12, 0.13, 0.14), 0.7, 0.4),
    "lamp": flat("lamp", (1.0, 0.96, 0.9), 0.5, 0.0, emit=22.0),
}


# ── Геометрия ────────────────────────────────────────────────────────────
def prism(name, profile, length, mat, holes=None, at=(0, 0, 0)):
    """Профиль в плоскости XZ (метры) вытянут вдоль +Y на length."""
    bm = bmesh.new()

    def ring(pts, y):
        return [bm.verts.new((at[0] + x, at[1] + y, at[2] + z)) for x, z in pts]

    loops = [profile] + (holes or [])
    a = [ring(p, 0) for p in loops]
    b = [ring(p, length) for p in loops]
    for la, lb in zip(a, b):
        n = len(la)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((la[i], la[j], lb[j], lb[i]))
    if not holes:
        bm.faces.new(a[0][::-1])
        bm.faces.new(b[0])
    else:
        # торец с отверстием: мост между внешним и внутренним контуром
        for la, lb_ in ((a, False), (b, True)):
            outer, inner = la[0], la[1]
            n = len(outer)
            for i in range(n):
                j = (i + 1) % n
                f = (outer[i], outer[j], inner[j], inner[i])
                bm.faces.new(f if lb_ else f[::-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, mat)


def circle(r, n=20, cx=0.0, cz=0.0):
    return [(cx + r * math.cos(2 * math.pi * i / n), cz + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def rect(w, h, cx=0.0, cz=0.0):
    return [(cx - w / 2, cz - h / 2), (cx + w / 2, cz - h / 2), (cx + w / 2, cz + h / 2), (cx - w / 2, cz + h / 2)]


def ibeam(h, b, tw, tf):
    x, z = b / 2, h / 2
    return [(-x, -z), (x, -z), (x, -z + tf), (tw / 2, -z + tf), (tw / 2, z - tf), (x, z - tf), (x, z), (-x, z), (-x, z - tf), (-tw / 2, z - tf), (-tw / 2, -z + tf), (-x, -z + tf)]


def channel(h, b, tw, tf):
    z = h / 2
    return [(0, -z), (b, -z), (b, -z + tf), (tw, -z + tf), (tw, z - tf), (b, z - tf), (b, z), (0, z)]


def angle(b, t):
    return [(0, 0), (b, 0), (b, t), (t, t), (t, b), (0, b)]


def bundle(kind, x0, z0, y0, length, cols, rows, paint=None, jitter=True):
    """Пакет проката: cols × rows штук, торцами к камере (y0)."""
    obs = []
    kind_rebar = kind == "armatura"
    if kind == "krug":
        kind = "armatura"
    if kind == "armatura":
        r, step = 0.008, 0.0172
        for i in range(cols):
            for j in range(rows):
                off = step / 2 if j % 2 else 0
                cx, cz = x0 + i * step + off, z0 + j * step * 0.87
                dy = rnd.uniform(-0.04, 0.04) if jitter else 0
                obs.append(prism("rebar", circle(r, 10, cx, cz), length, MAT["rebar"] if kind_rebar else MAT["steel2"], at=(0, y0 + dy, 0)))
                if paint and rnd.random() < 0.9:
                    obs.append(prism("mark", circle(r * 1.02, 10, cx, cz), 0.006, MAT[paint], at=(0, y0 + dy - 0.004, 0)))
    elif kind == "truba":
        R, t = 0.054, 0.004
        for i in range(cols):
            for j in range(rows):
                off = R if j % 2 else 0
                cx, cz = x0 + i * 2.02 * R + off, z0 + R + j * 2 * R * 0.87
                dy = rnd.uniform(-0.06, 0.06) if jitter else 0
                obs.append(prism("pipe", circle(R, 28, cx, cz), length, MAT["pipe"], holes=[circle(R - t, 28, cx, cz)], at=(0, y0 + dy, 0)))
    elif kind == "profil":
        a, t = 0.08, 0.004
        for i in range(cols):
            for j in range(rows):
                cx, cz = x0 + a / 2 + i * (a + 0.004), z0 + a / 2 + j * (a + 0.002)
                dy = rnd.uniform(-0.05, 0.05) if jitter else 0
                obs.append(prism("rhs", rect(a, a, cx, cz), length, MAT["steel2"], holes=[rect(a - 2 * t, a - 2 * t, cx, cz)], at=(0, y0 + dy, 0)))
    elif kind == "balka":
        h, b = 0.29, 0.2
        for i in range(cols):
            for j in range(rows):
                cx, cz = x0 + b / 2 + i * (b + 0.01), z0 + h / 2 + j * (h + 0.005)
                prof = [(cx + px, cz + pz) for px, pz in ibeam(h, b, 0.008, 0.011)]
                obs.append(prism("beam", prof, length, MAT["steel"], at=(0, y0 + (rnd.uniform(-0.08, 0.08) if jitter else 0), 0)))
    elif kind == "shveller":
        h, b = 0.16, 0.064
        for i in range(cols):
            for j in range(rows):
                cx, cz = x0 + i * (b + 0.006), z0 + h / 2 + j * (h + 0.004)
                prof = [(cx + px, cz + pz) for px, pz in channel(h, b, 0.005, 0.0084)]
                obs.append(prism("chan", prof, length, MAT["steel2"], at=(0, y0 + (rnd.uniform(-0.06, 0.06) if jitter else 0), 0)))
    elif kind == "ugolok":
        b, t = 0.063, 0.005
        for i in range(cols):
            for j in range(rows):
                cx, cz = x0 + i * (b + 0.004), z0 + j * (b + 0.002)
                prof = [(cx + px, cz + pz) for px, pz in angle(b, t)]
                obs.append(prism("ang", prof, length, MAT["steel"], at=(0, y0 + (rnd.uniform(-0.05, 0.05) if jitter else 0), 0)))
    elif kind == "list":
        for j in range(rows):
            obs.append(prism("plate", rect(1.5, 0.008, x0 + 0.75 + rnd.uniform(-0.01, 0.01), z0 + 0.004 + j * 0.0085), length, MAT["galv" if paint == "galv" else "steel2"], at=(0, y0 + rnd.uniform(-0.01, 0.01), 0)))
    return obs


def sleepers(x0, x1, y0, length, z=0.0, every=2.5):
    y = y0 + 0.3
    while y < y0 + length:
        prism("sleeper", rect(x1 - x0 + 0.1, 0.08, (x0 + x1) / 2, z + 0.04), 0.1, MAT["wood"], at=(0, y, 0))
        y += every


# ── Свет и мир ───────────────────────────────────────────────────────────
def world(strength=0.35):
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    n, l = w.node_tree.nodes, w.node_tree.links
    env = n.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(f"{A.assets}/hdri/empty_warehouse_01.hdr")
    bg = n["Background"]
    bg.inputs["Strength"].default_value = strength
    l.new(env.outputs["Color"], bg.inputs["Color"])


def area(loc, rot, size, energy, color=(1, 0.97, 0.92), shape="RECTANGLE", sy=None):
    d = bpy.data.lights.new("a", "AREA")
    d.energy = energy
    d.color = color
    d.shape = shape
    d.size = size
    if sy:
        d.size_y = sy
    ob = link(bpy.data.objects.new("a", d))
    ob.location = loc
    ob.rotation_euler = rot
    return ob


def camera(loc, look, lens, focus=None, fstop=2.8, vertical=False):
    cd = bpy.data.cameras.new("cam")
    cd.lens = lens
    cd.sensor_width = 36
    if focus:
        cd.dof.use_dof = True
        cd.dof.focus_distance = focus
        cd.dof.aperture_fstop = fstop
    ob = link(bpy.data.objects.new("cam", cd))
    ob.location = loc
    dvec = Vector(look) - Vector(loc)
    ob.rotation_euler = dvec.to_track_quat("-Z", "Y").to_euler()
    sc.camera = ob
    return ob


def render(w, h):
    sc.render.engine = "CYCLES"
    cy = sc.cycles
    cy.device = "CPU"
    cy.samples = A.samples
    cy.use_adaptive_sampling = True
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.max_bounces = 6
    cy.glossy_bounces = 4
    cy.transparent_max_bounces = 2
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = A.percent
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
    sc.view_settings.exposure = EXPOSURE
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = A.out
    bpy.ops.render.render(write_still=True)


# ── Проход склада ────────────────────────────────────────────────────────
WIDTH = {"armatura": 0.0172, "truba": 0.109, "shveller": 0.07, "profil": 0.084, "balka": 0.21, "ugolok": 0.067, "list": 1.5}


def rack(side, y0, L, tiers):
    """Консольный стеллаж: стойки с консолями, на каждом ярусе пакет."""
    x_post = side * 3.6
    for yy in (y0 + 0.6, y0 + L / 2, y0 + L - 0.6):
        prism("post", [(x_post + px, pz) for px, pz in rect(0.16, 3.6, 0, 1.8)], 0.16, MAT["rack"], at=(0, yy, 0))
        for z in (0.05, 1.25, 2.45):
            x0, x1 = (1.2, 3.6) if side > 0 else (-3.6, -1.2)
            prism("arm", rect(x1 - x0, 0.1, (x0 + x1) / 2, z + 0.05), 0.1, MAT["rack"], at=(0, yy + 0.03, 0))
    for (kind, c, r, paint), z in zip(tiers, (0.1, 1.3, 2.5)):
        width = c * WIDTH[kind] if kind != "list" else 1.5
        xs = 1.3 if side > 0 else -1.3 - width
        bundle(kind, xs, z, y0 + rnd.uniform(-0.15, 0.15), L, c, r, paint)


def aisle():
    world(0.18)
    floor = bpy.data.meshes.new("floor")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=60)
    bm.to_mesh(floor)
    bm.free()
    floor.uv_layers.new()
    for poly in floor.polygons:
        for li in poly.loop_indices:
            v = floor.vertices[floor.loops[li].vertex_index].co
            floor.uv_layers[0].data[li].uv = (v.x / 4, v.y / 4)
    cm = textured("concrete", f"{A.assets}/tex/concrete_floor_worn_001", 1.0, tint=(0.34, 0.34, 0.36))
    cm.node_tree.nodes["Principled BSDF"].inputs["Specular IOR Level"].default_value = 0.7
    floor.materials.append(cm)
    fo = link(bpy.data.objects.new("floor", floor))
    fo.location = (0, 30, 0)

    L = 11.7
    left = [
        [("armatura", 40, 10, "paint"), ("armatura", 36, 8, None), ("truba", 9, 4, None)],
        [("profil", 12, 5, None), ("shveller", 14, 4, None), ("armatura", 34, 8, "paint")],
        [("truba", 10, 5, None), ("profil", 12, 4, None), ("ugolok", 16, 5, None)],
        [("armatura", 40, 10, "paint"), ("shveller", 12, 4, None), ("truba", 9, 4, None)],
        [("balka", 5, 2, None), ("profil", 12, 4, None), ("armatura", 30, 8, None)],
    ]
    right = [
        [("balka", 6, 2, None), ("balka", 5, 2, None), ("shveller", 14, 4, None)],
        [("list", 1, 24, "galv"), ("armatura", 38, 9, "paint"), ("ugolok", 16, 5, None)],
        [("armatura", 40, 10, "paint"), ("truba", 9, 4, None), ("profil", 12, 4, None)],
        [("shveller", 14, 4, None), ("balka", 5, 2, None), ("armatura", 30, 8, None)],
        [("truba", 10, 5, None), ("armatura", 36, 9, "paint"), ("profil", 12, 4, None)],
    ]
    for k in range(5):
        y0 = 0.8 + k * (L + 1.2)
        rack(-1, y0, L, left[k])
        rack(1, y0, L, right[k])

    # цех: колонны, ригели, стены из профлиста, полоса окон, кровля
    wall = steel("cladding", base=(0.16, 0.17, 0.19), rough=0.55)
    for xx in (-1.05, 1.05):
        prism("lane", rect(0.1, 0.004, xx, 0.002), 76, flat("lanec", (0.75, 0.55, 0.04), 0.6), at=(0, -2, 0))
    for f in range(13):
        y = f * 6
        for xx in (-8.5, 8.5):
            prism("colv", rect(0.35, 10.0, xx, 5.0), 0.45, MAT["frame"], at=(0, y, 0))
        prism("rafter", rect(17.4, 0.7, 0, 9.6), 0.3, MAT["frame"], at=(0, y, 0))
    for xx in (-9.0, 9.0):
        prism("wall", rect(0.15, 6.5, xx, 3.25), 80, wall, at=(0, -3, 0))
        prism("win", rect(0.1, 1.4, xx * 0.995, 7.4), 80, flat("sky", (0.75, 0.85, 1.0), 0.5, 0, emit=3.0), at=(0, -3, 0))
        prism("wall2", rect(0.15, 2.0, xx, 9.2), 80, wall, at=(0, -3, 0))
    for xx in (-3.5, 3.5):
        prism("lamp", rect(0.3, 0.05, xx, 9.15), 74, MAT["lamp"], at=(0, -2, 0))
    prism("roof", rect(19, 0.1, 0, 10.2), 80, MAT["roof"], at=(0, -3, 0))
    # кран-балка их синего цвета
    prism("crane", rect(17.0, 0.8, 0, 8.4), 0.6, MAT["blue"], at=(0, 17, 0))
    prism("crane2", rect(17.0, 0.8, 0, 8.4), 0.6, MAT["blue"], at=(0, 18.6, 0))
    prism("hoist", rect(1.1, 0.7, -1.2, 7.7), 2.2, MAT["orange"], at=(0, 17.05, 0))
    prism("hook", rect(0.04, 3.2, -1.2, 5.8), 0.04, MAT["dark"], at=(0, 18.1, 0))
    # дальний проём ворот: дневной свет
    prism("gate", rect(6.5, 6.5, 0, 3.25), 0.1, flat("gatel", (1.0, 0.97, 0.92), 0.5, 0, emit=14.0), at=(0, 74, 0))
    # дымка в цехе: свет ложится лучами
    vol = bpy.data.materials.new("haze")
    vol.use_nodes = True
    nn = vol.node_tree.nodes
    nn.remove(nn["Principled BSDF"])
    pv = nn.new("ShaderNodeVolumePrincipled")
    pv.inputs["Density"].default_value = 0.02
    pv.inputs["Anisotropy"].default_value = 0.55
    vol.node_tree.links.new(pv.outputs["Volume"], nn["Material Output"].inputs["Volume"])
    prism("haze", rect(17, 10, 0, 5), 80, vol, at=(0, -3, 0))

    # дневной свет через окна: узкие лучи наискось
    for y in range(4, 70, 9):
        area((-8.7, y, 7.4), (math.radians(50), math.radians(-35), 0), 1.2, 900, color=(0.85, 0.92, 1.0), sy=1.2)
    area((0, 12, 9.0), (0, 0, 0), 3, 1600, sy=24)
    area((0, 40, 9.0), (0, 0, 0), 3, 1400, sy=24)
    if A.vertical:
        camera((-0.55, -0.6, 0.95), (0.1, 30, 1.9), 20, focus=4.0, fstop=2.4)
        render(1080, 1920)
    else:
        camera((-0.35, -1.0, 0.9), (0.25, 30, 1.7), 24, focus=5.0, fstop=2.2)
        render(1920, 1080)


# ── Студийный снимок проката ────────────────────────────────────────────
def product(kind):
    world(0.08)
    paper = flat("paper", (0.52, 0.5, 0.47), 0.85)
    prism("back", rect(30, 30, 0, 0), 0.1, paper, at=(0, 6, 0))
    prism("ground", rect(30, 0.1, 0, -0.05), 20, paper, at=(0, -14, 0))
    L = 3.0
    spec = {
        "armatura": ("armatura", 16, 9, "paint"), "truba": ("truba", 4, 3, None), "profil": ("profil", 4, 3, None),
        "balka": ("balka", 2, 2, None), "shveller": ("shveller", 5, 3, None), "ugolok": ("ugolok", 6, 4, None), "list": ("list", 1, 22, "galv"),
        "krug": ("krug", 14, 8, None),
    }[kind]
    obs = bundle(spec[0], 0, 0, -L / 2, L, spec[1], spec[2], spec[3], jitter=True)
    # центрируем пакет
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for ob in obs:
        for v in ob.data.vertices:
            for i in range(3):
                mn[i] = min(mn[i], v.co[i])
                mx[i] = max(mx[i], v.co[i])
    c = (mn + mx) / 2
    for ob in obs:
        ob.location.x -= c.x
        ob.location.z -= mn.z
    size = max(mx.x - mn.x, mx.z - mn.z)
    # ключ сбоку, контровой синий, мягкий сверху
    e = -L / 2
    h = mx.z - mn.z
    d = 2.6 * size + 0.25
    area((-1.4 * size - 0.3, e - 1.1 * size - 0.2, 0.8 * size + 0.1), (math.radians(70), 0, math.radians(-50)), size * 1.4 + 0.2, 150 * size + 25, color=(1, 0.97, 0.93))
    area((1.3 * size + 0.3, e + 0.4, 0.7 * size + 0.1), (math.radians(80), 0, math.radians(75)), size + 0.2, 60 * size + 10, color=(0.55, 0.7, 1.0))
    area((0, e + 0.8, 2.0 * size + 0.6), (0, 0, 0), size * 3 + 0.6, 90 * size + 30)
    camera((0.62 * d, e - 0.78 * d, h * 0.55 + 0.35 * d), (0, e + 0.35 * d, h * 0.45), 60, focus=d * 1.05, fstop=2.8)
    s = A.size or 1200
    render(s, s)


if A.shot == "aisle":
    aisle()
else:
    product(A.kind)
