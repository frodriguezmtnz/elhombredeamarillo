# Créditos de assets — `public/assets/kits/`

Kits de POI del pueblo, **modelados en Blender en vivo vía MCP** (colección `FROMVILLE_KITS`) y
exportados a GLB (Y-up, base en y=0, entrada en +X → mira a la carretera con `rotation.y = lm.rot`).
Dimensiones exactas del `layout`. Arquitecturas rurales **genéricas y originales** (ver
`plan/IP_ORIGINALITY.md`): sin logos, sin símbolos de ninguna obra protegida.

| Archivo | POI | Notas |
| --- | --- | --- |
| `diner.glb` | El diner | marquesina + rótulo de neón |
| `sheriff.glb` | La comisaría | linterna/cupula + chapla |
| `church.glb` | La iglesia | nave + torre + aguja + cruz simple |
| `gas.glb` | La gasolinera | marquesina + surtidores + kiosco |
| `watertower.glb` | Torre de agua | celosía + depósito + escalera |

Las **casas** (`house-*`) siguen procedurales (`kits.ts`) porque su huella es aleatoria por seed.

Regenerar (edición interactiva): abrir Blender con el add-on MCP activo y re-ejecutar el modelado
por `execute_blender_code`; o mantener el script batch equivalente en `blender/scripts/`.
