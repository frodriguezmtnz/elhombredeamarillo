# FROMVILLE — Game & Technical Plan

> **Documento maestro.** Planning de diseño de juego + arquitectura técnica para un
> *first-person horror walking simulator* 3D en navegador, **original**, inspirado solo en
> conceptos generales (pueblo del que no puedes escapar, ciclo día/noche, criaturas nocturnas,
> misterio ambiental). Sin personajes, lore, diseños ni assets de ninguna obra existente.
>
> **Estado:** Fase 0 (planning) completada. Ver `ROADMAP.md` para el orden de implementación.
> **Idioma:** Español. **Última actualización:** 2026-09-10.

---

## 0. Cómo leer este plan

Este es el índice maestro. Cada área tiene su documento en `plan/`. Este fichero contiene lo
transversal: resumen ejecutivo, visión, pilares, core loop, decisiones consolidadas y el primer
task. Si solo lees un documento, que sea este.

| # | Documento | Qué cubre |
|---|---|---|
| 1 | `GAME_DESIGN.md` | Loop, horror sin combate, refugios, interacción, linterna, inventario, UI, principios |
| 2 | `WORLD_DESIGN.md` | Layout del anillo (desde el mapa), POIs, bosque, carretera-bucle, streaming |
| 3 | `HORROR_SYSTEM.md` | Director de terror, tensión, ciclo día/noche, eventos procedurales |
| 4 | `AI.md` | Criaturas originales + FSM jerárquica con medidor de *awareness* |
| 5 | `NARRATIVE_MYSTERY.md` | Story / dialogue / clue / lore / event system + misterio principal |
| 6 | `VISUAL_DIRECTION.md` | Dirección de arte **híbrido estilizado**, paleta, postFX, mapa como arte 2D |
| 7 | `BLENDER_PIPELINE.md` | Blender MCP **oficial** (validado), workflow GLB→Draco/KTX2→Three, kits, seguridad |
| 8 | `TECH_ARCHITECTURE.md` | Runtime Three.js, física, renderer, audio, save, debug |
| 9 | `PERFORMANCE.md` | Presupuestos LOW/MED/HIGH, instancing, LOD, draw calls, compresión |
| 10 | `REPO_STRUCTURE.md` | Estructura `src/`, workspace pnpm, scripts `*:fromville` |
| 11 | `AI_AGENT_WORKFLOW.md` | Ciclo de tarea segura para desarrollo por agentes IA |
| 12 | `TESTING.md` | Tests con valor real (core, build, smoke, perf) |
| 13 | `DEPLOYMENT.md` | Cloudflare Pages / Vercel / Netlify, `base:'./'` |
| 14 | `IP_ORIGINALITY.md` | Qué es genérico vs original; evitar IP de FROM |
| 15 | `ROADMAP.md` | Fases 0-16, MVP, vertical slice, Definition of Done, riesgos |
| 16 | `OPEN_DECISIONS.md` | Decisiones abiertas con recomendación provisional |

---

## 1. Executive Summary

**FROMVILLE** es un *walking simulator* de terror en primera persona para navegador. El jugador
despierta/llega a un pueblo pequeño aparentemente normal del que **no puede salir**: la carretera
siempre devuelve al mismo lugar. De día explora, investiga y recolecta; de noche el mundo cambia y
unas criaturas inteligentes lo cazan. No hay armas: el miedo nace de la vulnerabilidad, el sonido,
la oscuridad y lo desconocido.

**Viabilidad: confirmada.** El repo ya contiene **THE ROAD** (`sandbox/the-road`), un juego 3D de
terror en navegador con Three.js/WebGL2, 100% procedural, carretera-anillo cerrada con seed,
controlador en primera persona, NPCs, `ScareDirector`, audio espacial y build estática. FROMVILLE
reutiliza esa arquitectura y **es técnicamente más simple** (no necesita física de vehículo). El
paso de planning está cerrado y el pipeline de Blender (MCP oficial) está **instalado y validado
end-to-end** (ver `BLENDER_PIPELINE.md`).

**Alcance realista:** no se construye "todo FROMVILLE". Se construye una **vertical slice** pulida
(1 zona del pueblo + 1 de bosque + 1 refugio + loop road + día/noche + 1 criatura + 1 evento + 1
misterio) que demuestre el concepto completo. Ver `ROADMAP.md`.

---

## 2. Game Vision

> *"Has llegado a un pueblo del que no puedes escapar."*

La experiencia es un descenso progresivo:

```
Curiosity → Exploration → Unease → Suspicion → Fear → Panic → Survival
```

- **Primera sensación:** "este pueblo parece normal".
- **Luego:** "algo no encaja" → "¿por qué no puedo salir?" → "está anocheciendo" → "NO DEBERÍA ESTAR AQUÍ".

El terror es **slow burn**: atmósfera + sonido + incertidumbre + eventos raros, no jumpscares
constantes. Ver principios en `GAME_DESIGN.md §10` y dirección de arte en `VISUAL_DIRECTION.md`.

---

## 3. Design Pillars

1. **Fear of the unknown** — no enseñar nunca todo.
2. **Vulnerability** — sin combate; sobrevivir = esconderse, huir, observar, callar.
3. **Sound before sight** — el peligro se oye antes de verse (audio 3D es sistema de primer orden).
4. **Environmental storytelling** — el escenario y los objetos cuentan la historia, no las cinemáticas.
5. **The world is not yours** — de noche el mundo pertenece a las criaturas; el jugador es intruso.
6. **Scarcity & payoff** — recursos y respuestas limitadas; cada pista debe acabar significando algo.
7. **Unpredictability with rules** — el mundo varía, pero con reglas legibles para el jugador.
8. **Atmosphere > polygons** — la sensación importa más que el detalle (y encaja con el navegador).

---

## 4. Core Gameplay Loop (justificado)

El loop del planning de referencia se refina así (ver justificación en `GAME_DESIGN.md §2`):

```
LLEGAR / DESCUBRIR
   ↓
EXPLORAR (de día)  →  INVESTIGAR  →  ENCONTRAR PISTA  →  AVANZAR MISTERIO
   ↓                                            ↑
PREPARARSE (linterna, rutas, refugios)          |
   ↓                                            |
ANOCHECER (señales: luz, sonido, viento)        |
   ↓                                            |
SOBREVIVIR (ocultarse/huir de la criatura)  ----+
   ↓
AMANECER → el pueblo "respira", algo ha cambiado → NUEVAS POSIBILIDADES
```

Diferencia clave con el loop genérico: **cada ciclo día/noche reconfigura el acceso** (eventos
permanentes, puertas que antes no cedían, una nueva anomalía). El progreso se mide en **comprensión
del misterio**, no en puntos.

---

## 5. Decisiones técnicas consolidadas

Tabla maestra. El detalle y los pros/contras están en cada doc.

| Área | Decisión | Doc |
|---|---|---|
| Runtime | Three.js WebGL2 (ya probado en THE ROAD) | `TECH_ARCHITECTURE.md` |
| WebGPU | No ahora (APIs inestables; WebGL2 sobra para el estilo) | `TECH_ARCHITECTURE.md` |
| Física | Colisión propia (cápsula + AABB + raycast) en MVP; Rapier opcional | `TECH_ARCHITECTURE.md §5` |
| Arte MVP | Procedural (sin bloquear) → Blender en Fase 5 | `BLENDER_PIPELINE.md` |
| Modelado | **Blender MCP oficial** (lab.blender.org), validado | `BLENDER_PIPELINE.md` |
| Formato assets | glTF/GLB + Draco/meshopt + KTX2 (Basis) | `BLENDER_PIPELINE.md §6` |
| Dirección de arte | **Híbrido estilizado** (paleta tierra + niebla pictórica; mapa ilustrado como arte 2D) | `VISUAL_DIRECTION.md` |
| Iluminación | Sun/moon direccional + hemisphere + fog volumétrico + lightmaps horneados en interiores | `VISUAL_DIRECTION.md §4` |
| PostFX | EffectComposer: ACES + bloom + viñeta + grain + LUT | `VISUAL_DIRECTION.md §5` |
| Audio | Web Audio API procedural + `PannerNode`/`AudioListener` | `TECH_ARCHITECTURE.md §8` |
| IA criaturas | FSM jerárquica + medidor de *awareness* + estímulos | `AI.md` |
| Director de horror | Presupuesto de tensión + cooldowns + silencios | `HORROR_SYSTEM.md` |
| Save | IndexedDB (`idb-keyval`) | `TECH_ARCHITECTURE.md §9` |
| Streaming | Niebla + chunks modulares (sin streaming real en MVP) | `WORLD_DESIGN.md §7` |
| Deploy | Cloudflare Pages (alternativa Vercel/Netlify), sitio estático | `DEPLOYMENT.md` |
| Proyecto | `sandbox/fromville` independiente, no toca THE ROAD ni Astro | `REPO_STRUCTURE.md` |

---

## 6. MVP / Vertical Slice (resumen)

Una experiencia de **10-20 min** que recorra el concepto completo:

```
Llegar → Explorar → Descubrir → Anochecer → Miedo → Criatura → Refugio → Supervivencia → Descubrimiento
```

Contenido mínimo (detalle y DoD en `ROADMAP.md §MVP`): 1 zona del pueblo, 1 zona de bosque, 1 casa
refugio, 1 tramo de loop road, ciclo día/noche, 1 criatura original, interacción genérica, linterna,
1 evento sobrenatural, 1 misterio pequeño, 1 secuencia de supervivencia nocturna, audio 3D, UI mínima.

---

## 7. FIRST IMPLEMENTATION TASK

**Objetivo:** establecer la base técnica sobre la que se construye todo, sin intentar hacer
FROMVILLE completo. Pequeño, concreto, verificable, reversible.

**Tarea — Esqueleto del proyecto + escena gris FPS:**

1. Crear `sandbox/fromville` (Vite + TypeScript strict + Three.js), siguiendo el patrón de
   `sandbox/the-road` (ver `REPO_STRUCTURE.md`).
2. Registrar el paquete en `pnpm-workspace.yaml` y añadir scripts raíz `dev:fromville`,
   `build:fromville`, `preview:fromville`, `typecheck:fromville` (mismo estilo que `*:road`).
3. Montar `core/` mínimo: `Game` (loop único con `requestAnimationFrame` + `THREE.Timer`),
   `Renderer` (WebGL2, ACES tone mapping), `InputManager` (Pointer Lock), `Settings`.
4. Renderizar una **escena gris**: plano de suelo, **niebla** exponencial, luz hemisférica +
   direccional, y una **cámara en primera persona** con `FirstPersonController` (WASD + mouse look,
   colisión cápsula-vs-plano provisional).
5. **Debug overlay (F3)**: FPS, draw calls, triángulos, posición, hora del día, seed.

**Criterios de aceptación:**
- [ ] `pnpm typecheck:fromville` pasa sin errores (TS strict).
- [ ] `pnpm dev:fromville` abre en `http://localhost:5173` mostrando la escena con niebla y el
      overlay de debug activo con F3.
- [ ] WASD + mouse look mueven la cámara; Pointer Lock entra/sale con clic/ESC.
- [ ] `pnpm build:fromville` genera `dist/` estático reproducible.
- [ ] No se toca `sandbox/the-road` ni el sitio Astro. `pnpm build` (Astro) sigue funcionando.
- [ ] Reversible: borrar `sandbox/fromville` y las 3 líneas de workspace/scripts deja el repo intacto.

**No incluye:** modelos, texturas, criaturas, audio, día/noche completo, misterio. Eso es Fase 2+.

---

## 8. Reglas de trabajo (para agentes IA)

Ver `AI_AGENT_WORKFLOW.md` para el ciclo completo. Síntesis innegociable:

- Una tarea a la vez. No reescribir arquitectura de golpe.
- Ejecutar `typecheck` + `build` + smoke/perf tras cada tarea.
- No instalar dependencias innecesarias; respetar el presupuesto de `PERFORMANCE.md`.
- No usar assets, nombres ni música de ninguna obra protegida (`IP_ORIGINALITY.md`).
- No hacer commit salvo que se pida.
