# Proposal

## Why

El proyecto está en producción y su comportamiento vive repartido entre el código, conversaciones y PRs, sin una fuente de verdad acordada. Adoptar OpenSpec ahora permite que equipo e IA lean qué hace el sistema antes de cambiarlo, y deja un backlog trazable de mejoras pendientes.

## What Changes

- Inicializar OpenSpec en el repositorio (schema `spec-driven`, perfil `core`) para opencode, con artefactos en español.
- Documentar como specs las capacidades existentes: juego del trivial, tablero comunitario, expedientes, vídeos, PWA/offline y autenticación.
- Dejar el backlog de mejoras como cambios independientes (lint baseline, CI, tests y decisión de audio), sin implementarlos aquí.
- No hay cambios de comportamiento en runtime.

## Capabilities

### New Capabilities

- `trivial-game`: juego de preguntas sobre FROM con modos, mazo barajado, puntuación, temporizador por dificultad, cuenta atrás con campana, resultados y tablón verificado.
- `comunidad`: tablero de misterios con hipótesis votables, propuestas de usuario y modo stream.
- `expedientes`: archivo editorial de teorías con filtros, conexiones entre casos y vista de línea temporal.
- `videos`: catálogo de vídeos del canal con referencias y directorio de creadores invitados.
- `pwa-offline`: aplicación instalable con manifest y service worker con estrategias de caché resilientes.
- `autenticacion`: sesión con Supabase (login/registro modal) y degradación elegante sin credenciales.

### Modified Capabilities

_(ninguna)_

## Impact

- **Nuevos**: `openspec/` (specs y cambios) y `.opencode/` (skills y comandos `/opsx-*`).
- **Sin cambios de runtime**: no se toca `src/`, `public/` ni dependencias de producción.
- **Referencias usadas para documentar**: `src/components/trivial/*`, `src/components/community/*`, `src/components/cases/*`, `src/components/videos/*`, `src/pages/*`, `public/sw.js`, `public/manifest.webmanifest`, `src/lib/supabase*.ts`.
