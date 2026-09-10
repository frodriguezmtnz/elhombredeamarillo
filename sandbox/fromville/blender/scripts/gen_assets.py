"""
FROMVILLE — generador de assets 3D con Blender (batch/headless).

Mismo motor que el MCP (bpy), pero en modo por lotes => pipeline repetible y versionable:
    blender --background --python gen_assets.py -- <DIR_salida_glb>

Cada "kit/hero" se modela con primitivas + bisel y se exporta a su propio .glb (Y-up, origen en
la base). Son los hero assets que Three carga vía AssetManager (Fase 5); el resto del mundo sigue
procedural/impostor. Nada copia diseño de obra protegida (ver plan/IP_ORIGINALITY.md).
"""
import math
import os
import sys

import bpy


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color, rough=0.85, metal=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        bsdf.inputs["Roughness"].default_value = rough
        bsdf.inputs["Metallic"].default_value = metal
    return mat


def _bevel(obj, width):
    if width > 0:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = width
        mod.segments = 2


def cube(name, size, loc, mat, bevel=0.0, rot=(0.0, 0.0, 0.0), scale=(1.0, 1.0, 1.0)):
    s = size / 2.0
    verts = [(-s, -s, -s), (s, -s, -s), (s, s, -s), (-s, s, -s),
             (-s, -s, s), (s, -s, s), (s, s, s), (-s, s, s)]
    faces = [(0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = rot
    obj.scale = scale
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    _bevel(obj, bevel)
    return obj


def cylinder(name, radius, depth, loc, mat, n=16, bevel=0.0, rot=(0.0, 0.0, 0.0)):
    top = [(radius * math.cos(2 * math.pi * i / n), radius * math.sin(2 * math.pi * i / n), depth / 2) for i in range(n)]
    bot = [(radius * math.cos(2 * math.pi * i / n), radius * math.sin(2 * math.pi * i / n), -depth / 2) for i in range(n)]
    verts = top + bot
    faces = []
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    faces.append(tuple(range(n - 1, -1, -1)))  # tapa superior
    faces.append(tuple(range(n, 2 * n)))        # tapa inferior
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    _bevel(obj, bevel)
    return obj


def export(out_dir, filename):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        obj.select_set(True)
    path = os.path.join(out_dir, filename)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print("EXPORT", path)


# ---- kits / heroes ----

def make_crate():
    wood = material("crate_wood", (0.34, 0.26, 0.16))
    cube("crate", 0.8, (0, 0, 0.4), wood, bevel=0.05)


def make_barrel():
    wood = material("barrel_wood", (0.28, 0.22, 0.15))
    metal = material("barrel_band", (0.35, 0.35, 0.38), rough=0.5, metal=0.6)
    cylinder("barrel", 0.4, 0.95, (0, 0, 0.475), wood, bevel=0.03)
    cylinder("band1", 0.42, 0.08, (0, 0, 0.25), metal)
    cylinder("band2", 0.42, 0.08, (0, 0, 0.7), metal)


def make_tombstone():
    stone = material("stone", (0.48, 0.48, 0.5))
    cube("slab", 0.6, (0, 0, 0.5), stone, bevel=0.03, scale=(1.0, 0.25, 1.5))
    cylinder("round", 0.3, 0.15, (0, 0, 0.86), stone, rot=(0, math.pi / 2, 0), n=12)


def make_well():
    stone = material("well_stone", (0.44, 0.43, 0.42))
    wood = material("well_wood", (0.3, 0.24, 0.16))
    cylinder("ring", 0.75, 0.7, (0, 0, 0.35), stone, bevel=0.04)
    cube("post_l", 0.14, (-0.6, 0, 1.1), wood, scale=(1, 1, 15))
    cube("post_r", 0.14, (0.6, 0, 1.1), wood, scale=(1, 1, 15))
    cube("roof", 0.9, (0, 0, 1.75), wood, bevel=0.04, rot=(0, 0, 0.7854), scale=(1.2, 1.0, 0.18))


def make_hollow():
    # criatura original "The Hollow": humanoide alargado, proporciones incorrectas, sin rostro.
    skin = material("hollow_skin", (0.72, 0.72, 0.74), rough=0.95)
    cube("torso", 0.5, (0, 0, 1.35), skin, bevel=0.06, scale=(0.8, 0.5, 1.7))
    cylinder("head", 0.17, 0.34, (0, 0, 2.05), skin, n=12)
    cylinder("arm_l", 0.06, 1.25, (-0.34, 0, 1.25), skin, n=8, rot=(0, 0.12, 0))
    cylinder("arm_r", 0.06, 1.25, (0.34, 0, 1.25), skin, n=8, rot=(0, -0.12, 0))
    cylinder("leg_l", 0.08, 1.0, (-0.13, 0, 0.5), skin, n=8)
    cylinder("leg_r", 0.08, 1.0, (0.13, 0, 0.5), skin, n=8)


ASSETS = {
    "crate.glb": make_crate,
    "barrel.glb": make_barrel,
    "tombstone.glb": make_tombstone,
    "well.glb": make_well,
    "hollow.glb": make_hollow,
}


def main():
    out_dir = sys.argv[-1]
    os.makedirs(out_dir, exist_ok=True)
    for filename, builder in ASSETS.items():
        reset_scene()
        builder()
        export(out_dir, filename)
    print("DONE ->", out_dir)


if __name__ == "__main__":
    main()
