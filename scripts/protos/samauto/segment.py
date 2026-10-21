"""Разбивка модели D-MAX на детали для разлёта.

Модель — одна сетка из Higgsfield (Tripo H3.1, по фото оранжевого D-MAX
с samauto.uz, media 60870532-…). Деталей в ней нет, поэтому делим сами:
каждый треугольник уходит в деталь по своему центру и нормали. Границы —
по ортопроекциям модели с сеткой 0.05 (README): перед машины +x, верх +y,
правый борт +z. Каждая деталь — свой узел с именем, центр узла в центре
детали, чтобы она вращалась вокруг себя.

python3 -I segment.py <вход.glb> <выход.glb>
"""
import sys

import numpy as np
import trimesh

src, dst = sys.argv[1], sys.argv[2]
mesh = trimesh.load(src, force="mesh")
c = mesh.triangles_center
n = mesh.face_normals
x, y, z = c[:, 0], c[:, 1], c[:, 2]
az = np.abs(z)
side = n[:, 2] * np.sign(z)  # наружу по борту

FW, RW, WY, WR = 0.300, -0.257, -0.127, 0.092  # центры колёс по x, высота оси, радиус
BELT = 0.069  # нижний край стёкол
part = np.full(len(c), "kuzov", dtype=object)


def put(name, m):
    part[m & (part == "kuzov")] = name


# Колёса: цилиндр вокруг оси, снаружи от рамы.
for name, wx in (("gildirak_old", FW), ("gildirak_orqa", RW)):
    r = np.hypot(x - wx, y - WY)
    put(name + "_ong", (r < WR) & (z > 0.10))
    put(name + "_chap", (r < WR) & (z < -0.10))

# Зеркала: торчат за борт.
put("oyna_ong", (az > 0.198) & (z > 0) & (y > 0.04) & (y < 0.14) & (x > 0.10) & (x < 0.24))
put("oyna_chap", (az > 0.198) & (z < 0) & (y > 0.04) & (y < 0.14) & (x > 0.10) & (x < 0.24))

# Фары: верхний угол передка.
put("fara_ong", (x > 0.43) & (y > 0.0) & (y < 0.06) & (z > 0.09) & (z < 0.20))
put("fara_chap", (x > 0.43) & (y > 0.0) & (y < 0.06) & (z < -0.09) & (z > -0.20))

# Капот: сверху, перед лобовым стеклом.
put("kapot", (x > 0.215) & (x < 0.47) & (y > 0.0) & (n[:, 1] > 0.35) & (az < 0.19))

# Передок: решётка ISUZU и бампер.
put("old_bamper", (x > 0.425) & (y > -0.2) & (az < 0.2))

# Двери: наружная обшивка борта между арками, с окном.
door = (side > 0.45) & (az > 0.12) & (y > -0.115) & (y < 0.168)
put("eshik_old_ong", door & (z > 0) & (x > -0.006) & (x < 0.205))
put("eshik_old_chap", door & (z < 0) & (x > -0.006) & (x < 0.205))
put("eshik_orqa_ong", door & (z > 0) & (x > -0.175) & (x <= -0.006))
put("eshik_orqa_chap", door & (z < 0) & (x > -0.175) & (x <= -0.006))

# Крыша и стёкла кабины.
put("tom", (y > BELT) & (x > -0.19) & (x < 0.215))

# Задний борт и задний бампер.
put("orqa_bort", (x < -0.452) & (y > -0.04))
put("orqa_bamper", (x < -0.43) & (y <= -0.04) & (y > -0.2))

# Грузовая платформа: всё позади кабины выше рамы.
put("yuk_kuzov", (x < -0.183) & (y > -0.07))

parts = {}
for name in sorted(set(part)):
    idx = np.nonzero(part == name)[0]
    sub = mesh.submesh([idx], append=True)
    sub.remove_unreferenced_vertices()
    parts[name] = sub
    print(f"{name:18s} {len(idx):7d}")

scene = trimesh.Scene()
for name, sub in parts.items():
    center = sub.bounds.mean(axis=0)
    sub.apply_translation(-center)
    scene.add_geometry(sub, node_name=name, geom_name=name, transform=trimesh.transformations.translation_matrix(center))
scene.export(dst)
