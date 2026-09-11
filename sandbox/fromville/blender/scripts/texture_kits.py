"""
FROMVILLE — pasada de texturas de los kits GLB (batch/headless, pipeline versionable).

    blender --background --python texture_kits.py -- <DIR_kits>

Para cada .glb del directorio: importa, smart-UV por objeto, y engancha al Principled
una textura procedural generada con numpy segun el "recibo" del material (estuco,
tablas de madera, tejas asfalticas, oxido, cristal de iglesia). Los materiales emisivos
(fvm_neon, fvm_windowGlow) y el cristal no se tizan: su luz se modula en runtime.
Re-exporta el GLB sobre si mismo (mismo contrato: Y-up, base y=0, entrada +X,
mismo nombre de material para que TownKits siga cosechando kitEmissives).

Reproducible: RNG sembrado por nombre de textura. Paleta = MAT swatches de kits.ts.
"""
import math
import os
import sys

import bpy
import numpy as np

RES = 512
_cache: dict = {}


def srgb_to_linear(c):
    c = np.asarray(c, dtype=np.float64)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


# (sRGB 0-1, tile en metros)
RECIPES = {
    'fvm_wall':      ('plaster',   (0.866, 0.788, 0.639), 2.4),
    'fvm_wall2':     ('plaster',   (0.608, 0.522, 0.424), 2.4),
    'fvm_house':     ('clapboard', (0.565, 0.522, 0.443), 1.5),
    'fvm_roof':      ('shingles',  (0.204, 0.133, 0.102), 1.8),
    'fvm_rust':      ('rust',      (0.510, 0.275, 0.137), 1.2),
    'fvm_stained':   ('stained',   (0.239, 0.412, 0.439), 1.6),
    'fvm_trim':      None,
    'fvm_accent':    None,
    'fvm_dark':      None,
    'fvm_metal':     None,
    'fvm_glass':     None,
    'fvm_sign':      None,
    'fvm_neon':      None,
    'fvm_windowGlow': None,
}


def _hash(seed_text):
    h = 0
    for ch in seed_text:
        h = (h * 131 + ord(ch)) & 0xFFFFFFFF
    return h


def value_noise(rng, scale):
    """Ruido de valor 2D (bilinear, wrap) remuestreado a RES. scale = celdas por textura."""
    n = max(2, int(scale))
    g = rng.random((n, n)).astype(np.float64)
    xs = np.linspace(0, n, RES, endpoint=False)
    ys = np.linspace(0, n, RES, endpoint=False)
    x0 = np.floor(xs).astype(int)
    y0 = np.floor(ys).astype(int)
    fx = (xs - x0)[None, :, None]
    fy = (ys - y0)[:, None, None]
    x1 = (x0 + 1) % n
    y1 = (y0 + 1) % n
    smooth = lambda t: t * t * (3 - 2 * t)
    fx, fy = smooth(fx), smooth(fy)
    a = g[np.ix_(y0, x0)]
    b = g[np.ix_(y0, x1)]
    c = g[np.ix_(y1, x0)]
    d = g[np.ix_(y1, x1)]
    return (a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy)[:, :, 0]


def fbm(seed_text, base_scale, octaves=3, gain=0.5):
    rng = np.random.default_rng(_hash(seed_text))
    out = np.zeros((RES, RES))
    amp = 1.0
    total = 0.0
    for i in range(octaves):
        out += amp * value_noise(rng, base_scale * (2 ** i))
        total += amp
        amp *= gain
    return out / total


def _plaster(rng, col, streaky):
    v = fbm('p1', 6) * 0.6 + fbm('p2', 24) * 0.4
    shade = 1.0 + (v - 0.5) * 0.22
    img = shade[:, :, None] * srgb_to_linear(col).reshape(1, 1, 3)
    # manchas humedas oscuras
    blob = fbm('p3', 10)
    mask = np.clip((blob - 0.68) * 3.0, 0, 1) * 0.25
    img *= (1 - mask)[:, :, None] * np.array([1, 0.96, 0.9])[None, None, :] + mask[:, :, None] * np.array([0.1, 0.09, 0.08])[None, None, :]
    if streaky:
        streak = (fbm('p4', 90) > 0.62).astype(np.float64)
        blur = np.zeros_like(streak)
        for k in (-1, 0, 1):
            blur += np.roll(streak, k, axis=0) * (1.0 - 0.25 * abs(k))
        streak = np.clip(blur / 2.0, 0, 1)
        vert = np.linspace(1.0, 0.0, RES)[:, None] ** 1.5
        dirt = streak * vert * 0.28
        img *= (1 - dirt)[:, :, None]
    return img


def make_plaster(col, streaky):
    rng = np.random.default_rng(_hash('pl' + str(col)))
    return _plaster(rng, col, streaky)


def make_clapboard(col):
    v = fbm('c1', 8) * 0.5 + fbm('c2', 40) * 0.5
    img = (1.0 + (v - 0.5) * 0.28)[:, :, None] * srgb_to_linear(col).reshape(1, 1, 3)
    board_h = RES // 14
    ys = np.arange(RES)
    seam = 1.0 - np.exp(-((ys % board_h)) / 1.6) * 1.4 - np.exp(-((board_h - ys % board_h)) / 1.6) * 0.5
    seam = np.clip(seam, 0.55, 1.0)
    img *= seam[:, None, None]
    grain = fbm('c3', 160)
    img *= 1.0 + (grain - 0.5)[:, :, None] * 0.08
    return img


def make_shingles(col):
    base = srgb_to_linear(col).reshape(1, 1, 3)
    tone = np.ones((RES, RES))
    rows = 12
    rh = RES // rows
    rng = np.random.default_rng(_hash('sh' + str(col)))
    for r in range(rows + 1):
        y0 = r * rh
        y1 = min(y0 + rh, RES)
        n_tabs = 16
        tw = RES // n_tabs
        off = (r % 2) * (tw // 2)
        for t in range(n_tabs + 1):
            x0 = (t * tw + off) % RES
            x1 = min(x0 + tw, RES)
            if x1 > x0:
                tone[y0:y1, x0:x1] = rng.uniform(0.78, 1.12)
    for r in range(1, rows + 1):
        y0 = r * rh
        tone[y0:y0 + 3] *= 0.45
    grit = fbm('c4', 200)
    mult = tone[:, :, None] * (1.0 + (grit - 0.5)[:, :, None] * 0.14)
    return base * mult


def make_rust(col):
    base = srgb_to_linear(col).reshape(1, 1, 3)
    v = fbm('r1', 7) * 0.5 + fbm('r2', 30) * 0.5
    img = base * (1.0 + (v - 0.5)[:, :, None] * 0.4)
    # oxido naranja en manchas
    rust = np.clip((fbm('r3', 12) - 0.58) * 4.0, 0, 1)
    img = img * (1 - rust)[:, :, None] + srgb_to_linear((0.36, 0.13, 0.05))[None, None, :] * rust[:, :, None]
    # picadura profunda
    pits = np.clip((fbm('r4', 90) - 0.8) * 5.0, 0, 1)
    img *= (1 - pits * 0.6)[:, :, None]
    return img


def make_stained_glass(col):
    rng = np.random.default_rng(_hash('st' + str(col)))
    img = np.zeros((RES, RES, 3))
    palette = [srgb_to_linear(c) for c in
               [(0.16, 0.30, 0.42), (0.42, 0.14, 0.12), (0.72, 0.55, 0.18),
                (0.12, 0.30, 0.18), (0.30, 0.16, 0.36)]]
    cells = 8
    cs = RES // cells
    for gy in range(cells):
        for gx in range(cells):
            c = palette[rng.integers(len(palette))]
            c = c * rng.uniform(0.75, 1.15)
            img[gy * cs:(gy + 1) * cs, gx * cs:(gx + 1) * cs] = c
    # plomo entre piezas
    lead = np.ones((RES, RES))
    for i in range(cells + 1):
        lead[i * cs:i * cs + 3] = 0.25
        lead[:, i * cs:i * cs + 3] = 0.25
    img *= lead[:, :, None]
    return img


def generate(name, kind, col):
    rng = np.random.default_rng(_hash(name))
    if kind == 'plaster':
        return make_plaster(col, streaky=True)
    if kind == 'clapboard':
        return make_clapboard(col)
    if kind == 'shingles':
        return make_shingles(col)
    if kind == 'rust':
        return make_rust(col)
    if kind == 'stained':
        return make_stained_glass(col)
    raise ValueError(kind)


def linear_to_srgb(c):
    c = np.clip(np.asarray(c, dtype=np.float64), 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1.0 / 2.4) - 0.055)


def to_image(img_lin, name):
    img = bpy.data.images.new(name, RES, RES, alpha=False)
    srgb = linear_to_srgb(img_lin)
    rgba = np.ones((RES, RES, 4), dtype=np.float32)
    rgba[:, :, :3] = srgb.astype(np.float32)
    img.colorspace_settings.name = 'sRGB'
    img.pixels.foreach_set(rgba.ravel())
    return img


def texture_for(mat_name):
    key = None
    for k in RECIPES:
        if mat_name.startswith(k):
            key = k
            break
    recipe = RECIPES.get(key) if key else None
    if recipe is None:
        return None
    kind, col, _ = recipe
    if (key, kind) not in _cache:
        _cache[(key, kind)] = to_image(generate(key, kind, col), f"fvtex_{key}")
    return _cache[(key, kind)], recipe[2]


def hook_material(obj, idx, mat, obj_diag):
    got = texture_for(mat.name)
    if got is None or not mat.use_nodes:
        return
    tex, tile_m = got
    nt = mat.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    if not bsdf:
        return
    node = nt.nodes.new('ShaderNodeTexImage')
    node.image = tex
    mapping = nt.nodes.new('ShaderNodeMapping')
    scale = max(0.5, obj_diag / tile_m)
    mapping.inputs['Scale'].default_value = (scale, scale, 1.0)
    texCoord = next((n for n in nt.nodes if n.type == 'TEX_COORD'), None) or nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(texCoord.outputs['UV'], mapping.inputs['Vector'])
    nt.links.new(mapping.outputs['Vector'], node.inputs['Vector'])
    nt.links.new(node.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = min(1.0, bsdf.inputs['Roughness'].default_value + 0.05)


def smart_unwrap(obj):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')


def diag_of(obj):
    bb = obj.bound_box
    sx = max(c[0] for c in bb) - min(c[0] for c in bb)
    sy = max(c[1] for c in bb) - min(c[1] for c in bb)
    sz = max(c[2] for c in bb) - min(c[2] for c in bb)
    return math.sqrt(sx * sx + sy * sy + sz * sz)


def process(path):
    global _cache
    _cache = {}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    bpy.context.view_layer.update()
    # materiales que aparecen en >1 mesh -> copiar por objeto (escala UV propia)
    owners = {}
    for o in meshes:
        for s in o.material_slots:
            if s.material:
                owners.setdefault(s.material.name, set()).add(o.name)
    done = set()
    for o in meshes:
        if not o.data.uv_layers:
            smart_unwrap(o)
        diag = diag_of(o)
        for idx, slot in enumerate(o.material_slots):
            mat = slot.material
            if mat is None or texture_for(mat.name) is None:
                continue
            if len(owners[mat.name]) > 1:
                mat = mat.copy()
                slot.material = mat
            if mat.name in done:
                continue
            hook_material(o, idx, mat, diag)
            done.add(mat.name)
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    for img in bpy.data.images:
        if not img.packed_file and img.name != 'Render Result':
            img.pack()
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True, export_apply=True,
        export_yup=True, export_cameras=False, export_lights=False)
    print(f"TEXTURED {os.path.basename(path)} ({', '.join(sorted(done)) or 'solo emisivos'})")


def main():
    out_dir = sys.argv[sys.argv.index('--') + 1]
    files = sorted(f for f in os.listdir(out_dir) if f.endswith('.glb'))
    for f in files:
        process(os.path.join(out_dir, f))
    print(f"DONE {len(files)} kits texturizados")


if __name__ == '__main__':
    main()
