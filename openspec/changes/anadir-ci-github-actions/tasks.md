# Tasks

## 1. Workflow

- [ ] 1.1 Crear `.github/workflows/ci.yml` con Node 20 y pnpm (usar `pnpm/action-setup` y caché de store) y verificar que el YAML es válido
- [ ] 1.2 Añadir los pasos `pnpm install --frozen-lockfile`, `pnpm lint` y `pnpm build`, y verificar que el build del workflow pasa en un PR de prueba
- [ ] 1.3 Añadir el paso informativo `npx @fission-ai/openspec validate --strict` (sin bloquear) y verificar su salida

## 2. Verificación

- [ ] 2.1 Abrir un PR de prueba y verificar que el workflow se dispara, pasa lint y build, y que los checks aparecen en el PR
