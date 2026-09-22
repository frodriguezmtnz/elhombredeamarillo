# Tasks

## 1. Inventario

- [ ] 1.1 Ejecutar `pnpm lint` y volcar la lista completa de diagnósticos, verificando cuántos son errores y en qué archivos

## 2. Correcciones

- [ ] 2.1 Resolver las variables sin usar de los frontmatter `.astro` (renombrar con `_` o eliminar) y verificar que desaparecen los avisos
- [ ] 2.2 Aplicar el orden de imports sugerido por Biome en los archivos afectados (sin ejecutar `--write` sobre `.astro` para no perder imports usados en plantilla) y verificar con `biome check`
- [ ] 2.3 Formatear `public/sw.js` y verificar que Biome no reporta formato
- [ ] 2.4 Decidir y aplicar el tratamiento de `src/data/trivial.json` (override/ignore en `biome.json`) y verificar el resultado

## 3. Verificación

- [ ] 3.1 Ejecutar `pnpm lint` y verificar que termina con código de salida 0
- [ ] 3.2 Ejecutar `pnpm build` y verificar que sigue compilando
