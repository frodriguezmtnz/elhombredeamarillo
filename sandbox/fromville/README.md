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
fallback procedural; las casas aleatorias siguen procedurales). Debug **F3** muestra `assets GLB N ·
townKits N`. **Fase 6:** sistema de interacción genérico `interaction/` — `IInteractable`
+ `InteractionManager` (raycast por proximidad + cono de mira, prompt bajo la retícula) con **puertas**
(`Door`: abrir/cerrar con **E**, **sellar** con **Shift+E**) y **notas** legibles. `RefugeSystem` aplica
la **regla de sellos**: un refugio solo es seguro si TODAS sus puertas están cerradas **y** selladas
(seguridad activa, recalculada cada frame; base de checkpoints). Debug **F3** muestra refugio/estado.
Aún sin interiores transitables (las puertas sellan desde el umbral) ni linterna/criaturas (Fases 8, 9).
**Fase 7:** audio **100 % procedural** (`core/AudioManager` con buses ambient/player/horror):
`AmbientAudio` (viento con ráfagas LFO + drone sub-bass que crece de noche; `setIntensity()` deja al
Horror Director cortar el ambiente con `silence()`), `SpatialAudio` (`PannerNode`/HRTF con el listener
anclado a la cámara), `PlayerAudio` (pasos + respiración al correr) y `HorrorAudio` (susurros/golpes/
crujidos espacializados — "sound before sight"). Cues de puerta/cerrojo/papel en la interacción. El
`AudioContext` arranca con el primer clic (política de autoplay); **M** silencia. Mezcla
(master/ambient/effects) persistida en `Settings`.

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
- **WASD / flechas** moverse · **Shift** correr (hace ruido de noche, Fase 8) · **Ratón** mirar.
- **E** interactuar (abrir/cerrar puerta, leer nota) · **Shift+E** sellar/quitar el sello de una puerta
  **cerrada** (base de los refugios seguros). El prompt aparece bajo la retícula al apuntar a algo.
- **M** silencia/reactiva el audio. El sonido arranca al pulsar **Entrar al pueblo** (requiere gesto del
  usuario por la política de autoplay del navegador).
- **Esc** pausa (libera el ratón). **F3** overlay de debug (FPS/draw/tris/fase/posición/assets/refugio). **F4** cambia
  calidad LOW/MED/HIGH. **F5** salta a la siguiente fase del día. **F6** acelera el tiempo ×8 (para
  ver el ciclo sin esperas).

## Estructura

Ver `plan/REPO_STRUCTURE.md`. `src/world/layout.ts` es **puro y determinista** (seed → pueblo +
bosque), y lo valida `scripts/smoke.ts` sin navegador. El planning completo está en `plan/`.
