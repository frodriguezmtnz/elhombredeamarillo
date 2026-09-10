# FROMVILLE (codename) — prototipo

Walking simulator de terror en primera persona para navegador (Three.js / WebGL2). **Proyecto
independiente** del workspace `sandbox/*`; reutiliza *patrones* de THE ROAD, no su código.

> `FROMVILLE` es un **codename interno**. No se publica con ese nombre (ver `plan/IP_ORIGINALITY.md`).
> Todo el contenido es **original**; el terror parte de conceptos genéricos de género.

## Estado: Fase 7 — Audio procedural (Web Audio)

Escena **gris** navegable en primera persona: carretera-bucle (anillo cerrado), bloque del pueblo,
bosque con colisión. **Post-procesado** (`EffectComposer`): ACES + bloom (MED/HIGH) + viñeta + grano
+ desaturación (look `VISUAL_DIRECTION.md`), con presets **LOW/MED/HIGH** conmutables (**F4**).
**Cámara FPS** propia: FOV al correr + head-bob/roll, respetando `prefers-reduced-motion`.
**Ciclo día/noche** (`environment/DayNight.ts`): reloj por fases DAY→SUNSET→DUSK→NIGHT→DANGER→DAWN
que interpola sol, hemisphere, cielo, **densidad de niebla por fase y calidad** y el **LUT** del
composer; expone `onPhaseChange`. **Entorno modular** (Fase 4): POIs/hitos (`world/Town.ts`), bosque
con **LOD impostor** (`world/Forest.ts`) y farolas/rocas instanciadas (`world/Props.ts`), todo desde
`layout.ts` determinista. **Fase 5:** hero assets modelados en **Blender** (batch `bpy`, ver
`blender/scripts/gen_assets.py`) → `public/assets/props/*.glb`, cargados por `core/AssetManager.ts`
(GLTFLoader + DRACO/KTX2 cableados) y colocados junto a la plaza por `world/HeroProps.ts`. **Los POIs
del pueblo (diner, comisaría, iglesia, gasolinera, torre de agua) son kits GLB modelados en Blender en
vía MCP** (`world/TownKits.ts` reemplaza el gris-box por su `.glb` en `public/assets/kits/`, con
fallback procedural; las **casas** `house-*` también son GLB — 3 variantes `house-a/b/c.glb` sobre
huella canónica 6×6 que `TownKits` escala a la huella aleatoria de cada seed). Debug **F3** muestra
`assets GLB N · townKits N`. **Fase 6:** sistema de interacción genérico `interaction/` — `IInteractable`
+ `InteractionManager` (raycast por proximidad + cono de mira, prompt bajo la retícula) con **puertas**
(`Door`: abrir/cerrar con **E**, **sellar** con **Shift+E**) y **notas** legibles. `RefugeSystem` aplica
la **regla de sellos**: un refugio solo es seguro si TODAS sus puertas están cerradas **y** selladas
(seguridad activa, recalculada cada frame; base de checkpoints). Debug **F3** muestra refugio/estado.
Aún sin interiores transitables (las puertas sellan desde el umbral). La criatura llega en la Fase 8.
**Fase 7:** audio **100 % procedural** (`core/AudioManager` con buses ambient/player/horror):
`AmbientAudio` (viento con ráfagas LFO + drone sub-bass que crece de noche; `setIntensity()` deja al
Horror Director cortar el ambiente con `silence()`), `SpatialAudio` (`PannerNode`/HRTF con el listener
anclado a la cámara), `PlayerAudio` (pasos + respiración al correr) y `HorrorAudio` (susurros/golpes/
crujidos espacializados — "sound before sight"). Cues de puerta/cerrojo/papel en la interacción. El
`AudioContext` arranca con el primer clic (política de autoplay); **M** silencia. Mezcla
(master/ambient/effects) persistida en `Settings`.

**Pulido jugable/visual (post-Fase 7):** se arregló la **integración de movimiento** (antes se
amortiguaba la posición hacia `pos+v·dt` recortando la velocidad real al ~8 %; ahora se suaviza el
**vector velocidad** y se integra, con andar 5 / correr 11 m/s) y se añadió un **slider de velocidad**
y de volumen en el overlay (persistidos en `Settings.moveSpeed`). **Linterna** (`player/Flashlight.ts`,
tecla **F**): SpotLight anclado a la cámara con batería que se agota/repone, parpadeo según carga y
hook `setStress()` para el Horror Director; HUD de batería abajo-izquierda. **Noche navegable**: más
ambiente lunar y menos niebla en NIGHT/DANGER, **viñeta dinámica** (`PostFX.setAtmosphere`) lejos del
0.95 ilegible y exposición 1.2. **Farolas que alumbran**: cabezas emisivas (`MAT.lampGlow`) + pool de
5 `PointLight` (`world/LampLights.ts`) que se reposicionan sobre las farolas más cercanas, escaladas
por `nightFactor`. **Bosque denso**: `treeCount` 340 → **1500**. **Casas en Blender**: 3 variantes GLB
(`house-a/b/c`) vía MCP escaladas a la huella. Sombras reales aún off (a proteger FPS).

**Fase 8 (criatura + IA, primer slice):** **"The Hollow"** (`creatures/Creature.ts`), silueta humanoide
alargada de proporciones incorrectas y **movimiento "a saltos"** (poses fijadas en ticks irregulares).
**Dos capas** (AI.md §2): `ai/PerceptionSystem.ts` calcula estímulos (línea de visión cono+oclusión vía
`CollisionSystem.blocked`, ruido por andar/correr, y **autodelatarse con la linterna**) que el
`Creature` integra en un escalar **`awareness ∈ [0,1]`** (sube rápido, decae lento → pierde el rastro);
`ai/CreatureFSM.ts` modula ese awareness en estados **Dormant→Patrol→Investigate→Observe→Stalk→Chase→
Search→Retreat→Consume**. Navegación sin navmesh: `ai/WaypointGraph.ts` usa el **anillo de la carretera**
como grafo (A\* = arco más corto) + steering seek con esquiva por colisión. **Regla de oro (AI.md §2.7):
la criatura NUNCA corre** — camina con deliberación y corta el paso; la persecución es breve y se pierde
con **silencio + refugio sellado** (`RefugeSystem.safe` la vuelve intocable). De **día está en letargo**
(regla clara). El **Consume** es una **elipsis** (fundido a negro → despiertas en otro sitio), no un
game over con gore. Audio: `HorrorAudio.creaturePresence()` anuncia su estado por sonido antes que por
vista. Debug **F3** muestra `hollow: <estado> · aware % · <dist>m`. **Pendiente:** `Manipulate` (robar
voces / provocar que rompas tus sellos), criaturas secundarias y más ejemplares (los invitará el Horror
Director, Fase 9).

**Tanda visual 8.5 (POIs con setpiece):** tres kits nuevos/renovados modelados en Blender vía MCP
(colección `FROMVILLE_KITS2`): **Diner v2** con rótulo de neón **DINER** y ventanales cálidos,
**El motel** (edificio de 5 puertas + cartel MOTEL / No Vacancy + **piscina con el coche volcado** y
RV oxidado, setpiece de Broken Houses / Stained Pool) y **La Colina** (colony house victoriana con
porche envolvente, buhardillas, bay window y tres chimeneas). Nuevos materiales emisivos `fvm_neon` y
`fvm_windowGlow`: `TownKits` los cosecha en `kitEmissives` y `Game` modula su `emissiveIntensity` con
el `nightFactor` (de día apagados, de noche vivos). El motel y La Colina son refugios nombrables y
suman **13 POIs** por seed; nota setpiece «sacad el coche de la piscina» junto al vaso. Pendiente:
pasada de **texturas** sobre estos kits.

## Scripts

```bash
pnpm install                 # desde la raíz del repo (workspace)
pnpm --filter fromville dev  # Vite en http://localhost:5174
pnpm --filter fromville build
pnpm --filter fromville typecheck
pnpm --filter fromville smoke
```

También desde la raíz: `pnpm dev:fromville`, `pnpm build:fromville`, `pnpm typecheck:fromville`.

## Controles

- **Clic** en la escena → capturar ratón (pointer lock) y caminar.
- **WASD / flechas** moverse · **Shift** correr (hace ruido de noche, Fase 8) · **Ratón** mirar. La
  **velocidad** (y el volumen) se ajustan con los **sliders** del panel de entrada (persistidos).
- **E** interactuar (abrir/cerrar puerta, leer nota) · **Shift+E** sellar/quitar el sello de una puerta
  **cerrada** (base de los refugios seguros). El prompt aparece bajo la retícula al apuntar a algo.
- **F** enciende/apaga la **linterna** (consume batería; se recupera apagada; parpadea cuando queda
  poca). La batería aparece abajo a la izquierda al usarla.
- **M** silencia/reactiva el audio. El sonido arranca al pulsar **Entrar al pueblo** (requiere gesto del
  usuario por la política de autoplay del navegador).
- **Esc** pausa (libera el ratón). **F3** overlay de debug (FPS/draw/tris/fase/posición/assets/refugio). **F4** cambia
  calidad LOW/MED/HIGH. **F5** salta a la siguiente fase del día. **F6** acelera el tiempo ×8 (para
  ver el ciclo sin esperas).

## Estructura

Ver `plan/REPO_STRUCTURE.md`. `src/world/layout.ts` es **puro y determinista** (seed → pueblo +
bosque), y lo valida `scripts/smoke.ts` sin navegador. El planning completo está en `plan/`.
