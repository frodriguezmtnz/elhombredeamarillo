# Proposal

## Why

El repositorio no tiene integración continua: nada verifica en los PRs que el proyecto compila o que pasa el linter. Los errores se descubren a mano y tarde, y el despliegue depende de un build manual correcto.

## What Changes

- Añadir un workflow de GitHub Actions que en cada PR y push a `main` instale dependencias, ejecute el linter y compile el sitio.
- Incluir la validación de OpenSpec (`openspec validate --strict`) como paso informativo una vez esté la línea base de lint.
- No se añade despliegue automático: Vercel ya lo gestiona.

## Impact

- Nuevo `.github/workflows/ci.yml`.
- Depende del cambio `corregir-lint-baseline` para que el paso de lint sea exigible.
- Sin cambios de runtime.
