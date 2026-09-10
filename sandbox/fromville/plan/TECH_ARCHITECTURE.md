# TECH ARCHITECTURE — FROMVILLE

> Arquitectura del runtime Three.js. Reutiliza patrones probados de `sandbox/the-road`. Depende de
> `FROMVILLE_PLAN.md`. Complementos: `REPO_STRUCTURE.md`, `PERFORMANCE.md`, `AI.md`,
> `HORROR_SYSTEM.md`, `BLENDER_PIPELINE.md`.

---

## 1. Principios

- **Un solo `requestAnimationFrame`** (dueño: `Game`). Todo sistema se actualiza desde ahí con un
  `dt` estable (`THREE.Timer`, no `Clock`, que está deprecado).
- **Composición sobre herencia**; sistemas = módulos con `init/update/dispose`.
- **Determinismo por seed** (`mulberry32`), como THE ROAD: mismo seed → mismo mundo.
- **Cero dependencias innecesarias**; WebGL2; todo procedural en MVP, GLB en Fase 5.
- **Tree-shaking** de `three` (imports nombrados) y **code-splitting** (chunk del juego aparte).

---

## 2. Mapa de módulos

```
Game (orquestador + loop)
 ├── Renderer            (WebGL2, ACES, composer)
 ├── SceneGraph          (scene, camera, luces, fog)
 ├── InputManager        (Pointer Lock, teclado/ratón, rebinding)
 ├── Settings            (calidad LOW/MED/HIGH, volúmenes; localStorage)
 ├── World               (contenedor root de todo el entorno)
 │    ├── LoopRoad       (anillo cerrado con seed — de RoadCurve de THE ROAD)
 │    ├── Town           (POIs modulares)
 │    ├── Forest         (procedural, instancing, impostores)
 │    ├── Terrain/Props  (suelo, rocas, farolas)
 │    └── CollisionSystem(cápsula vs AABB/altura; sin motor físico)
 ├── Player              (FirstPersonController + cámara + oreja de audio)
 ├── Interaction         (InteractionManager + IInteractable)
 ├── Creatures           (Creature mesh/pose)
 ├── AI                  (PerceptionSystem, CreatureFSM, WaypointGraph, Steering)
 ├── DayNight            (reloj + interpolación de luces/fase + hooks)
 ├── HorrorDirector      (presupuesto de tensión + libreta de eventos)
 ├── Events              (EventManager + GameEvent + libretas)
 ├── Narrative           (Story/Clue/Lore/Dialogue)
 ├── Audio               (Ambient, Spatial(PannerNode), Player, Horror)
 ├── Assets              (GLTFLoader+DRACO+KTX2, cache, preload)
 ├── UI                  (MainMenu, HUD, DialogueUI, Notebook, Loading, DebugOverlay)
 ├── Save                (IndexedDB via idb-keyval)
 └── Debug               (F3 overlay + cheats)
```

---

## 3. Renderer

- `WebGLRenderer({ antialias, powerPreference:'high-performance' })`, `outputColorSpace = SRGB`,
  `toneMapping = ACESFilmicToneMapping`.
- `pixelRatio` cap por calidad (LOW 1.0, MED 1.25, HIGH 1.5-2.0).
- `EffectComposer` con los passes de `VISUAL_DIRECTION.md §5` según calidad.
- Resize + `visibilitychange` (pausa el loop si la pestaña no es visible).

---

## 4. Day/Night

Reloj de juego con fases (`HORROR_SYSTEM.md §3`). Expone eventos: `onPhaseChange(phase)`.
Interpola: color/intensidad de la direccional, color del hemisphere, tinte del cielo/fondo,
`scene.fog.density`, y temperatura para el LUT. Es el "reloj" que consulta el Director y las
criaturas (Dormant de día).

---

## 5. Física / colisión

**MVP: sin motor de física.** Colisión propia, como THE ROAD:
- Jugador = **cápsula**; mundo = **AABB/altura** (heightfield suave) + volúmenes de puerta/refugio.
- Resolución en **XZ** (círculos) + gravedad simple + snap a escaleras/rampas por altura.
- **Raycast** para interacción y línea de visión de criaturas.

**¿Cuándo Rapier?** Si aparecen puertas con bisagras físicas, apilado de props o ragdolls. Se
evalúa en Fase 8+ (`OPEN_DECISIONS.md`). Cannon-es/Ammo.js descartados (sobredimensionados o
pesados). Rapier es la opción WASM si hiciera falta.

---

## 6. Interacción y assets

- `InteractionManager`: raycast desde centro de cámara → `IInteractable` más cercano en radio →
  prompt UI → `onInteract` cambia estado (persistible). Ver `GAME_DESIGN.md §6`.
- `AssetManager`: `GLTFLoader` + `DRACOLoader`/`MeshoptDecoder` + `KTX2Loader`; precarga por chunk;
  cache de recursos compartidos (geometrías/materiales instanciados).

---

## 7. Criaturas e IA (runtime)

Implementa `AI.md`: `PerceptionSystem` calcula `awareness` (ruido/luz/LoS por raycast);
`CreatureFSM` (estados) lee `awareness` + modo del Director; `WaypointGraph` + `Steering` mueven.
Sin navmesh en MVP. El Director invoca `creature.setMode(...)`.

---

## 8. Audio

Web Audio API (como THE ROAD, 100% procedural en MVP):
- **Listener** anclado a la cámara del jugador (HRTF `PannerNode`).
- **Capas:** Ambient (viento/insectos/casa), Player (pasos/respiración), Horror (susurros/golpes/
  voces/criatura), con espacialización 3D.
- **Director** dispara cues con posición (`HORROR_SYSTEM.md §2`) y puede `silence()` la mantle.
- Fase avanzada: samples de librería CC0 si el procedural se queda corto (`OPEN_DECISIONS.md`).

---

## 9. Save system

**Sí, MVP con guardado.** IndexedDB vía `idb-keyval` (persistente, sin backend). Serializa:

```
GameState (seed, fase, tension, día)
PlayerState (posición, linterna/batería, inventario, resistencia)
WorldState  (estado de interactuables: puertas, luces, objetos cogidos)
Narrative   (pistas descubiertas, beats completados, lore visto)
Events      (cooldowns/últimos eventos, anomalías aplicadas)
```

Autoguardado en checkpoints (refugios/amanecer) + guardado manual en pausa. Versión de schema para
migraciones.

---

## 10. Debug

F3 overlay: FPS, draw calls, triángulos, posición/rotación, hora/fase, estado+`awareness` de cada
criatura, `tension`, chunks cargados, eventos de audio activos. Cheats (solo dev): teleport, noclip,
god mode, skip-time, spawn criatura, trigger evento. Puerta: `import.meta.env.DEV` / flag.

---

## 11. Ciclo de vida y rendimiento

- **Dispose** completo de geometrías/materiales/texturas/renderer al desmontar (evitar leaks).
- **Presupuestos** por calidad en `PERFORMANCE.md`.
- **Pausa** el loop con `document.hidden`.
- **Respetar `prefers-reduced-motion`** (desactivar grain/head-bob/vírgulas intensas).
