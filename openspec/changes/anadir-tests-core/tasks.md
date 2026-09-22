# Tasks

## 1. Setup

- [x] 1.1 Añadir `vitest` como devDependency y el script `test`, y verificar que `pnpm test` arranca sin fallos — **vitest ^5.0.1 + `"test": "vitest run"`**
- [x] 1.2 Configurar Vitest para TS y alias `@data`/`@lib`, y verificar un test trivial de humo — **`vitest.config.ts` con alias y `environment: node`; los tests resuelven `@data`/`@lib`**

## 2. Tests de lógica del trivial

- [x] 2.1 Testear `buildDeck`: respeta `count`, aplica `minDifficulty`, `safeOnly`, `categories` y `upTo`, y verificar el resultado con aserciones
- [x] 2.2 Testear `buildDeck` con `excludeIds`: excluye lo jugado y cae a repetir solo cuando el pool se agota, verificado por test — **se verifica el mazo vacío que dispara el fallback del tablero**
- [x] 2.3 Testear que las opciones se barajan (todas presentes, sin duplicados) y que el índice correcto apunta a la opción correcta
- [x] 2.4 Testear `computePoints`: difícil no puntúa más que fácil por tener más tiempo; el fallo no suma y la racha reinicia — **se extrae a `src/lib/trivial-scoring.ts` (puro) y se testea la normalización por tiempo y el tope de racha; el fallo = 0 lo aplica el bucle del juego**
- [x] 2.5 Testear `validateQuestions`: acepta `image`/`imageAlt`/`links` válidos y rechaza `links` con `href` inválido — **`validateQuestions` pasa a exportarse**
- [x] 2.6 Integrar `pnpm test` en el workflow de CI (`.github/workflows/ci.yml`) y verificar que corre en el PR

## 3. Verificación

- [x] 3.1 Ejecutar `pnpm test` y verificar que toda la suite pasa — **26 tests, 2 ficheros**
- [x] 3.2 Ejecutar `pnpm build` y verificar que el proyecto sigue compilando
