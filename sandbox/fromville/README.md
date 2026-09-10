# FROMVILLE (codename) — prototipo

Walking simulator de terror en primera persona para navegador (Three.js / WebGL2). **Proyecto
independiente** del workspace `sandbox/*`; reutiliza *patrones* de THE ROAD, no su código.

> `FROMVILLE` es un **codename interno**. No se publica con ese nombre (ver `plan/IP_ORIGINALITY.md`).
> Todo el contenido es **original**; el terror parte de conceptos genéricos de género.

## Estado: Fase 1 — Foundation

Escena **gris** navegable en primera persona: carretera-bucle (anillo cerrado), bloque del pueblo,
bosque con colisión, linterna off, HUD mínimo y overlay de debug (F3). Sin criaturas ni día/noche
todavía (Fases 3, 8, 9). Arte en Blender a partir de la Fase 5 (`plan/BLENDER_PIPELINE.md`).

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
- **Esc** pausa (libera el ratón). **F3** overlay de debug (FPS/draw/tris/posición).

## Estructura

Ver `plan/REPO_STRUCTURE.md`. `src/world/layout.ts` es **puro y determinista** (seed → pueblo +
bosque), y lo valida `scripts/smoke.ts` sin navegador. El planning completo está en `plan/`.
