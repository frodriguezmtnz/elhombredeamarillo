# Tasks

## 1. Inventario

- [x] 1.1 Ejecutar `pnpm lint` y volcar la lista completa de diagnósticos, verificando cuántos son errores y en qué archivos — **31 errores / 64 avisos en 134 archivos** (17 de formato, 7 de organizeImports, 7 de reglas; los 64 avisos eran falsos positivos de `.astro`)

## 2. Correcciones

- [x] 2.1 Resolver las variables sin usar de los frontmatter `.astro` (renombrar con `_` o eliminar) y verificar que desaparecen los avisos — **se desactivan `noUnusedVariables`/`noUnusedImports` para `**/*.astro` vía override** (Biome no parsea la plantilla y son falsos positivos)
- [x] 2.2 Aplicar el orden de imports sugerido por Biome en los archivos afectados (sin ejecutar `--write` sobre `.astro` para no perder imports usados en plantilla) y verificar con `biome check` — **`biome check --write .` sobre 7 archivos, ya sin riesgo al estar off la regla en `.astro`**
- [x] 2.3 Formatear `public/sw.js` y verificar que Biome no reporta formato — **ya quedó formateado en la PR #3; sin diagnóstico**
- [x] 2.4 Decidir y aplicar el tratamiento de `src/data/trivial.json` (override/ignore en `biome.json`) y verificar el resultado — **formatter desactivado por override para `src/data/trivial.json` y `public/assets/lottie/*.json`** (legibles y diffeables)

## 3. Verificación

- [x] 3.1 Ejecutar `pnpm lint` y verificar que termina con código de salida 0 — **0 errores / 0 avisos, exit 0**
- [x] 3.2 Ejecutar `pnpm build` y verificar que sigue compilando — **build ✓**
