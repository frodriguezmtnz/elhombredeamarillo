# Tasks

## 1. Workflow

- [x] 1.1 Crear `.github/workflows/ci.yml` con Node 22 (README exige 22+; la task decía 20) y pnpm 10 (usar `pnpm/action-setup` y caché de store) y verificar que el YAML es válido — **validado con `js-yaml`**
- [x] 1.2 Añadir los pasos `pnpm install --frozen-lockfile`, `pnpm lint` y `pnpm build`, y verificar que el build del workflow pasa en un PR de prueba
- [x] 1.3 Añadir el paso informativo de OpenSpec (`npx -y @fission-ai/openspec@1.13.1 validate --changes --strict` y `--specs --strict`, `OPENSPEC_TELEMETRY=0`, `continue-on-error`) y verificar su salida — **se usa `--changes`/`--specs` porque `validate --strict` a secas es interactivo**

## 2. Verificación

- [x] 2.1 Abrir un PR de prueba y verificar que el workflow se dispara, pasa lint y build, y que los checks aparecen en el PR
- [x] 2.2 Añadir el check `ci` a los required status checks de `main` (junto a Vercel) y verificar que la protección lo exige
