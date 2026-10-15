"""Вечерняя студия DevUz: пролёт по офису, вылет в окно, разгон к солнцу, логотип.

Вся сцена — кодом: геометрия, материалы (узлы), свет, камера, анимация,
пылинки, логотип из public/brand/logo-square-alpha.svg. Руками в Blender
ничего не делается.

    python3 scripts/blender/devuz-studio/screens.py /tmp/screens
    blender -b -P scripts/blender/devuz-studio/scene.py -- \\
        --screens /tmp/screens --out /tmp/frames/f_ --start 1 --end 420

Blender — 4.5 LTS (см. README.md рядом). Ролик: 30 к/с, 420 кадров (14 с).
  0–6,5 с    пролёт между столами с мониторами
  6,5–9 с    разворот к окну, вылет в открытую створку
  9–12 с     разгон к солнцу, угол шире, свет до белого
  12–14 с    из света — логотип и devuz.studio
"""

import argparse
import math
import random
import re
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
LOGO_SVG = ROOT / "public" / "brand" / "logo-square-alpha.svg"

FPS = 30
FRAMES = 420
SEQ_FRAMES = 600              # кадров в каждой последовательности экрана
CUT = 361                     # первый кадр логотипа (12,0 с)

SUN_AZ = math.radians(-25)    # от +Y к −X: лучи косо через окна
SUN_EL = math.radians(7)
SUN_DIR = Vector((math.sin(SUN_AZ) * math.cos(SUN_EL), math.cos(SUN_AZ) * math.cos(SUN_EL), math.sin(SUN_EL)))
WINDOW = Vector((3.0, 6.1, 1.75))         # середина открытой створки
SUN_POS = WINDOW + SUN_DIR * 3000
SUN_R = 140
LOGO_AT = Vector((0.0, 0.0, -3000.0))     # отдельная «комната» логотипа под землёй
GROUND_Z = -32.0

rnd = random.Random(20261015)


# ───────────────────────── аргументы ─────────────────────────

def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--screens", required=True, help="папка с seq_N из screens.py")
    ap.add_argument("--out", default="", help="префикс кадров, например /tmp/frames/f_")
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--end", type=int, default=FRAMES)
    ap.add_argument("--frames", default="", help="отдельные кадры через запятую (пробы)")
    ap.add_argument("--step", type=int, default=1, help="каждый N-й кадр (задачи Actions идут через один)")
    ap.add_argument("--samples", type=int, default=32)
    ap.add_argument("--percent", type=int, default=100, help="процент разрешения")
    ap.add_argument("--vertical", action="store_true", help="1080×1920 вместо 1920×1080")
    ap.add_argument("--save", default="", help="сохранить .blend")
    return ap.parse_args(argv)


# ───────────────────────── цвета и материалы ─────────────────────────

def lin(c):
    """sRGB 0..1 → линейный."""
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexc(h, a=1.0):
    h = h.lstrip("#")
    return (lin(int(h[0:2], 16) / 255), lin(int(h[2:4], 16) / 255), lin(int(h[4:6], 16) / 255), a)


def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    return m, nt, out


def principled(name, color, rough=0.5, metal=0.0, emit=None, strength=0.0, coat=0.0, sheen=0.0, sss=0.0):
    m, nt, out = new_mat(name)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = color if len(color) == 4 else (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit is not None:
        b.inputs["Emission Color"].default_value = emit if len(emit) == 4 else (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    if sheen:
        b.inputs["Sheen Weight"].default_value = sheen
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
    nt.links.new(b.outputs[0], out.inputs[0])
    return m


def obj_coords(nt):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    return tc.outputs["Object"]


def mat_wood_floor():
    m, nt, out = new_mat("Floor")
    L = nt.links.new
    co = obj_coords(nt)
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.offset = 0.37
    brick.inputs["Color1"].default_value = hexc("#8A5A34")
    brick.inputs["Color2"].default_value = hexc("#6E4426")
    brick.inputs["Mortar"].default_value = hexc("#2A1A10")
    brick.inputs["Scale"].default_value = 1.0
    brick.inputs["Mortar Size"].default_value = 0.004
    brick.inputs["Brick Width"].default_value = 1.6
    brick.inputs["Row Height"].default_value = 0.19
    L(co, brick.inputs["Vector"])
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "Y"
    wave.inputs["Scale"].default_value = 9
    wave.inputs["Distortion"].default_value = 9
    wave.inputs["Detail"].default_value = 3
    L(co, wave.inputs["Vector"])
    grain = nt.nodes.new("ShaderNodeMix")
    grain.data_type = "RGBA"
    grain.blend_type = "MULTIPLY"
    grain.inputs["Factor"].default_value = 0.22
    L(brick.outputs["Color"], grain.inputs[6])
    L(wave.outputs["Color"], grain.inputs[7])
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3
    L(co, noise.inputs["Vector"])
    rough = nt.nodes.new("ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = 0.28
    rough.inputs["To Max"].default_value = 0.5
    L(noise.outputs["Fac"], rough.inputs["Value"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.002
    L(brick.outputs["Fac"], bump.inputs["Height"])
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    L(grain.outputs[2], b.inputs["Base Color"])
    L(rough.outputs[0], b.inputs["Roughness"])
    L(bump.outputs[0], b.inputs["Normal"])
    L(b.outputs[0], out.inputs[0])
    return m


def mat_brick():
    m, nt, out = new_mat("Brick")
    L = nt.links.new
    co = obj_coords(nt)
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(co, sep.inputs[0])
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    # Стена кирпича стоит в плоскости YZ (x = 8): по горизонтали — y.
    L(sep.outputs["Y"], comb.inputs["X"])
    L(sep.outputs["Z"], comb.inputs["Y"])
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.offset = 0.5
    brick.inputs["Color1"].default_value = hexc("#8C4A33")
    brick.inputs["Color2"].default_value = hexc("#6B3424")
    brick.inputs["Mortar"].default_value = hexc("#9C9282")
    brick.inputs["Scale"].default_value = 1.0
    brick.inputs["Mortar Size"].default_value = 0.011
    brick.inputs["Brick Width"].default_value = 0.25
    brick.inputs["Row Height"].default_value = 0.075
    brick.inputs["Bias"].default_value = -0.2
    L(comb.outputs[0], brick.inputs["Vector"])
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 18
    noise.inputs["Detail"].default_value = 6
    L(co, noise.inputs["Vector"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "OVERLAY"
    mix.inputs["Factor"].default_value = 0.35
    L(brick.outputs["Color"], mix.inputs[6])
    L(noise.outputs["Color"], mix.inputs[7])
    inv = nt.nodes.new("ShaderNodeMath")
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    L(brick.outputs["Fac"], inv.inputs[1])
    hsum = nt.nodes.new("ShaderNodeMath")
    hsum.operation = "MULTIPLY_ADD"
    L(noise.outputs["Fac"], hsum.inputs[0])
    hsum.inputs[1].default_value = 0.25
    L(inv.outputs[0], hsum.inputs[2])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.6
    bump.inputs["Distance"].default_value = 0.01
    L(hsum.outputs[0], bump.inputs["Height"])
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = 0.85
    L(mix.outputs[2], b.inputs["Base Color"])
    L(bump.outputs[0], b.inputs["Normal"])
    L(b.outputs[0], out.inputs[0])
    return m


def mat_noisy(name, color, rough, scale=6.0, bump_strength=0.15, var=0.12):
    """Ровный материал с лёгкой неоднородностью: штукатурка, ткань, бетон."""
    m, nt, out = new_mat(name)
    L = nt.links.new
    co = obj_coords(nt)
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 8
    L(co, noise.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    c = color if len(color) == 4 else (*color, 1)
    ramp.color_ramp.elements[0].color = tuple(x * (1 - var) for x in c[:3]) + (1,)
    ramp.color_ramp.elements[1].color = tuple(min(1, x * (1 + var)) for x in c[:3]) + (1,)
    L(noise.outputs["Fac"], ramp.inputs[0])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = bump_strength
    bump.inputs["Distance"].default_value = 0.003
    L(noise.outputs["Fac"], bump.inputs["Height"])
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = rough
    L(ramp.outputs[0], b.inputs["Base Color"])
    L(bump.outputs[0], b.inputs["Normal"])
    L(b.outputs[0], out.inputs[0])
    return m


def mat_oak():
    m, nt, out = new_mat("Oak")
    L = nt.links.new
    co = obj_coords(nt)
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "Y"
    wave.inputs["Scale"].default_value = 3
    wave.inputs["Distortion"].default_value = 5
    wave.inputs["Detail"].default_value = 4
    L(co, wave.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = hexc("#8A5E3A")
    ramp.color_ramp.elements[1].color = hexc("#A87A4B")
    L(wave.outputs["Fac"], ramp.inputs[0])
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = 0.38
    b.inputs["Coat Weight"].default_value = 0.25
    L(ramp.outputs[0], b.inputs["Base Color"])
    L(b.outputs[0], out.inputs[0])
    return m


def mat_rug():
    """Ковёр с икатом: размытые полосы — как у ташкентских тканей."""
    m, nt, out = new_mat("Rug")
    L = nt.links.new
    co = obj_coords(nt)
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.wave_profile = "SAW"
    wave.inputs["Scale"].default_value = 1.6
    wave.inputs["Distortion"].default_value = 3.5
    wave.inputs["Detail"].default_value = 2
    wave.inputs["Detail Scale"].default_value = 3
    L(co, wave.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    cols = ["#7A1F2B", "#E8D9B8", "#26346B", "#C8902E", "#7A1F2B", "#E8D9B8"]
    els = ramp.color_ramp.elements
    els[0].color = hexc(cols[0])
    els[1].position = 1 / len(cols)
    els[1].color = hexc(cols[1])
    for i, c in enumerate(cols[2:], start=2):
        e = els.new(i / len(cols))
        e.color = hexc(c)
    L(wave.outputs["Fac"], ramp.inputs[0])
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = 0.95
    b.inputs["Sheen Weight"].default_value = 0.6
    L(ramp.outputs[0], b.inputs["Base Color"])
    L(b.outputs[0], out.inputs[0])
    return m


def mat_glass():
    """Тонкое стекло: блик по Френелю, тень пропускает — солнце идёт в комнату."""
    m, nt, out = new_mat("Glass")
    L = nt.links.new
    fres = nt.nodes.new("ShaderNodeLayerWeight")
    fres.inputs["Blend"].default_value = 0.12
    gl = nt.nodes.new("ShaderNodeBsdfGlossy")
    gl.inputs["Roughness"].default_value = 0.02
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    tr.inputs[0].default_value = (0.92, 0.95, 0.94, 1)
    mix = nt.nodes.new("ShaderNodeMixShader")
    L(fres.outputs["Fresnel"], mix.inputs[0])
    L(tr.outputs[0], mix.inputs[1])
    L(gl.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs[0])
    return m


def mat_leaf(name, color):
    m, nt, out = new_mat(name)
    L = nt.links.new
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = 0.45
    b.inputs["Coat Weight"].default_value = 0.15
    tl = nt.nodes.new("ShaderNodeBsdfTranslucent")
    tl.inputs[0].default_value = tuple(min(1, c * 1.6) for c in color[:3]) + (1,)
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs[0].default_value = 0.25
    L(b.outputs[0], mix.inputs[1])
    L(tl.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs[0])
    return m


def mat_emit(name, color, strength, sampling="AUTO"):
    m, nt, out = new_mat(name)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs[0].default_value = color if len(color) == 4 else (*color, 1)
    e.inputs[1].default_value = strength
    nt.links.new(e.outputs[0], out.inputs[0])
    m.cycles.emission_sampling = sampling
    return m


def mat_screen(seq_dir: Path, offset: int, k: int):
    m, nt, out = new_mat(f"Screen.{k}")
    L = nt.links.new
    img = bpy.data.images.get(seq_dir.name) or bpy.data.images.load(str(seq_dir / "0001.png"))
    img.name = seq_dir.name
    img.source = "SEQUENCE"
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Cubic"
    iu = tex.image_user
    iu.frame_start = 1
    iu.frame_duration = SEQ_FRAMES
    iu.frame_offset = offset
    iu.use_cyclic = True
    iu.use_auto_refresh = True
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = (0.005, 0.005, 0.006, 1)
    b.inputs["Roughness"].default_value = 0.12
    b.inputs["Emission Strength"].default_value = 2.4
    L(tex.outputs["Color"], b.inputs["Emission Color"])
    L(b.outputs[0], out.inputs[0])
    m.cycles.emission_sampling = "FRONT"
    return m


def mat_city():
    """Фасады: окна — сетка, часть горит тёплым, часть тёмная; крыши без окон."""
    m, nt, out = new_mat("City")
    L = nt.links.new
    co = obj_coords(nt)
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(co, sep.inputs[0])
    add = nt.nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    L(sep.outputs["X"], add.inputs[0])
    L(sep.outputs["Y"], add.inputs[1])
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    L(add.outputs[0], comb.inputs["X"])
    zs = nt.nodes.new("ShaderNodeMath")
    zs.operation = "MULTIPLY"
    zs.inputs[1].default_value = 1.6     # окна шире, чем выше
    L(sep.outputs["Z"], zs.inputs[0])
    L(zs.outputs[0], comb.inputs["Y"])
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.offset = 0.0
    brick.offset_frequency = 1
    brick.squash = 1.0
    brick.inputs["Color1"].default_value = hexc("#FFC98A")
    brick.inputs["Color2"].default_value = (0.0, 0.0, 0.0, 1)
    brick.inputs["Mortar"].default_value = (0.0, 0.0, 0.0, 1)
    brick.inputs["Scale"].default_value = 1.0
    brick.inputs["Mortar Size"].default_value = 0.9
    brick.inputs["Brick Width"].default_value = 3.2
    brick.inputs["Row Height"].default_value = 5.3
    brick.inputs["Bias"].default_value = 0.5      # горит примерно каждое четвёртое
    L(comb.outputs[0], brick.inputs["Vector"])
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    nz = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(geo.outputs["Normal"], nz.inputs[0])
    absz = nt.nodes.new("ShaderNodeMath")
    absz.operation = "ABSOLUTE"
    L(nz.outputs["Z"], absz.inputs[0])
    wall = nt.nodes.new("ShaderNodeMath")
    wall.operation = "LESS_THAN"
    wall.inputs[1].default_value = 0.5
    L(absz.outputs[0], wall.inputs[0])
    win = nt.nodes.new("ShaderNodeMix")
    win.data_type = "RGBA"
    win.inputs[6].default_value = (0, 0, 0, 1)
    L(wall.outputs[0], win.inputs["Factor"])
    L(brick.outputs["Color"], win.inputs[7])
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.05
    L(co, noise.inputs["Vector"])
    base = nt.nodes.new("ShaderNodeValToRGB")
    base.color_ramp.elements[0].color = hexc("#3A3633")
    base.color_ramp.elements[1].color = hexc("#8C8378")
    L(noise.outputs["Fac"], base.inputs[0])
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = 0.7
    b.inputs["Emission Strength"].default_value = 1.6
    L(base.outputs[0], b.inputs["Base Color"])
    L(win.outputs[2], b.inputs["Emission Color"])
    L(b.outputs[0], out.inputs[0])
    m.cycles.emission_sampling = "NONE"
    return m


# ───────────────────────── геометрия ─────────────────────────

class Kit:
    """Много простых тел в одной сетке: быстро строить и быстро считать.

    Вершины и грани копятся списками и уходят в сетку одним from_pydata:
    операторы bmesh на каждое тело обходят всю сетку, и на городе из
    десятков тысяч коробок сборка шла минуты вместо секунд.
    """

    def __init__(self, name):
        self.name = name
        self.verts = []
        self.faces = []
        self.fmat = []
        self.fsmooth = []
        self.mats = []

    def slot(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def _add(self, pts, faces, mat, smooth):
        base = len(self.verts)
        self.verts.extend(tuple(p) for p in pts)
        idx = self.slot(mat)
        for f in faces:
            self.faces.append(tuple(base + i for i in f))
            self.fmat.append(idx)
            self.fsmooth.append(smooth)

    @staticmethod
    def _m(center, rot, base, scale=None):
        m = Matrix.Translation(center) @ (rot or Matrix())
        if scale is not None:
            m = m @ Matrix.Diagonal((*scale, 1))
        return base @ m if base is not None else m

    def box(self, center, size, mat, rot=None, base=None):
        m = self._m(center, rot, base, size)
        pts = [m @ Vector(((i & 1) - 0.5, ((i >> 1) & 1) - 0.5, ((i >> 2) & 1) - 0.5)) for i in range(8)]
        faces = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]
        self._add(pts, faces, mat, False)

    def cyl(self, center, r1, depth, mat, r2=None, seg=24, rot=None, base=None, smooth=True, caps=True):
        m = self._m(center, rot, base)
        r2 = r1 if r2 is None else r2
        pts = []
        for z, r in ((-depth / 2, r1), (depth / 2, r2)):
            for i in range(seg):
                a = 2 * math.pi * i / seg
                pts.append(m @ Vector((r * math.cos(a), r * math.sin(a), z)))
        faces = [(i, (i + 1) % seg, seg + (i + 1) % seg, seg + i) for i in range(seg)]
        if caps:
            faces.append(tuple(reversed(range(seg))))
            faces.append(tuple(range(seg, 2 * seg)))
        self._add(pts, faces, mat, smooth)
        if caps and smooth:
            self.fsmooth[-1] = self.fsmooth[-2] = False

    def sphere(self, center, r, mat, scale=(1, 1, 1), seg=16, rings=10, base=None):
        m = self._m(center, None, base, scale)
        pts = [m @ Vector((0, 0, -r))]
        for j in range(1, rings):
            phi = math.pi * j / rings - math.pi / 2
            for i in range(seg):
                a = 2 * math.pi * i / seg
                pts.append(m @ Vector((r * math.cos(phi) * math.cos(a), r * math.cos(phi) * math.sin(a), r * math.sin(phi))))
        pts.append(m @ Vector((0, 0, r)))
        top = len(pts) - 1
        faces = [(0, 1 + (i + 1) % seg, 1 + i) for i in range(seg)]
        for j in range(rings - 2):
            a0, b0 = 1 + j * seg, 1 + (j + 1) * seg
            faces += [(a0 + i, a0 + (i + 1) % seg, b0 + (i + 1) % seg, b0 + i) for i in range(seg)]
        last = 1 + (rings - 2) * seg
        faces += [(last + i, last + (i + 1) % seg, top) for i in range(seg)]
        self._add(pts, faces, mat, True)

    def ico(self, center, r, mat, scale=(1, 1, 1), subdiv=1):
        self.sphere(center, r, mat, scale=scale, seg=8, rings=5)

    def strip(self, rows, mat, smooth=True):
        """Лента из рядов точек (лист растения): rows — список рядов одинаковой длины."""
        n = len(rows[0])
        pts = [p for row in rows for p in row]
        faces = []
        for r in range(len(rows) - 1):
            for j in range(n - 1):
                a = r * n + j
                faces.append((a, a + 1, a + n + 1, a + n))
        self._add(pts, faces, mat, smooth)

    def torus(self, center, R, r, mat, seg=24, rseg=10, base=None):
        m = self._m(center, None, base)
        pts = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            for j in range(rseg):
                b = 2 * math.pi * j / rseg
                pts.append(m @ Vector(((R + r * math.cos(b)) * math.cos(a), r * math.sin(b), (R + r * math.cos(b)) * math.sin(a))))
        faces = []
        for i in range(seg):
            for j in range(rseg):
                i2, j2 = (i + 1) % seg, (j + 1) % rseg
                faces.append((i * rseg + j, i * rseg + j2, i2 * rseg + j2, i2 * rseg + j))
        self._add(pts, faces, mat, True)

    def done(self, collection=None):
        me = bpy.data.meshes.new(self.name)
        me.from_pydata(self.verts, [], self.faces)
        me.polygons.foreach_set("material_index", self.fmat)
        me.polygons.foreach_set("use_smooth", self.fsmooth)
        bm = bmesh.new()
        bm.from_mesh(me)
        # Листья и плоскости — открытые; замкнутым телам — наружу.
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
        me.update()
        ob = bpy.data.objects.new(self.name, me)
        (collection or bpy.context.scene.collection).objects.link(ob)
        for mt in self.mats:
            me.materials.append(mt)
        return ob


def plane_obj(name, w, h, mat, matrix):
    """Прямоугольник с развёрткой 0..1 — для экранов и надписей."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.verify()
    pts = [(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)]
    uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    vs = [bm.verts.new(p) for p in pts]
    f = bm.faces.new(vs)
    for loop, u in zip(f.loops, uvs):
        loop[uv].uv = u
    # Лицевая сторона смотрит в −Y локально.
    f.normal_update()
    if f.normal.y > 0:
        f.normal_flip()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(mat)
    ob.matrix_world = matrix
    return ob


def rotz(a):
    return Matrix.Rotation(a, 4, "Z")


def rotx(a):
    return Matrix.Rotation(a, 4, "X")


def roty(a):
    return Matrix.Rotation(a, 4, "Y")


def point_light(name, loc, power, color, radius=0.05):
    ld = bpy.data.lights.new(name, "POINT")
    ld.energy = power
    ld.color = color
    ld.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, ld)
    ob.location = loc
    bpy.context.scene.collection.objects.link(ob)
    return ob


def area_light(name, loc, rot, power, color, size=1.0, size_y=None):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = power
    ld.color = color
    if size_y:
        ld.shape = "RECTANGLE"
        ld.size = size
        ld.size_y = size_y
    else:
        ld.size = size
    ob = bpy.data.objects.new(name, ld)
    ob.location = loc
    ob.rotation_euler = rot
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ───────────────────────── офис ─────────────────────────

class M:
    """Общие материалы сцены (заполняются в build_materials)."""


def build_materials():
    M.floor = mat_wood_floor()
    M.brick = mat_brick()
    M.plaster = mat_noisy("Plaster", hexc("#CDBBA2"), 0.85, scale=4, bump_strength=0.08)
    M.ceiling = mat_noisy("Ceiling", hexc("#3B3631"), 0.9, scale=3, bump_strength=0.1)
    M.beam = mat_noisy("Beam", hexc("#4A3020"), 0.6, scale=12, var=0.2)
    M.oak = mat_oak()
    M.black = principled("BlackMetal", hexc("#17181B"), 0.35, metal=0.8)
    M.plastic = principled("Plastic", hexc("#1C1E22"), 0.4)
    M.keys = principled("Keys", hexc("#2A2D33"), 0.5)
    M.keycap = principled("Keycap", hexc("#C9CCD2"), 0.45)
    M.white = principled("Ceramic", hexc("#EFEDE8"), 0.15, coat=0.6)
    M.mug_blue = principled("MugBlue", hexc("#2F5FAE"), 0.2, coat=0.6)
    M.mug_green = principled("MugGreen", hexc("#3F8F6A"), 0.2, coat=0.6)
    M.coffee = principled("Coffee", hexc("#2B160C"), 0.05)
    M.terracotta = mat_noisy("Terracotta", hexc("#B4643F"), 0.8, scale=20)
    M.pot_white = principled("PotWhite", hexc("#E3DED6"), 0.5)
    M.soil = mat_noisy("Soil", hexc("#2E2118"), 1.0, scale=60, bump_strength=0.5)
    M.leaf = mat_leaf("Leaf", hexc("#2E6B2F"))
    M.leaf2 = mat_leaf("Leaf2", hexc("#4F8A3A"))
    M.leaf3 = mat_leaf("LeafSnake", hexc("#3E6B3A"))
    M.chair = mat_noisy("ChairFabric", hexc("#2C3038"), 0.9, scale=80, bump_strength=0.2)
    M.sofa = mat_noisy("SofaFabric", hexc("#B07A3A"), 0.9, scale=90, bump_strength=0.25)
    M.cushion = mat_noisy("Cushion", hexc("#2F4E6E"), 0.9, scale=90, bump_strength=0.25)
    M.rug = mat_rug()
    M.shade = principled("Shade", hexc("#1B1C1E"), 0.45, metal=0.6)
    M.brass = principled("Brass", hexc("#C9A15A"), 0.25, metal=1.0)
    M.bulb = mat_emit("Bulb", (1.0, 0.62, 0.3), 30)
    M.glass = mat_glass()
    M.frame = principled("WindowFrame", hexc("#202224"), 0.4, metal=0.7)
    M.neon_blue = mat_emit("NeonBlue", hexc("#3B82F6"), 18)
    M.neon_green = mat_emit("NeonGreen", hexc("#22F0A0"), 10)
    M.paper = principled("Paper", hexc("#EEE9DF"), 0.8)
    M.steel = principled("Steel", hexc("#B8BCC2"), 0.25, metal=1.0)
    M.lampshade = mat_emit("LampShade", (1.0, 0.7, 0.42), 6)
    M.books = [principled(f"Book{i}", hexc(c), 0.55) for i, c in enumerate(
        ["#7C2D25", "#24456B", "#C49A3A", "#2E5A45", "#D9D2C2", "#3A3A42", "#8C5A2B", "#5E2C4A"])]
    M.poster_a = mat_emit("PosterA", hexc("#22F0A0"), 0.0, "NONE")


def room(k: Kit):
    # Пол, потолок, стены (комната 16 × 12 × 3,6 м). Окна — на стене y = 6.
    k.box((0, 0, -0.05), (16.6, 12.6, 0.1), M.floor)
    k.box((0, 0, 3.65), (16.6, 12.6, 0.1), M.ceiling)
    k.box((8.1, 0, 1.8), (0.2, 12.6, 3.6), M.brick)          # торец — кирпич с неоном
    k.box((-8.1, 0, 1.8), (0.2, 12.6, 3.6), M.plaster)
    k.box((0, -6.1, 1.8), (16.6, 0.2, 3.6), M.plaster)
    # Балки под потолком.
    for x in range(-7, 8, 2):
        k.box((x, 0, 3.47), (0.22, 12.2, 0.26), M.beam)
    # Плинтус.
    k.box((0, -5.99, 0.05), (16, 0.02, 0.1), M.beam)


def window_wall(k: Kit):
    """Стальные окна в пол с переплётом; в проёме x 2..4 створка открыта наружу."""
    y0, y1 = 6.0, 6.3
    k.box((0, (y0 + y1) / 2, 0.22), (16.4, y1 - y0, 0.44), M.plaster)    # под окнами
    k.box((0, (y0 + y1) / 2, 3.39), (16.4, y1 - y0, 0.42), M.plaster)    # над окнами
    for x in range(-8, 9, 2):
        k.box((x, (y0 + y1) / 2, 1.8), (0.14, y1 - y0, 2.8), M.plaster)
    zb, zt = 0.44, 3.18
    for bay in range(-8, 8, 2):
        x0, x1 = bay + 0.07, bay + 2 - 0.07
        if bay == 2:
            continue
        sash(k, x0, x1, zb, zt, 6.12, None)
    # Открытая створка: петли на x = 4, повернута наружу почти на 100°.
    hinge = Matrix.Translation((3.93, 6.2, 0)) @ rotz(math.radians(-98)) @ Matrix.Translation((-3.93, -6.2, 0))
    sash(k, 2.07, 3.93, zb, zt, 6.2, hinge)
    # Подоконник.
    k.box((0, 5.93, 0.455), (16.2, 0.16, 0.03), M.oak)


def sash(k: Kit, x0, x1, zb, zt, y, base):
    t = 0.035
    cols = 4
    rows = 5
    w = x1 - x0
    h = zt - zb
    for i in range(cols + 1):
        x = x0 + w * i / cols
        k.box((x, y, (zb + zt) / 2), (t if 0 < i < cols else 0.06, 0.05, h), M.frame, base=base)
    for j in range(rows + 1):
        z = zb + h * j / rows
        k.box(((x0 + x1) / 2, y, z), (w, 0.05, t if 0 < j < rows else 0.06), M.frame, base=base)
    # Стекло — отдельной плоскостью в том же переплёте.
    m = Matrix.Translation(((x0 + x1) / 2, y, (zb + zt) / 2))
    if base is not None:
        m = base @ m
    g = plane_obj("Glass", w, h, M.glass, m)
    g.visible_shadow = False


def monitor(k: Kit, base: Matrix, seq_dirs, idx):
    """Монитор 27": экран смотрит в −Y локально (к сидящему)."""
    sw, sh = 0.61, 0.343
    k.box((0, 0.012, 1.065), (sw + 0.02, 0.022, sh + 0.02), M.plastic, base=base)
    k.box((0, 0.045, 1.05), (0.22, 0.05, 0.14), M.plastic, base=base)
    k.box((0, 0.075, 0.92), (0.05, 0.03, 0.3), M.black, base=base)
    k.box((0, 0.04, 0.772), (0.26, 0.2, 0.012), M.black, base=base)
    seq = rnd.randrange(len(seq_dirs))
    mat = mat_screen(seq_dirs[seq], rnd.randrange(0, SEQ_FRAMES - FRAMES), idx)
    plane_obj(f"Screen.{idx}", sw, sh, mat, base @ Matrix.Translation((0, -0.0005, 1.065)))


def keyboard(k: Kit, base: Matrix):
    k.box((0, 0, 0.775), (0.44, 0.14, 0.018), M.keys, base=base)
    for row in range(5):
        for col in range(14):
            k.box((-0.2 + col * 0.0305, -0.055 + row * 0.027, 0.787), (0.025, 0.022, 0.008), M.keycap, base=base)
    k.sphere((0.3, 0.0, 0.79), 0.03, M.plastic, scale=(1, 1.6, 0.5), base=base)


def mug(k: Kit, pos, mat, full=True):
    k.cyl(Vector(pos) + Vector((0, 0, 0.048)), 0.04, 0.095, mat, seg=20)
    if full:
        k.cyl(Vector(pos) + Vector((0, 0, 0.088)), 0.036, 0.004, M.coffee, seg=20)
    k.torus(Vector(pos) + Vector((0.045, 0, 0.05)), 0.022, 0.006, mat, base=None)


def chair(k: Kit, pos, yaw):
    base = Matrix.Translation(pos) @ rotz(yaw)
    for i in range(5):
        a = 2 * math.pi * i / 5
        k.box((0.16 * math.cos(a), 0.16 * math.sin(a), 0.06), (0.32, 0.04, 0.03), M.black, rot=rotz(a), base=base)
        k.sphere((0.31 * math.cos(a), 0.31 * math.sin(a), 0.03), 0.028, M.plastic, base=base)
    k.cyl((0, 0, 0.27), 0.025, 0.42, M.steel, base=base)
    k.box((0, 0, 0.5), (0.5, 0.48, 0.08), M.chair, base=base)
    k.box((0, 0.27, 0.86), (0.46, 0.06, 0.6), M.chair, rot=rotx(math.radians(-8)), base=base)
    k.box((0, 0.24, 0.6), (0.06, 0.04, 0.2), M.black, base=base)
    for s in (-1, 1):
        k.box((s * 0.27, 0.02, 0.66), (0.04, 0.3, 0.03), M.plastic, base=base)
        k.box((s * 0.27, 0.08, 0.58), (0.03, 0.03, 0.16), M.black, base=base)


def plant(k: Kit, pos, kind="monstera", size=1.0, pot=None):
    pos = Vector(pos)
    pr = 0.18 * size if kind != "succulent" else 0.045
    ph = 0.36 * size if kind != "succulent" else 0.06
    k.cyl(pos + Vector((0, 0, ph / 2)), pr, ph, pot or M.terracotta, r2=pr * 1.18, seg=28)
    k.cyl(pos + Vector((0, 0, ph * 0.94)), pr * 1.08, 0.01, M.soil, seg=28)
    top = pos + Vector((0, 0, ph * 0.94))
    if kind == "snake":
        for i in range(9):
            a = rnd.uniform(0, 2 * math.pi)
            lean = rnd.uniform(0.02, 0.12)
            length = rnd.uniform(0.6, 1.0) * size
            d = Vector((math.cos(a), math.sin(a), 0))
            side = Vector((-d.y, d.x, 0))
            rows = []
            for s in range(8):
                t = s / 7
                c = top + d * (pr * 0.4 * rnd.random() + lean * t) + Vector((0, 0, length * t))
                w = 0.045 * size * math.sin(math.pi * min(0.98, 0.15 + t * 0.85)) + 0.004
                rows.append([c - side * w, c, c + side * w])
                rows[-1][1] = c + d * 0.008
            k.strip(rows, M.leaf3)
        return
    n = {"monstera": 11, "fiddle": 0, "succulent": 9, "palm": 14}[kind]
    if kind == "fiddle":
        trunk = 1.3 * size
        k.cyl(top + Vector((0, 0, trunk / 2)), 0.018, trunk, M.beam)
        for i in range(26):
            h = rnd.uniform(0.35, 1.0)
            a = rnd.uniform(0, 2 * math.pi)
            leaf(k, top + Vector((0, 0, trunk * h)), a, 0.3 * size, 0.18 * size, rnd.uniform(0.2, 0.7), 0.2, M.leaf)
        return
    for i in range(n):
        a = 2 * math.pi * i / n + rnd.uniform(-0.3, 0.3)
        if kind == "monstera":
            leaf(k, top, a, rnd.uniform(0.7, 1.1) * size, rnd.uniform(0.32, 0.45) * size, rnd.uniform(0.5, 1.0),
                 0.45, M.leaf if i % 2 else M.leaf2, stem=rnd.uniform(0.35, 0.7) * size)
        elif kind == "palm":
            leaf(k, top, a, rnd.uniform(0.9, 1.4) * size, 0.12 * size, rnd.uniform(0.9, 1.3), 0.7, M.leaf2)
        else:
            leaf(k, top, a, 0.07, 0.035, rnd.uniform(0.8, 1.4), 0.1, M.leaf2)


def leaf(k: Kit, base, yaw, length, width, up, droop, mat, stem=0.0):
    d = Vector((math.cos(yaw), math.sin(yaw), 0))
    side = Vector((-d.y, d.x, 0))
    start = base
    if stem:
        # Черешок: поднимается и отходит в сторону.
        end = base + d * stem * 0.5 + Vector((0, 0, stem * up))
        k.strip([[start - side * 0.006, start + side * 0.006], [end - side * 0.006, end + side * 0.006]], mat)
        start = end
    rows = []
    seg = 8
    for s in range(seg + 1):
        t = s / seg
        c = start + d * length * t + Vector((0, 0, length * (up * 0.5 * t - droop * t * t)))
        w = width * math.sin(math.pi * t) ** 0.7 + 0.002
        fold = Vector((0, 0, -w * 0.18))
        rows.append([c - side * w / 2 + fold, c + Vector((0, 0, 0.004)), c + side * w / 2 + fold])
    k.strip(rows, mat)


def books(k: Kit, x0, x1, y, z, depth, facing):
    """Книги на полке от x0 до x1 (вдоль оси полки), корешками к комнате."""
    x = x0
    while x < x1 - 0.06:
        if rnd.random() < 0.08:
            x += rnd.uniform(0.05, 0.15)  # просвет
            continue
        if rnd.random() < 0.1:
            # стопка плашмя
            for j in range(rnd.randint(2, 4)):
                h = rnd.uniform(0.025, 0.04)
                w = rnd.uniform(0.18, 0.24)
                facing(k, (x + 0.12, y, z + 0.02 + j * 0.04), (w, depth * rnd.uniform(0.8, 1), h), rnd.choice(M.books))
            x += 0.28
            continue
        w = rnd.uniform(0.022, 0.055)
        h = rnd.uniform(0.17, 0.29)
        facing(k, (x + w / 2, y, z + h / 2), (w, depth * rnd.uniform(0.75, 1), h), rnd.choice(M.books))
        x += w + 0.002


def bookshelf_y(k: Kit, x0, x1, y_wall, height=2.4, shelves=6, depth=0.32, side=1):
    """Стеллаж вдоль стены y = y_wall (side=1: стена сзади, полки к −y)."""
    yc = y_wall - side * depth / 2
    for i in range(shelves + 1):
        z = 0.06 + i * (height - 0.1) / shelves
        k.box(((x0 + x1) / 2, yc, z), (x1 - x0, depth, 0.03), M.oak)
    for x in [x0 + i * (x1 - x0) / 3 for i in range(4)]:
        k.box((x, yc, height / 2), (0.03, depth, height), M.oak)

    def put(kk, c, s, mat):
        kk.box(c, s, mat)
    for i in range(shelves):
        z = 0.06 + i * (height - 0.1) / shelves + 0.015
        for j in range(3):
            a = x0 + j * (x1 - x0) / 3 + 0.03
            b = a + (x1 - x0) / 3 - 0.05
            if rnd.random() < 0.25:
                plant(k, ((a + b) / 2, yc, z), "succulent", pot=M.pot_white)
                books(k, a, (a + b) / 2 - 0.1, yc, z, depth * 0.8, put)
            else:
                books(k, a, b, yc, z, depth * 0.8, put)


def bookshelf_x(k: Kit, y0, y1, x_wall, height=2.4, shelves=6, depth=0.32):
    """Стеллаж вдоль стены x = x_wall (стена справа, полки к −x)."""
    xc = x_wall - depth / 2
    for i in range(shelves + 1):
        z = 0.06 + i * (height - 0.1) / shelves
        k.box((xc, (y0 + y1) / 2, z), (depth, y1 - y0, 0.03), M.oak)
    for y in [y0 + i * (y1 - y0) / 2 for i in range(3)]:
        k.box((xc, y, height / 2), (depth, 0.03, height), M.oak)

    def put(kk, c, s, mat):
        kk.box((xc, c[0], c[2]), (s[1], s[0], s[2]), mat)
    for i in range(shelves):
        z = 0.06 + i * (height - 0.1) / shelves + 0.015
        for j in range(2):
            a = y0 + j * (y1 - y0) / 2 + 0.03
            b = a + (y1 - y0) / 2 - 0.05
            books(k, a, b, 0, z, depth * 0.8, put)


def pendant(k: Kit, x, y, z=2.35):
    k.cyl((x, y, (3.6 + z + 0.2) / 2), 0.004, 3.6 - z - 0.2, M.black, seg=6)
    k.cyl((x, y, z + 0.12), 0.05, 0.16, M.shade, r2=0.03, seg=20)
    k.cyl((x, y, z), 0.24, 0.16, M.shade, r2=0.06, seg=32, caps=False)
    k.sphere((x, y, z - 0.03), 0.045, M.bulb)
    point_light("Pendant", (x, y, z - 0.05), 95, (1.0, 0.64, 0.36), 0.04)


def office(seq_dirs):
    k = Kit("Office")
    room(k)
    window_wall(k)

    screen_idx = 0
    # Островки по 4 стола: ряды y = −3 и y = 1, по x — три островка.
    for cy in (-3.0, 1.0):
        for cx in (-4.2, 0.0, 4.2):
            for s in (-1, 1):                     # сторона островка
                for dx in (-0.7, 0.7):
                    x = cx + dx
                    yd = cy + s * 0.375
                    k.box((x, yd, 0.745), (1.38, 0.74, 0.035), M.oak)
                    for lx in (-0.66, 0.66):
                        k.box((x + lx, yd, 0.365), (0.04, 0.66, 0.73), M.black)
                    # Экран смотрит к сидящему (наружу от центра островка).
                    face = rotz(0 if s < 0 else math.pi)
                    mon_y = cy + s * 0.12
                    if rnd.random() < 0.35:
                        for side in (-1, 1):
                            b = Matrix.Translation((x + side * 0.32, mon_y, 0)) @ face @ rotz(side * math.radians(-14))
                            monitor(k, b, seq_dirs, screen_idx)
                            screen_idx += 1
                    else:
                        b = Matrix.Translation((x + rnd.uniform(-0.1, 0.1), mon_y, 0)) @ face
                        monitor(k, b, seq_dirs, screen_idx)
                        screen_idx += 1
                    kb = Matrix.Translation((x + rnd.uniform(-0.05, 0.05), cy + s * 0.5, 0)) @ face
                    keyboard(k, kb)
                    if rnd.random() < 0.7:
                        mug(k, (x + rnd.choice((-0.45, 0.45)), cy + s * rnd.uniform(0.35, 0.6), 0.763),
                            rnd.choice((M.white, M.mug_blue, M.mug_green)), full=rnd.random() < 0.8)
                    if rnd.random() < 0.4:
                        plant(k, (x + rnd.choice((-0.55, 0.55)), cy + s * 0.2, 0.763), "succulent",
                              pot=rnd.choice((M.pot_white, M.terracotta)))
                    if rnd.random() < 0.4:
                        k.box((x - 0.4, cy + s * 0.55, 0.77), (0.15, 0.21, 0.012), M.paper,
                              rot=rotz(rnd.uniform(-0.4, 0.4)))
                    yaw = (math.pi if s < 0 else 0) + rnd.uniform(-0.45, 0.45)
                    chair(k, (x + rnd.uniform(-0.12, 0.12), cy + s * rnd.uniform(1.1, 1.3), 0), yaw)
            pendant(k, cx - 0.7, cy)
            pendant(k, cx + 0.7, cy)

    # Кирпичный торец: неон, под ним низкая тумба с книгами и растениями.
    bookshelf_x(k, -5.6, -3.4, 8.0, height=2.6)
    bookshelf_x(k, 1.6, 3.6, 8.0, height=2.6)
    k.box((7.75, -1.0, 0.45), (0.45, 3.6, 0.9), M.oak)
    for y in (-2.4, -1.6, 0.3):
        plant(k, (7.75, y, 0.9), "succulent", pot=M.pot_white)
    books_put = (lambda kk, c, s, mat: kk.box((7.75, c[0], c[2]), (s[1], s[0], s[2]), mat))
    books(k, -0.9, 0.0, 0, 0.9, 0.3, books_put)
    plant(k, (7.4, -3.0, 0), "snake", 1.0)
    plant(k, (7.4, 0.95, 0), "monstera", 1.0)

    # Стеллаж у стены −y и пара плакатов-«абстракций».
    bookshelf_y(k, -6.5, -2.0, -6.0, side=-1)
    plant(k, (-1.5, -5.6, 0), "fiddle", 1.1)
    plant(k, (1.2, -5.6, 0), "snake", 0.9)

    # Лаунж у окон: диван, ковёр, столик, кресло, торшер, большие растения.
    k.box((-4.0, 4.1, 0.006), (3.4, 2.4, 0.012), M.rug)
    sofa(k, (-4.0, 2.95, 0), 0)
    k.cyl((-4.0, 4.3, 0.42), 0.48, 0.04, M.oak, seg=48)
    k.cyl((-4.0, 4.3, 0.2), 0.04, 0.4, M.black, seg=12)
    k.cyl((-4.0, 4.3, 0.01), 0.28, 0.02, M.black, seg=32)
    mug(k, (-3.8, 4.2, 0.44), M.white)
    mug(k, (-4.25, 4.45, 0.44), M.mug_blue)
    k.box((-4.1, 4.15, 0.455), (0.22, 0.3, 0.03), M.books[1], rot=rotz(0.3))
    armchair(k, (-1.7, 4.3, 0), math.radians(110))
    floor_lamp(k, (-6.3, 3.4))
    plant(k, (-7.3, 5.3, 0), "monstera", 1.3)
    plant(k, (-0.4, 5.4, 0), "palm", 1.1)
    plant(k, (6.9, 5.3, 0), "fiddle", 1.2)
    plant(k, (1.3, 5.4, 0), "snake", 1.0)

    # Кофейная стойка справа у окон.
    k.box((7.6, 4.0, 0.47), (0.7, 2.8, 0.94), M.oak)
    k.box((7.6, 4.0, 0.955), (0.74, 2.84, 0.03), M.black)
    k.box((7.65, 3.4, 1.17), (0.4, 0.34, 0.4), M.steel)
    k.box((7.5, 3.4, 1.05), (0.12, 0.2, 0.04), M.black)
    for j, y in enumerate((4.0, 4.15, 4.3, 4.45)):
        mug(k, (7.5, y, 0.97), (M.white, M.mug_green, M.white, M.mug_blue)[j], full=False)
    for y in (3.2, 3.6, 4.0, 4.4, 4.8):
        k.cyl((7.85, y, 1.65), 0.05, 0.16, M.glass if False else M.pot_white, seg=16)
    k.box((7.85, 4.0, 1.55), (0.25, 2.4, 0.03), M.oak)
    point_light("CoffeeLight", (7.5, 4.0, 2.3), 35, (1.0, 0.62, 0.34), 0.05)

    office = k.done()
    neon_sign(Path(seq_dirs[0]).parent)
    return office, screen_idx


def sofa(k: Kit, pos, yaw):
    b = Matrix.Translation(pos) @ rotz(yaw)
    k.box((0, 0, 0.22), (2.2, 0.9, 0.3), M.sofa, base=b)
    for x in (-0.53, 0.53):
        k.box((x, 0.05, 0.43), (1.04, 0.78, 0.14), M.sofa, base=b)
    k.box((0, -0.38, 0.62), (2.2, 0.2, 0.6), M.sofa, rot=rotx(math.radians(-8)), base=b)
    for s in (-1, 1):
        k.box((s * 1.05, 0, 0.42), (0.18, 0.9, 0.48), M.sofa, base=b)
    k.box((-0.6, -0.2, 0.62), (0.42, 0.14, 0.38), M.cushion, rot=rotx(math.radians(-15)) @ rotz(0.1), base=b)
    for x in (-0.95, 0.95):
        k.cyl((x, 0.35, 0.04), 0.02, 0.08, M.black, base=b)
        k.cyl((x, -0.35, 0.04), 0.02, 0.08, M.black, base=b)


def armchair(k: Kit, pos, yaw):
    b = Matrix.Translation(pos) @ rotz(yaw)
    k.box((0, 0, 0.3), (0.8, 0.8, 0.22), M.cushion, base=b)
    k.box((0, -0.36, 0.62), (0.8, 0.16, 0.5), M.cushion, rot=rotx(math.radians(-10)), base=b)
    for s in (-1, 1):
        k.box((s * 0.38, 0, 0.48), (0.1, 0.76, 0.22), M.cushion, base=b)
        for yy in (-0.3, 0.3):
            k.cyl((s * 0.32, yy, 0.1), 0.018, 0.2, M.oak, base=b)


def floor_lamp(k: Kit, xy):
    x, y = xy
    k.cyl((x, y, 0.015), 0.16, 0.03, M.black, seg=32)
    k.cyl((x, y, 0.8), 0.012, 1.55, M.brass, seg=10)
    k.cyl((x, y, 1.6), 0.2, 0.32, M.lampshade, r2=0.15, seg=32, caps=False)
    point_light("FloorLamp", (x, y, 1.55), 60, (1.0, 0.6, 0.32), 0.08)


def label_plane(name, png: Path, height, matrix, color, strength, fade=False):
    """Надпись-картинка из screens.py: светится цветом, вне букв прозрачна."""
    img = bpy.data.images.load(str(png))
    w, h = img.size
    m, nt, out = new_mat(name)
    L = nt.links.new
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Cubic"
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = color if len(color) == 4 else (*color, 1)
    em.inputs[1].default_value = strength
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    alpha = tex.outputs["Alpha"]
    if fade:
        f = nt.nodes.new("ShaderNodeMath")
        f.name = "Fade"
        f.operation = "MULTIPLY"
        L(alpha, f.inputs[0])
        alpha = f.outputs[0]
    L(alpha, mix.inputs[0])
    L(tr.outputs[0], mix.inputs[1])
    L(em.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs[0])
    ob = plane_obj(name, height * w / h, height, m, matrix)
    ob.visible_shadow = False
    return ob, m


def neon_sign(textures: Path):
    """Неон «DevUz Studio» на кирпичном торце (x = 8), лицом в −X."""
    face = rotz(math.radians(-90))
    label_plane("NeonDevUz", textures / "neon_devuz.png", 0.5, Matrix.Translation((7.985, -1.0, 2.5)) @ face,
                hexc("#3B82F6"), 14)
    label_plane("NeonStudio", textures / "neon_studio.png", 0.27, Matrix.Translation((7.985, -1.0, 2.08)) @ face,
                hexc("#22F0A0"), 9)
    point_light("NeonGlow", (7.4, -1.0, 2.3), 25, hexc("#3B82F6")[:3], 0.6)


def dust():
    """Пылинки в комнате: точки, которые плавают по шуму — без кэша частиц."""
    bm = bmesh.new()
    for _ in range(3500):
        bm.verts.new((rnd.uniform(-7, 7), rnd.uniform(-4.5, 5.9), rnd.uniform(0.3, 3.2)))
    me = bpy.data.meshes.new("Dust")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("Dust", me)
    bpy.context.scene.collection.objects.link(ob)

    ng = bpy.data.node_groups.new("DustDrift", "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    n = ng.nodes
    L = ng.links.new
    gin = n.new("NodeGroupInput")
    gout = n.new("NodeGroupOutput")
    pts = n.new("GeometryNodeMeshToPoints")
    pos = n.new("GeometryNodeInputPosition")
    time = n.new("GeometryNodeInputSceneTime")
    tw = n.new("ShaderNodeMath")
    tw.operation = "MULTIPLY"
    tw.inputs[1].default_value = 0.07
    noise = n.new("ShaderNodeTexNoise")
    noise.noise_dimensions = "4D"
    noise.inputs["Scale"].default_value = 0.8
    center = n.new("ShaderNodeVectorMath")
    center.operation = "SUBTRACT"
    center.inputs[1].default_value = (0.5, 0.5, 0.5)
    amp = n.new("ShaderNodeVectorMath")
    amp.operation = "SCALE"
    amp.inputs["Scale"].default_value = 0.5
    setp = n.new("GeometryNodeSetPosition")
    ico = n.new("GeometryNodeMeshIcoSphere")
    ico.inputs["Radius"].default_value = 0.0022
    ico.inputs["Subdivisions"].default_value = 1
    inst = n.new("GeometryNodeInstanceOnPoints")
    setm = n.new("GeometryNodeSetMaterial")
    setm.inputs["Material"].default_value = principled("Dust", (1.0, 0.95, 0.85, 1), 0.6,
                                                     emit=(1.0, 0.8, 0.6, 1), strength=0.15)
    L(gin.outputs[0], pts.inputs["Mesh"])
    L(pos.outputs[0], noise.inputs["Vector"])
    L(time.outputs["Seconds"], tw.inputs[0])
    L(tw.outputs[0], noise.inputs["W"])
    L(noise.outputs["Color"], center.inputs[0])
    L(center.outputs[0], amp.inputs[0])
    L(pts.outputs[0], setp.inputs["Geometry"])
    L(amp.outputs[0], setp.inputs["Offset"])
    L(setp.outputs[0], inst.inputs["Points"])
    L(ico.outputs["Mesh"], inst.inputs["Instance"])
    L(inst.outputs[0], setm.inputs["Geometry"])
    L(setm.outputs[0], gout.inputs[0])
    mod = ob.modifiers.new("Drift", "NODES")
    mod.node_group = ng
    ob.cycles.use_motion_blur = False
    return ob


# ───────────────────────── город за окном ─────────────────────────

def path_x(y):
    """Где по x проходит камера на расстоянии y от окна (курс на солнце)."""
    return WINDOW.x + (y - WINDOW.y) * SUN_DIR.x / SUN_DIR.y


def city():
    mc = mat_city()
    ground = mat_noisy("Ground", hexc("#2B2A26"), 0.95, scale=0.01, bump_strength=0.0, var=0.3)
    tree_m = mat_noisy("Trees", hexc("#22361E"), 0.9, scale=0.2, bump_strength=0.0, var=0.3)
    lamp_m = mat_emit("StreetLamp", (1.0, 0.55, 0.2), 25, "NONE")
    dome_m = principled("Dome", hexc("#1F9AA8"), 0.25, coat=0.5)
    sand_m = mat_noisy("Sandstone", hexc("#C9A77C"), 0.8, scale=0.3, bump_strength=0.0)

    g = Kit("Ground")
    g.box((0, 2000, GROUND_Z - 0.5), (9000, 9000, 1), ground)
    g.done()

    # Наше здание: этажи под и над студией, фасадом к городу.
    b = Kit("OurBuilding")
    b.box((0, -7, (GROUND_Z + -0.12) / 2), (30, 26, -0.12 - GROUND_Z), mc)
    b.box((0, -7, 3.75 + 6), (30, 26, 12), mc)
    b.done()

    k = Kit("City")
    street = 46.0
    for gx in range(-60, 61):
        for gy in range(0, 70):
            x0 = gx * street
            y0 = 30 + gy * street
            if y0 > 3600:
                continue
            for _ in range(2 if gy < 10 else 1):
                w = rnd.uniform(14, 30)
                d = rnd.uniform(14, 30)
                cx = x0 + rnd.uniform(-6, 6)
                cy = y0 + rnd.uniform(-6, 6)
                if abs(cx) < 30 and cy < 45:
                    continue
                dist = cy
                tall = rnd.random() < (0.03 + 0.04 * min(1, dist / 1500))
                h = rnd.uniform(9, 30) if not tall else rnd.uniform(45, 140)
                # Коридор полёта камеры — не перегораживать.
                off = abs(cx - path_x(cy))
                cam_z = min(30 + dist * 0.12, 400) - GROUND_Z
                if off < 90:
                    h = min(h, cam_z - 25)
                k.box((cx, cy, GROUND_Z + h / 2), (w, d, h), mc)
            # Деревья и фонари вдоль улиц.
            if gy < 40 and abs(gx) < 40:
                for _ in range(3):
                    tx = x0 + street / 2 + rnd.uniform(-3, 3)
                    ty = y0 + rnd.uniform(-street / 2, street / 2)
                    k.ico((tx, ty, GROUND_Z + 5), rnd.uniform(3, 5), tree_m, scale=(1, 1, 1.2))
                k.box((x0 + street / 2 - 4, y0 + street / 2, GROUND_Z + 7), (0.8, 0.8, 0.4), lamp_m)
    city_ob = k.done()

    # Бирюзовые купола и минареты — ташкентский силуэт.
    d = Kit("Domes")
    for (x, y, r) in ((-380, 640, 18), (420, 980, 22), (-900, 1500, 26)):
        z0 = GROUND_Z
        d.box((x, y, z0 + 9), (r * 2.6, r * 2.6, 18), sand_m)
        d.cyl((x, y, z0 + 18 + r * 0.4), r, r * 0.8, sand_m, seg=48)
        d.sphere((x, y, z0 + 18 + r * 0.8), r, dome_m, scale=(1, 1, 1.25), seg=48, rings=24)
        for sx in (-1, 1):
            mx, my = x + sx * r * 2.2, y - r * 1.4
            d.cyl((mx, my, z0 + 28), 3.2, 56, sand_m, r2=2.6, seg=24)
            d.cyl((mx, my, z0 + 57), 3.8, 2.5, sand_m, seg=24)
            d.sphere((mx, my, z0 + 60), 2.8, dome_m, scale=(1, 1, 1.3))
    d.done()

    # Телебашня вдалеке справа.
    t = Kit("Tower")
    tx, ty = 900, 1900
    for i in range(3):
        a = 2 * math.pi * i / 3
        foot = Vector((tx + 40 * math.cos(a), ty + 40 * math.sin(a), GROUND_Z))
        top = Vector((tx, ty, GROUND_Z + 110))
        mid = (foot + top) / 2
        v = top - foot
        rot = v.to_track_quat("Z", "Y").to_matrix().to_4x4()
        t.box(mid, (5, 5, v.length), mc, rot=rot)
    t.cyl((tx, ty, GROUND_Z + 190), 7, 380, mc, r2=3, seg=24)
    t.cyl((tx, ty, GROUND_Z + 100), 22, 14, mc, seg=40)
    t.sphere((tx, ty, GROUND_Z + 250), 13, mc, scale=(1, 1, 0.6), seg=32, rings=16)
    t.cyl((tx, ty, GROUND_Z + 420), 1.2, 80, M.steel, seg=8)
    t.sphere((tx, ty, GROUND_Z + 461), 1.6, mat_emit("AirRed", (1, 0.05, 0.02), 60, "NONE"))
    t.done()
    return city_ob


def mat_sun():
    """Диск солнца: к центру белее и ярче, к краю — оранжевый и тусклее."""
    m, nt, out = new_mat("SunGlow")
    L = nt.links.new
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.5
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (1.0, 0.86, 0.62, 1)
    ramp.color_ramp.elements[1].color = (1.0, 0.42, 0.12, 1)
    L(lw.outputs["Facing"], ramp.inputs[0])
    st = nt.nodes.new("ShaderNodeMapRange")
    st.inputs["To Min"].default_value = 90
    st.inputs["To Max"].default_value = 18
    L(lw.outputs["Facing"], st.inputs["Value"])
    em = nt.nodes.new("ShaderNodeEmission")
    L(ramp.outputs[0], em.inputs[0])
    L(st.outputs[0], em.inputs[1])
    L(em.outputs[0], out.inputs[0])
    m.cycles.emission_sampling = "NONE"
    return m


def sun_and_sky():
    w = bpy.data.worlds.new("Sky")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.sky_type = "NISHITA"
    sky.sun_disc = False
    sky.sun_elevation = math.radians(4)   # чуть ниже шара: небо оранжевее
    # Небо Нишиты кладёт солнце по азимуту от +Y по часовой; у нас — против.
    sky.sun_rotation = -SUN_AZ
    sky.altitude = 100
    sky.air_density = 1.0
    sky.dust_density = 1.8
    sky.ozone_density = 1.0
    tint = nt.nodes.new("ShaderNodeMix")
    tint.data_type = "RGBA"
    tint.blend_type = "MULTIPLY"
    tint.inputs["Factor"].default_value = 1.0
    tint.inputs[7].default_value = (1.0, 0.78, 0.55, 1)
    nt.links.new(sky.outputs[0], tint.inputs[6])
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 0.34
    nt.links.new(tint.outputs[2], bg.inputs[0])
    nt.links.new(bg.outputs[0], out.inputs[0])

    ld = bpy.data.lights.new("Sun", "SUN")
    ld.energy = 4.2
    ld.color = (1.0, 0.56, 0.3)
    ld.angle = math.radians(0.8)
    sun = bpy.data.objects.new("Sun", ld)
    sun.rotation_euler = SUN_DIR.to_track_quat("Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(sun)

    # Само солнце — светящийся шар, к нему и летит камера.
    k = Kit("SunDisc")
    k.sphere(SUN_POS, SUN_R, mat_sun(), seg=48, rings=24)
    ob = k.done()
    ob.visible_diffuse = False
    ob.visible_glossy = False
    ob.visible_shadow = False
    ob.visible_transmission = False
    # Ореол вокруг солнца: прозрачная сфера, светит к краю слабее.
    m, nt, out = new_mat("SunHalo")
    L = nt.links.new
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.5
    inv = nt.nodes.new("ShaderNodeMath")
    inv.operation = "POWER"
    L(lw.outputs["Facing"], inv.inputs[0])
    inv.inputs[1].default_value = 1.4
    one = nt.nodes.new("ShaderNodeMath")
    one.operation = "SUBTRACT"
    one.inputs[0].default_value = 1.0
    L(inv.outputs[0], one.inputs[1])
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[0].default_value = (1.0, 0.42, 0.12, 1)
    em.inputs[1].default_value = 10.0
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    add = nt.nodes.new("ShaderNodeMixShader")
    L(one.outputs[0], add.inputs[0])
    L(tr.outputs[0], add.inputs[1])
    L(em.outputs[0], add.inputs[2])
    L(add.outputs[0], out.inputs[0])
    m.cycles.emission_sampling = "NONE"
    h = Kit("SunHalo")
    h.sphere(SUN_POS, SUN_R * 3.2, m, seg=48, rings=24)
    ho = h.done()
    ho.visible_diffuse = False
    ho.visible_glossy = False
    ho.visible_shadow = False
    ho.visible_transmission = False


# ───────────────────────── логотип ─────────────────────────

def svg_points(d):
    nums = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", d)]
    return [(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]


def read_logo():
    """Геометрия и цвета знака — из настоящего SVG бренда, ничего на глаз."""
    s = LOGO_SVG.read_text()
    star = re.search(r'<path d="([^"]+)" fill="url\(#mark\)"', s).group(1)
    mask = re.search(r"<mask[^>]*>(.*?)</mask>", s, re.S).group(1)
    cuts = re.findall(r'<path d="([^"]+)" stroke="#000" stroke-width="([\d.]+)"', mask)
    bar = re.search(r'<rect x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)" rx="([\d.]+)" fill="(#[0-9A-Fa-f]{6})"', s)
    grad = re.search(r'<linearGradient id="mark"([^>]*)>(.*?)</linearGradient>', s, re.S)
    attrs = dict(re.findall(r'(\w+)="([^"]+)"', grad.group(1)))
    stops = [(float(o.rstrip("%")) / (100 if o.endswith("%") else 1), c)
             for o, c in re.findall(r'<stop offset="([\d.]+%?)" stop-color="(#[0-9A-Fa-f]{6})"', grad.group(2))]
    return {
        "star": svg_points(star),
        "cuts": [(svg_points(d), float(w)) for d, w in cuts],
        "bar": tuple(float(bar.group(i)) for i in range(1, 6)) + (bar.group(6),),
        "grad": tuple(float(attrs[a]) for a in ("x1", "y1", "x2", "y2")),
        "stops": stops,
    }


K = 0.01   # 1 единица SVG = 1 см: звезда радиусом 1 м


def to3(p, y=0.0):
    """SVG (x вправо, y вниз) → плоскость XZ, лицом к −Y."""
    return Vector((p[0] * K, y, -p[1] * K))


def prism(name, outline, y0, y1, mat=None):
    bm = bmesh.new()
    vs = [bm.verts.new(to3(p, y0)) for p in outline]
    f = bm.faces.new(vs)
    f.normal_update()
    ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    moved = [e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=moved, vec=(0, y1 - y0, 0))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if mat:
        me.materials.append(mat)
    return ob


def stroke_cutters(points, width, depth):
    """Штрих маски со скруглёнными концами и углами: цилиндры в точках + бруски."""
    k = Kit("Cut")
    r = width / 2 * K
    dummy = bpy.data.materials.get("CutDummy") or bpy.data.materials.new("CutDummy")
    for p in points:
        c = to3(p, 0)
        k.cyl(c, r, depth, dummy, seg=48, rot=rotx(math.radians(90)))
    for a, b in zip(points, points[1:]):
        pa, pb = to3(a), to3(b)
        mid = (pa + pb) / 2
        v = pb - pa
        ang = math.atan2(v.z, v.x)
        k.box(mid, (v.length, depth, width * K), dummy, rot=roty(-ang))
    return k.done()


def mat_logo_mark(logo):
    """Градиент знака как в SVG: от #5B9BFF через #3B82F6 к #22F0A0 по диагонали."""
    m, nt, out = new_mat("LogoMark")
    L = nt.links.new
    co = obj_coords(nt)
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(co, sep.inputs[0])
    # Координаты градиента — в долях рамки знака (−100..100 по обеим осям).
    x1, y1, x2, y2 = logo["grad"]
    bx0, by0, bw, bh = -100.0, -100.0, 200.0, 200.0
    sx1, sy1 = bx0 + x1 * bw, by0 + y1 * bh
    sx2, sy2 = bx0 + x2 * bw, by0 + y2 * bh
    dx, dy = sx2 - sx1, sy2 - sy1
    dd = dx * dx + dy * dy
    # t = ((xs − sx1)·dx + (ys − sy1)·dy) / dd, где xs = X/K, ys = −Z/K
    tx = nt.nodes.new("ShaderNodeMath")
    tx.operation = "MULTIPLY"
    tx.inputs[1].default_value = dx / (K * dd)
    L(sep.outputs["X"], tx.inputs[0])
    tz = nt.nodes.new("ShaderNodeMath")
    tz.operation = "MULTIPLY"
    tz.inputs[1].default_value = -dy / (K * dd)
    L(sep.outputs["Z"], tz.inputs[0])
    s = nt.nodes.new("ShaderNodeMath")
    s.operation = "ADD"
    L(tx.outputs[0], s.inputs[0])
    L(tz.outputs[0], s.inputs[1])
    t = nt.nodes.new("ShaderNodeMath")
    t.operation = "ADD"
    t.inputs[1].default_value = -(sx1 * dx + sy1 * dy) / dd
    L(s.outputs[0], t.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    stops = logo["stops"]
    els[0].position, els[0].color = stops[0][0], hexc(stops[0][1])
    els[1].position, els[1].color = stops[-1][0], hexc(stops[-1][1])
    for pos, c in stops[1:-1]:
        e = els.new(pos)
        e.color = hexc(c)
    L(t.outputs[0], ramp.inputs[0])
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Metallic"].default_value = 0.35
    b.inputs["Roughness"].default_value = 0.22
    b.inputs["Coat Weight"].default_value = 0.4
    b.inputs["Coat Roughness"].default_value = 0.05
    b.inputs["Emission Strength"].default_value = 0.45
    L(ramp.outputs[0], b.inputs["Base Color"])
    L(ramp.outputs[0], b.inputs["Emission Color"])
    L(b.outputs[0], out.inputs[0])
    return m


def bevel(ob, width, segments=3):
    for f in ob.data.polygons:
        f.use_smooth = True
    mod = ob.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(30)
    mod.harden_normals = True


def apply_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)


def build_logo(textures: Path):
    logo = read_logo()
    T = 0.2
    mark = prism("LogoStar", logo["star"], 0.0, T, mat_logo_mark(logo))
    cutters = []
    for pts, w in logo["cuts"]:
        c = stroke_cutters(pts, w, T * 4)
        cutters.append(c)
        mod = mark.modifiers.new("Cut", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.solver = "EXACT"
        mod.use_self = True      # у резца цилиндры и бруски пересекаются
        mod.object = c
    apply_modifiers(mark)
    for c in cutters:
        bpy.data.objects.remove(c)
    bevel(mark, 0.012)

    x, y, w, h, rx, color = logo["bar"]
    outline = []
    for cx, cy, a0 in ((x + rx, y + rx, 180), (x + w - rx, y + rx, 270), (x + w - rx, y + h - rx, 0), (x + rx, y + h - rx, 90)):
        for i in range(9):
            a = math.radians(a0 + 90 * i / 8)
            outline.append((cx + rx * math.cos(a), cy + rx * math.sin(a)))
    gold = principled("LogoGold", hexc(color), 0.18, metal=1.0, emit=hexc(color), strength=1.2)
    bar = prism("LogoBar", outline, -0.04, T * 0.6, gold)
    bevel(bar, 0.008)

    text, m = label_plane("LogoText", textures / "label_studio.png", 0.36, Matrix(), hexc("#E9EEF7"), 2.2, fade=True)

    # Знак и подпись — на одном пустом объекте: так их и вращаем.
    rig = bpy.data.objects.new("Logo", None)
    bpy.context.scene.collection.objects.link(rig)
    rig.location = LOGO_AT
    for ob in (mark, bar):
        ob.parent = rig
    text.parent = rig
    text.location = (0, -0.02, -1.45)

    # Фон «комнаты» логотипа: замкнутая сфера, чернила бренда и свечение за знаком.
    bgm, nt, out = new_mat("LogoBackdrop")
    L = nt.links.new
    co = obj_coords(nt)
    norm = nt.nodes.new("ShaderNodeVectorMath")
    norm.operation = "NORMALIZE"
    L(co, norm.inputs[0])
    dot = nt.nodes.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    dot.inputs[1].default_value = (0, 1, 0.1)
    L(norm.outputs[0], dot.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.8
    ramp.color_ramp.elements[0].color = hexc("#05070B")
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = hexc("#13304E")
    L(dot.outputs["Value"], ramp.inputs[0])
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs[1].default_value = 1.0
    L(ramp.outputs[0], em.inputs[0])
    L(em.outputs[0], out.inputs[0])
    bgm.cycles.emission_sampling = "NONE"
    k = Kit("LogoBackdrop")
    k.sphere(Vector((0, 0, 0)), 45, bgm, seg=64, rings=32)
    bd = k.done()
    bd.location = LOGO_AT
    bd.visible_shadow = True

    key = area_light("LogoKey", LOGO_AT + Vector((-3.0, -4.5, 3.0)), (math.radians(55), 0, math.radians(-35)), 350, (1.0, 0.9, 0.8), 2.5)
    rim1 = area_light("LogoRimBlue", LOGO_AT + Vector((2.5, 2.0, 2.0)), (math.radians(-120), 0, math.radians(40)), 600, hexc("#3B82F6")[:3], 2.0)
    rim2 = area_light("LogoRimGreen", LOGO_AT + Vector((-2.5, 2.0, -1.5)), (math.radians(-60), 0, math.radians(-130)), 450, hexc("#22F0A0")[:3], 2.0)
    # Блик, который проходит по граням слева направо.
    sweep = area_light("LogoSweep", LOGO_AT + Vector((-4, -2.5, 0.3)), (math.radians(90), 0, 0), 700, (1, 0.95, 0.9), 0.4, 3.0)
    for f, x in ((CUT + 6, -4.0), (CUT + 50, 4.0)):
        sweep.location.x = LOGO_AT.x + x
        sweep.keyframe_insert("location", index=0, frame=f)

    # Знак доворачивается к зрителю, подпись проявляется следом.
    rig.rotation_euler = (0, 0, math.radians(-22))
    rig.scale = (0.9, 0.9, 0.9)
    rig.keyframe_insert("rotation_euler", frame=CUT)
    rig.keyframe_insert("scale", frame=CUT)
    rig.rotation_euler = (0, 0, 0)
    rig.scale = (1, 1, 1)
    rig.keyframe_insert("rotation_euler", frame=CUT + 42)
    rig.keyframe_insert("scale", frame=CUT + 42)
    fade = m.node_tree.nodes["Fade"].inputs[1]
    for f, v in ((CUT + 14, 0.0), (CUT + 34, 1.0)):
        fade.default_value = v
        fade.keyframe_insert("default_value", frame=f)
    for f, z in ((CUT + 14, -1.58), (CUT + 34, -1.45)):
        text.location.z = z
        text.keyframe_insert("location", index=2, frame=f)
    for ob in (rig, text):
        ease(ob)
    ease(m.node_tree)
    return rig


def ease(idblock):
    ad = idblock.animation_data
    if ad and ad.action:
        for fc in fcurves_of(ad.action):
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.easing = "AUTO"
                kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"


def fcurves_of(action):
    if hasattr(action, "fcurves"):
        return action.fcurves
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out


# ───────────────────────── камера ─────────────────────────

def catmull_rom(points, samples_per_seg=200):
    """Центростремительный Катмулл–Ром через все точки: плотная ломаная."""
    P = [Vector(p) for p in points]
    P = [P[0] + (P[0] - P[1])] + P + [P[-1] + (P[-1] - P[-2])]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        t0 = 0.0
        t1 = t0 + max((p1 - p0).length ** 0.5, 1e-4)
        t2 = t1 + max((p2 - p1).length ** 0.5, 1e-4)
        t3 = t2 + max((p3 - p2).length ** 0.5, 1e-4)
        for s in range(samples_per_seg):
            t = t1 + (t2 - t1) * s / samples_per_seg
            a1 = p0 * ((t1 - t) / (t1 - t0)) + p1 * ((t - t0) / (t1 - t0))
            a2 = p1 * ((t2 - t) / (t2 - t1)) + p2 * ((t - t1) / (t2 - t1))
            a3 = p2 * ((t3 - t) / (t3 - t2)) + p3 * ((t - t2) / (t3 - t2))
            b1 = a1 * ((t2 - t) / (t2 - t0)) + a2 * ((t - t0) / (t2 - t0))
            b2 = a2 * ((t3 - t) / (t3 - t1)) + a3 * ((t - t1) / (t3 - t1))
            out.append(b1 * ((t2 - t) / (t2 - t1)) + b2 * ((t - t1) / (t2 - t1)))
    out.append(P[-2])
    return out


def pchip(xs, ys):
    """Монотонный кубический сплайн (Фритч–Карлсон): скорость без рывков и откатов."""
    n = len(xs)
    h = [xs[i + 1] - xs[i] for i in range(n - 1)]
    dlt = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [0.0] * n
    m[0], m[-1] = dlt[0], dlt[-1]
    for i in range(1, n - 1):
        if dlt[i - 1] * dlt[i] <= 0:
            m[i] = 0.0
        else:
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / dlt[i - 1] + w2 / dlt[i])

    def f(x):
        if x <= xs[0]:
            return ys[0]
        if x >= xs[-1]:
            return ys[-1]
        i = max(j for j in range(n - 1) if xs[j] <= x)
        t = (x - xs[i]) / h[i]
        h00 = 2 * t ** 3 - 3 * t ** 2 + 1
        h10 = t ** 3 - 2 * t ** 2 + t
        h01 = -2 * t ** 3 + 3 * t ** 2
        h11 = t ** 3 - t ** 2
        return h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1]
    return f


# Ключевые точки пролёта: (секунда, где камера, куда смотрит).
S = SUN_POS
SHOTS = [
    (0.0,  (-7.3, -1.25, 2.2),  (-3.0, -0.5, 1.0)),
    (1.6,  (-5.5, -1.0, 1.8),   (-1.8, 0.3, 1.05)),
    (3.1,  (-3.2, -0.85, 1.48), (-0.6, 0.4, 1.0)),
    (4.4,  (-1.1, -1.35, 1.36), (0.0, -2.9, 1.0)),
    (5.5,  (0.7, -1.15, 1.45),  (3.2, -1.0, 1.15)),
    (6.5,  (1.95, -0.6, 1.55),  (3.0, 3.0, 1.55)),
    (7.4,  (2.15, 1.1, 1.6),    (2.9, 6.5, 1.75)),
    (8.2,  (2.75, 3.8, 1.68),   (2.8, 12.0, 2.3)),
    (8.9,  (3.0, 6.15, 1.78),   (1.0, 20.0, 4.5)),
    (9.5,  (2.2, 12.0, 4.0),    tuple(WINDOW + SUN_DIR * 400)),
    (10.2, tuple(WINDOW + SUN_DIR * 40 + Vector((0, 0, 14))), tuple(S)),
    (10.8, tuple(WINDOW + SUN_DIR * 150 + Vector((0, 0, 30))), tuple(S)),
    (11.3, tuple(WINDOW + SUN_DIR * 420 + Vector((0, 0, 45))), tuple(S)),
    (11.7, tuple(WINDOW + SUN_DIR * 1100 + Vector((0, 0, 40))), tuple(S)),
    (12.0, tuple(WINDOW + SUN_DIR * 2600 + Vector((0, 0, 12))), tuple(S)),
]


def camera_rig(vertical):
    cd = bpy.data.cameras.new("Camera")
    cam = bpy.data.objects.new("Camera", cd)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    cd.clip_start = 0.03
    cd.clip_end = 20000
    cd.sensor_width = 36
    cd.dof.use_dof = True
    cam.rotation_mode = "QUATERNION"

    times = [s[0] for s in SHOTS]
    dense = catmull_rom([s[1] for s in SHOTS])
    # Длина дуги вдоль ломаной.
    acc = [0.0]
    for a, b in zip(dense, dense[1:]):
        acc.append(acc[-1] + (b - a).length)
    # Длина дуги в ключевых точках.
    per = (len(dense) - 1) // (len(SHOTS) - 1)
    s_keys = [acc[min(i * per, len(acc) - 1)] for i in range(len(SHOTS))]
    s_of_t = pchip(times, s_keys)
    look = [pchip(times, [s[2][j] for s in SHOTS]) for j in range(3)]

    def at_arc(s):
        lo, hi = 0, len(acc) - 1
        while hi - lo > 1:
            mid = (lo + hi) // 2
            if acc[mid] < s:
                lo = mid
            else:
                hi = mid
        span = acc[hi] - acc[lo] or 1
        u = (s - acc[lo]) / span
        return dense[lo].lerp(dense[hi], u)

    lens_scale = 0.72 if vertical else 1.0
    prev_q = None
    for f in range(1, FRAMES + 1):
        t = (f - 1) / FPS
        if f < CUT:
            pos = at_arc(s_of_t(t))
            tgt = Vector((look[0](t), look[1](t), look[2](t)))
            lens = 24 if t < 9.2 else 24 - 11 * smooth((t - 9.2) / 2.7)
            fstop = 2.2 if t < 8.4 else 2.2 + 60 * smooth((t - 8.4) / 1.0)
        else:
            u = smooth((f - CUT) / (FRAMES - CUT), 0.0)
            pos = LOGO_AT + Vector((0, -7.4 + 0.9 * u, -0.25))
            tgt = LOGO_AT + Vector((0, 0, -0.28))
            lens = 40
            fstop = 5.6
        cam.location = pos
        q = (tgt - pos).to_track_quat("-Z", "Y")
        if prev_q is not None and prev_q.dot(q) < 0:
            q.negate()
        prev_q = q
        cam.rotation_quaternion = q
        cd.lens = lens * lens_scale
        cd.dof.focus_distance = max(0.4, min((tgt - pos).length, 200))
        cd.dof.aperture_fstop = fstop
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_quaternion", frame=f)
        cd.keyframe_insert("lens", frame=f)
        cd.keyframe_insert("dof.focus_distance", frame=f)
        cd.keyframe_insert("dof.aperture_fstop", frame=f)
    for idb in (cam, cd):
        for fc in fcurves_of(idb.animation_data.action):
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
    return cam


def smooth(x, lo=0.0):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


# ───────────────────────── рендер и композитинг ─────────────────────────

def white_amount(t):
    """Доля белого поверх кадра: растёт к солнцу, спадает на логотипе."""
    if t < 10.9:
        return 0.0
    if t < 11.95:
        x = (t - 10.9) / 1.05
        return (2 ** (8 * x) - 1) / (2 ** 8 - 1)
    if t < 12.2:
        return 1.0
    if t < 13.1:
        x = (t - 12.2) / 0.9
        return 1 - (1 - (1 - x) ** 3)
    return 0.0


def exposure(t):
    """Офис чуть ярче, улица — по закату, у солнца — пересвет."""
    if t < 7.6:
        return 0.45
    if t < 10.4:
        return 0.45 - 0.95 * smooth((t - 7.6) / 1.6)
    if t < 12.0:
        return -0.5 + 3.0 * smooth((t - 10.4) / 1.6)
    return 0.0


def setup_render(args):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    cy = sc.cycles
    cy.device = "CPU"
    cy.samples = args.samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.03
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    cy.denoising_prefilter = "ACCURATE"
    cy.use_light_tree = True
    cy.max_bounces = 6
    cy.diffuse_bounces = 3
    cy.glossy_bounces = 3
    cy.transmission_bounces = 4
    cy.transparent_max_bounces = 12
    cy.volume_bounces = 0
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.sample_clamp_indirect = 4
    cy.blur_glossy = 1.0
    sc.render.use_persistent_data = True
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.5
    sc.render.fps = FPS
    sc.frame_start = 1
    sc.frame_end = FRAMES
    w, h = (1080, 1920) if args.vertical else (1920, 1080)
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    sc.render.resolution_percentage = args.percent
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.image_settings.color_depth = "8"
    sc.render.image_settings.compression = 30
    sc.render.use_overwrite = True
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Punchy"
    except TypeError:
        pass
    sc.view_layers[0].use_pass_mist = True
    sc.world.mist_settings.start = 60
    sc.world.mist_settings.depth = 2500
    sc.world.mist_settings.falloff = "QUADRATIC"

    for f in range(1, FRAMES + 1):
        sc.view_settings.exposure = exposure((f - 1) / FPS)
        sc.view_settings.keyframe_insert("exposure", frame=f)
    compositor(sc)


def compositor(sc):
    sc.use_nodes = True
    nt = sc.node_tree
    nt.nodes.clear()
    L = nt.links.new
    rl = nt.nodes.new("CompositorNodeRLayers")
    comp = nt.nodes.new("CompositorNodeComposite")

    # Дымка над городом: по проходу «туман» к цвету заката.
    haze_amt = nt.nodes.new("CompositorNodeValue")
    haze_amt.name = "HazeAmount"
    mul = nt.nodes.new("CompositorNodeMath")
    mul.operation = "MULTIPLY"
    L(rl.outputs["Mist"], mul.inputs[0])
    L(haze_amt.outputs[0], mul.inputs[1])
    haze = nt.nodes.new("CompositorNodeMixRGB")
    haze.inputs[2].default_value = (1.0, 0.58, 0.28, 1)
    L(mul.outputs[0], haze.inputs[0])
    L(rl.outputs["Image"], haze.inputs[1])

    glare = nt.nodes.new("CompositorNodeGlare")
    set_glare(glare)
    L(haze.outputs[0], glare.inputs["Image"])

    # Чуть больше цвета закату: AgX бережёт светлое и гасит насыщенность.
    sat_amt = nt.nodes.new("CompositorNodeValue")
    sat_amt.name = "Saturation"
    sat = nt.nodes.new("CompositorNodeHueSat")
    L(glare.outputs["Image"], sat.inputs["Image"])
    L(sat_amt.outputs[0], sat.inputs["Saturation"])

    white_amt = nt.nodes.new("CompositorNodeValue")
    white_amt.name = "WhiteAmount"
    white = nt.nodes.new("CompositorNodeMixRGB")
    white.inputs[2].default_value = (24.0, 24.0, 24.0, 1)
    L(white_amt.outputs[0], white.inputs[0])
    L(sat.outputs["Image"], white.inputs[1])
    L(white.outputs[0], comp.inputs["Image"])

    for f in range(1, FRAMES + 1):
        t = (f - 1) / FPS
        haze_amt.outputs[0].default_value = 0.3 if f < CUT else 0.0
        haze_amt.outputs[0].keyframe_insert("default_value", frame=f)
        sat_amt.outputs[0].default_value = 1.22 if f < CUT else 1.0
        sat_amt.outputs[0].keyframe_insert("default_value", frame=f)
        white_amt.outputs[0].default_value = white_amount(t)
        white_amt.outputs[0].keyframe_insert("default_value", frame=f)


def set_glare(glare):
    """Bloom 4.5: порог, сила и размер — входы узла."""
    glare.glare_type = "BLOOM"
    glare.quality = "MEDIUM"
    glare.inputs["Threshold"].default_value = 1.5
    glare.inputs["Strength"].default_value = 1.6
    glare.inputs["Size"].default_value = 0.9
    glare.inputs["Tint"].default_value = (1.0, 0.62, 0.32, 1)


# ───────────────────────── сборка ─────────────────────────

def main():
    args = parse_args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    seq_dirs = sorted(p for p in Path(args.screens).iterdir() if p.is_dir() and p.name.startswith("seq_"))
    if not seq_dirs:
        raise SystemExit(f"нет кадров экранов в {args.screens} — сначала screens.py")

    import time
    t0 = time.time()

    def step(name, fn, *a):
        nonlocal t0
        r = fn(*a)
        print(f"  {name}: {time.time() - t0:.1f} с", flush=True)
        t0 = time.time()
        return r

    step("материалы", build_materials)
    step("небо и солнце", sun_and_sky)
    _, screens = step("офис", office, seq_dirs)
    step("пыль", dust)
    step("город", city)
    step("логотип", build_logo, Path(args.screens))
    step("камера", camera_rig, args.vertical)
    step("рендер и композитинг", setup_render, args)
    print(f"сцена собрана: экранов {screens}, объектов {len(bpy.data.objects)}")

    sc = bpy.context.scene
    if args.save:
        bpy.ops.wm.save_as_mainfile(filepath=args.save)
    if not args.out:
        return
    if args.frames:
        for f in [int(x) for x in args.frames.split(",") if x]:
            sc.frame_set(f)
            sc.render.filepath = f"{args.out}{f:04d}.png"
            bpy.ops.render.render(write_still=True)
        return
    sc.frame_start = args.start
    sc.frame_end = args.end
    sc.frame_step = args.step
    sc.render.filepath = args.out
    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
