# Créditos de assets — `public/assets/props/`

Todos los `.glb` de esta carpeta son **originales**, generados por `blender/scripts/gen_assets.py`
(primitivas + bisel con `bpy`, sin referencias a ninguna obra protegida). Ver `plan/IP_ORIGINALITY.md`.

| Archivo | Prefab | Notas |
| --- | --- | --- |
| `crate.glb` | Cajón de madera | kit de calle |
| `barrel.glb` | Barril con flejes | kit de calle |
| `tombstone.glb` | Lápida (cementerio) | se instancia ×3 |
| `well.glb` | Pozo de plaza | hero de la plaza |
| `hollow.glb` | "The Hollow" | criatura **original** (no es El Hombre de Amarillo); blockout sin rostro |

Regenerar:

```
blender --background --python blender/scripts/gen_assets.py -- public/assets/props
```
