# PERFORMANCE — FROMVILLE

> Presupuestos y técnicas de rendimiento para navegador. Objetivo: **60 FPS cuando sea razonable**.
> Depende de `TECH_ARCHITECTURE.md`. Complementos: `WORLD_DESIGN.md`, `VISUAL_DIRECTION.md`.

---

## 1. Tres objetivos de calidad

| | LOW | MED | HIGH |
|---|---|---|---|
| Hardware | Gráficos integrados/modestos | PC convencional | Gaming PC |
| FPS objetivo | 30 estables | 45-60 | 60 |
| pixelRatio cap | 1.0 | 1.25 | 1.5-2.0 |
| Sombras | Solo jugador/criatura, mapa bajo | + direccional | + cascaded |
| PostFX | Solo tone map + viñeta | + bloom | + SSAO + god rays + grain |
| Distancia de niebla | Corta (oculta más) | Media | Larga |
| Bosque | Impostores + LOD agresivo | LOD | LOD + más densidad |

El **presupuesto se define por LOW** (el peor caso manda). HIGH es "añadir", no "quitar".

---

## 2. Presupuestos (por frame, objetivo MED)

- **Draw calls:** < ~250-400 (agrupar/instanciar; el bosque NO es un draw call por árbol).
- **Triángulos visibles:** ~1-3 M (LOW) / ~3-5 M (MED) / ~5-8 M (HIGH).
- **Texturas VRAM:** < ~300-500 MB; KTX2 comprimidas en GPU.
- **Luces dinámicas:** ≤ 1 direccional + 1 spot (linterna) + ~2-4 point (farolas visibles).
- **Criaturas activas:** 1 (MVP) → 2-3 (late).

---

## 3. Técnicas clave

- **Instancing** (`InstancedMesh`) para árboles, rocas, farolas, vallas, césped → 1 draw call por
  lote con variación por matriz + atributo por instancia.
- **Impostores / LOD** para vegetación lejana (billboard o mallas LOD1/2/3). El bosque parece enorme
  sin renderizar miles de objetos (requisito del brief §9).
- **Merged geometry** para props estáticos de una zona (bake de un chunk a pocas mallas).
- **Frustum culling** (Three lo hace) + **occlusion** por geometría: interiores cierran puerta → no
  se renderiza lo de detrás; **portales** entre salas.
- **Niebla como límite de draw distance:** recorta el horizonte → menos que renderizar y esconda el
  borde del mapa (`WORLD_DESIGN.md §7`).
- **Textures:** KTX2/Basis + atlas de materiales; reutilizar materiales entre prefabs.
- **Lightmaps horneados** (Blender) para estáticos → menos luces dinámicas y sombras.

---

## 4. Asset pipeline (compresión)

- **GLB + Draco/meshopt** (geometría) + **KTX2** (texturas) → ver `BLENDER_PIPELINE.md §6`.
- **Carga progresiva** por chunk/zona; pantalla de carga al entrar en una zona nueva.
- **Presupuesto por prefab** documentado junto al asset (tris, materiales, KB).

---

## 5. Streaming / memoria

- MVP: mapa finito en memoria (como THE ROAD) + niebla. Sin streaming real.
- Late: **chunks por distancia** (cargar anillo alrededor del jugador, descargar lejos),
  **descarga** de GLB no visibles, **reutilización** de geometrías/materials cacheados, y límites
  de pool de partículas/audio.
- **No recrear** geometrías/materiales cada frame (leaks). `dispose` al desmontar.

---

## 6. Audio y CPU

- Pocos nodos Web Audio activos; reutilizar buffers; spatializer HRTF solo en fuentes cercanas.
- IA/percepción: actualizar `awareness` y FSM a **frecuencia reducida** (no cada frame) y solo de
  criaturas relevantes.
- Evitar GC: reutilizar `Vector3`/temporales en el loop; sin closures por frame.

---

## 7. Medición

- **F3 overlay** (`TECH_ARCHITECTURE.md §10`): FPS, draw calls, triángulos, memoria.
- **Chrome DevTools → Performance** y `Spector.js` para capturar draw calls/texturas.
- **Regla de fase:** ninguna fase sube de presupuesto sin justificarlo en PR (ver
  `AI_AGENT_WORKFLOW.md`). Umbral de CI: build + smoke + "no aumenta draw calls > X%".

---

## 8. Riesgos

- GPU blocklisted en Chromium → WebGL2 no disponible (ya documentado en THE ROAD: `webgl-check`).
- Bosque denso sin instancing = muerte de FPS → instancing/impostores son obligatorios, no opcionales.
- Demasiadas luces dinámicas → usar lightmaps + pocas point lights visibles.
