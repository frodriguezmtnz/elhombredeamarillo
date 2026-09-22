# Tasks

## 1. Inicialización

- [x] 1.1 Ejecutar `openspec init --tools opencode --language es --profile core` y verificar que existen `openspec/config.yaml`, `openspec/specs/` y `.opencode/`
- [x] 1.2 Redactar el contexto del proyecto en `openspec/config.yaml` (stack, comandos y convenciones) y verificar que OpenSpec lo muestra en `openspec context`

## 2. Specs brownfield

- [x] 2.1 Documentar `trivial-game` y verificar que cada requisito tiene al menos un escenario con 4 almohadillas
- [x] 2.2 Documentar `comunidad` y verificar los flujos de voto y propuesta
- [x] 2.3 Documentar `expedientes`, `videos`, `pwa-offline` y `autenticacion`
- [x] 2.4 Ejecutar `openspec validate documentar-funcionalidad-existente --strict` y verificar que pasa
- [x] 2.5 Archivar el cambio y verificar que `openspec/specs/` contiene las seis capacidades con su propósito

## 3. Backlog

- [x] 3.1 Crear el cambio `corregir-lint-baseline` con proposal, specs y tasks
- [x] 3.2 Crear el cambio `anadir-ci-github-actions` con proposal, specs y tasks
- [x] 3.3 Crear el cambio `anadir-tests-core` con proposal, specs y tasks
- [x] 3.4 Crear el cambio `decision-audio-trivial` con proposal, specs y tasks
- [x] 3.5 Ejecutar `openspec validate --strict` sobre cada cambio del backlog y verificar que pasan

## 4. Verificación final

- [x] 4.1 Ejecutar `openspec list` y `openspec list --specs` y verificar el inventario
- [x] 4.2 Ejecutar `pnpm build` y verificar que el proyecto sigue compilando
