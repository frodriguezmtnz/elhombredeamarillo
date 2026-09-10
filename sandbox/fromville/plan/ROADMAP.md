# ROADMAP — FROMVILLE

> Fases de desarrollo, MVP/vertical slice, Definition of Done, riesgos y futuro. Depende de
> `FROMVILLE_PLAN.md`. Cada fase referencia los docs de `plan/`.

---

## 1. Fases

Secuencia ajustada respecto al brief (razón: primero se valida el *game feel* en gris antes de
invertir en arte; el día/noche y la interacción van antes que la criatura para que el Director
tenga sobre qué operar).

| Fase | Nombre | Entrega clave | Docs |
|---|---|---|---|
| **0** | Planning | ✅ Este conjunto de documentos | todos |
| **1** | Foundation | ✅ Esqueleto `sandbox/fromville` + escena gris FPS + debug F3 | `REPO_STRUCTURE`, `TECH_ARCHITECTURE` |
| **2** | Renderer & camera | ✅ Composer, tone mapping, calidad LOW/MED/HIGH, head-bob | `VISUAL_DIRECTION`, `PERFORMANCE` |
| **3** | Day/Night | ✅ Reloj + fases + interpolación de luces/fog + hooks | `HORROR_SYSTEM §3` |
| **4** | Modular environment | ✅ LoopRoad (anillo seed) + Town (POIs) + Forest (instancing/impostores) | `WORLD_DESIGN` |
| **5** | Blender pipeline | ✅ Batch `bpy` → kits/hero → GLB → carga en Three (DRACO/KTX2 cableados) | `BLENDER_PIPELINE §6.1` |
| **6** | Interaction & refugios | ✅ `IInteractable` + `Door`(E/Shift+E sellar) + `Note` + `RefugeSystem` (regla de sellos) | `GAME_DESIGN §5-6` |
| **7** | Audio | Web Audio procedural + spatial + capas ambient/player/horror | `TECH_ARCHITECTURE §8` |
| **8** | Creature + AI | "The Hollow" + Perception + FSM + waypoints/steering | `AI` |
| **9** | Horror Director | TensionModel + EventBook + control de luces/fog/sonido/criatura | `HORROR_SYSTEM` |
| **10** | Narrative & mystery | Story/Clue/Lore/Dialogue + beats + cuaderno + la "fotografía" | `NARRATIVE_MYSTERY` |
| **11** | Vertical slice | Ensamblado pulido del MVP (10-20 min) | `§2` |
| **12** | Optimization | Presupuestos, LOD, compresión, carga por zonas, perf guards | `PERFORMANCE` |
| **13** | Polish | Iluminación final, VFX, corrección de sensación, accesibilidad | `VISUAL_DIRECTION` |
| **14** | (merge en 12) | — | — |
| **15** | (merge en 13) | — | — |
| **16** | Deployment | Cloudflare Pages + opcional ruta `/fromville/` en la web + nombre final | `DEPLOYMENT`, `IP_ORIGINALITY` |

> Las fases 14/15 del brief (optimización/pulido) se integran en 12/13 para evitar solapes.

**Dependencias:** 1→2→3→4→(5 en paralelo con 6-7)→8→9→10→11→12→13→16. El arte (5) puede
empezar en cuanto exista el environment (4) y no bloquea 6-10 (que usan placeholders grises).

---

## 2. MVP / Vertical Slice

**Objetivo:** una experiencia **completa y pulida** de 10-20 min que demuestre el concepto entero,
no "medio pueblo".

Contenido mínimo (todos ✅ = slice lista):

```
[ ] 1 zona del pueblo (núcleo pequeño: plaza + 3-4 edificios)
[ ] 1 zona de bosque con niebla + impostores
[ ] 1 casa-refugio con puerta/cerrojo y checkpoint
[ ] 1 tramo de Loop Road que "devuelve" (bucle real)
[ ] Ciclo día/noche completo con señales de atardecer
[ ] 1 criatura original (The Hollow) con FSM + awareness
[ ] Sistema de interacción genérico (puerta, nota, interruptor, objeto)
[ ] Linterna con batería + flicker
[ ] 1 evento sobrenatural memorable (la silueta / el teléfono)
[ ] 1 misterio pequeño con payoff (la fotografía)
[ ] Secuencia de supervivencia nocturna (chase → refugio → amanecer)
[ ] Audio ambiental + 3D (viento, pasos, susurros, silencio del Director)
[ ] VFX básicos (niebla, grano, parpadeo)
[ ] UI mínima (prompt, cuaderno, pausa, settings)
[ ] Save (IndexedDB) + debug F3
```

**Recorrido que debe provocar:** Llegar → Explorar → Descubrir → Anochecer → Miedo → Criatura →
Refugio → Supervivencia → Descubrimiento.

---

## 3. Definition of Done (por fase)

Una fase está "done" cuando:
- [ ] Criterios de aceptación de sus tareas cumplidos (`AI_AGENT_WORKFLOW.md §4`).
- [ ] `typecheck` + `build` + `smoke` en verde.
- [ ] Sin regresión de rendimiento (`PERFORMANCE.md §7`).
- [ ] Docs de la fase y este ROADMAP actualizados (checkboxes).
- [ ] Sin material con IP (`IP_ORIGINALITY.md §7`).
- [ ] Jugable a mano y validado el *feel* (checklist manual de `TESTING.md §3`).

**Definition of Done del MVP/slice:** un jugador nuevo, sin explicaciones, entiende el bucle,
siente el anochecer, sobrevive (o muere justamente) una noche, y termina con una pregunta que quiere
resolver. Grabación de playtest de 3 personas sin tutorial = validación.

---

## 4. Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Alcance desbordado** (querer todo FROMVILLE) | Alto | Vertical slice primero; fases con DoD; nothing-scope-creep |
| **Rendimiento en navegador** (bosque, luces) | Alto | Instancing/impostores/niebla desde Fase 4; perf guards en CI |
| **Blender 5.2 + MCP nuevo** | Medio | Validado hoy; fallback a modelado manual + GLB (`BLENDER_PIPELINE §9`) |
| **IA que se siente "NPC que corre"** | Alto | Awareness + estados Observe/Stalk/Manipulate (`AI.md §2`) |
| **Terror que se vuelve monótono** | Medio | Director con presupuesto + silencio (`HORROR_SYSTEM`) |
| **IP/derivado de la serie** | Alto | `IP_ORIGINALITY.md`; universo propio (Marrow Falls) |
| **Audio procedural insuficiente** | Medio | Migrar a samples CC0 en Fase 7 si hace falta (`OPEN_DECISIONS`) |
| **Save/corrupt states** | Medio | Versionado de schema + migraciones + tests round-trip |
| **Autoplay audio / WebGL2 blocklist** | Bajo | "Tap to start" + `webgl-check.html` (`DEPLOYMENT §5`) |

---

## 5. Future roadmap (post-slice)

- Más POIs del mapa (talleres, lagos, torre, Cueva de los Sellos) y el **Late Game** (La Colina /
  Los Colunist, el pacto, la salida real: *terminar tu propia historia*).
- Más criaturas (imitadores, observadores) y variantes por seed.
- **Weather** (lluvia, viento fuerte) y estaciones; el bosque "respira".
- **New Game+**: el bucle cambia; lo que sabías ya no vale.
- Accesibilidad avanzada (subtítulos de sonido espacial, modo no-susto, remapeo completo).
- **Multiplayer** explícitamente **fuera** del alcance (decisión del brief §2).
- Port a WebGPU cuando el renderer de Three esté estable (`OPEN_DECISIONS`).
- Publicación con nombre comercial definitivo + análisis legal de marca.
