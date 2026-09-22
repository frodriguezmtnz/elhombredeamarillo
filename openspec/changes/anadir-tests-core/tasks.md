# Tasks

## 1. Setup

- [ ] 1.1 Añadir `vitest` como devDependency y el script `test`, y verificar que `pnpm test` arranca sin fallos
- [ ] 1.2 Configurar Vitest para TS y alias `@data`/`@lib`, y verificar un test trivial de humo

## 2. Tests de lógica del trivial

- [ ] 2.1 Testear `buildDeck`: respeta `count`, aplica `minDifficulty`, `safeOnly`, `categories` y `upTo`, y verificar el resultado con aserciones
- [ ] 2.2 Testear `buildDeck` con `excludeIds`: excluye lo jugado y cae a repetir solo cuando el pool se agota, verificado por test
- [ ] 2.3 Testear que las opciones se barajan (todas presentes, sin duplicados) y que el índice correcto apunta a la opción correcta
- [ ] 2.4 Testear `computePoints`: difícil no puntúa más que fácil por tener más tiempo; el fallo no suma y la racha reinicia
- [ ] 2.5 Testear `validateQuestions`: acepta `image`/`imageAlt`/`links` válidos y rechaza `links` con `href` inválido

## 3. Verificación

- [ ] 3.1 Ejecutar `pnpm test` y verificar que toda la suite pasa
- [ ] 3.2 Ejecutar `pnpm build` y verificar que el proyecto sigue compilando
