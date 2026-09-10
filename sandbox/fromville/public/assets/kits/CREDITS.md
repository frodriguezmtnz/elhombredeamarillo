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
| `house-a.glb` | Casa (variante A) | tejado a 4 aguas + puerta + ventanas |
| `house-b.glb` | Casa (variante B) | frontón + porche escalonado + chimenea |
| `house-c.glb` | Casa (variante C) | dos alturas con ala lateral |

Las **casas** (`house-*`) son GLB modelados sobre una huella canónica de 6×6 (muro alto 3.5) y se
**escalan a la huella aleatoria** de cada landmark en `TownKits.ts` (`sx=w/6, sy=h/3.5, sz=d/6`),
elegidos por índice determinista `house-<i> % 3`. Conservan base en y=0 y entrada +X (mira a la
carretera). Si algún `.glb` falta, `Town.ts` deja el gris-box procedural como fallback.

Regenerar (edición interactiva): abrir Blender con el add-on MCP activo y re-ejecutar el modelado
por `execute_blender_code`; o mantener el script batch equivalente en `blender/scripts/`.
