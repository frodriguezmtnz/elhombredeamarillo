# Proposal

## Why

La lógica más sensible del proyecto (construcción del mazo, puntuación y validación del banco de preguntas) no tiene ninguna prueba automatizada. Un cambio en esas reglas puede romper el juego sin que salte nada, y hoy solo se detecta jugando a mano.

## What Changes

- Añadir Vitest como runner de tests (sin DOM, entorno node) y un script `pnpm test`.
- Cubrir la lógica pura: `buildDeck` (tamaño del mazo, exclusión de `excludeIds`, filtros `minDifficulty`/`safeOnly`/`categories`, barajado de opciones), `computePoints` (normalización por tiempo y racha) y `validateQuestions` (campos `image`/`links`).
- No se añaden tests de UI ni de red en esta primera iteración.

## Impact

- `package.json` (devDependency y script), configuración de Vitest, nuevos `*.test.ts` junto a la lógica en `src/data` y `src/lib`.
- Sin cambios de comportamiento de usuario.
