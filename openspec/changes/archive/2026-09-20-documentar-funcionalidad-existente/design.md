# Design

## Contexto

Adopción de OpenSpec en un repositorio brownfield (Astro 7 estático + islas React + Tailwind v4 + Supabase + Vercel). El objetivo de este cambio es **solo documental**: capturar el comportamiento ya existente como specs para tener una fuente de verdad compartida.

## Enfoque

- Se usa el schema `spec-driven` con perfil `core` (explore, propose, apply, archive) y artefactos en español (cada `## Purpose`/requisito usa SHALL y escenarios WHEN/THEN, manteniendo las cabeceras estructurales en inglés).
- Las capacidades se documentan por dominio funcional, no por archivo: `trivial-game`, `comunidad`, `expedientes`, `videos`, `pwa-offline`, `autenticacion`.
- Las specs describen **comportamiento observable** (qué puede hacer el usuario), no detalles internos de implementación.
- No se modifica ningún archivo de `src/` ni `public/`; el cambio no altera el runtime.

## Especificaciones derivadas del código

| Capacidad | Fuentes leídas |
| --- | --- |
| `trivial-game` | `src/components/trivial/*`, `src/data/trivial.{ts,json}`, `src/lib/{types,trivial-service}.ts` |
| `comunidad` | `src/components/community/{CommunityBoard,MysteryDetail,ProposeHypothesis,VoteButton}.tsx` |
| `expedientes` | `src/components/cases/*`, `src/data/cases.ts` |
| `videos` | `src/components/videos/*`, `src/data/videos.ts`, `src/lib/youtube.ts` |
| `pwa-offline` | `public/sw.js`, `public/manifest.webmanifest` |
| `autenticacion` | `src/components/community/{AuthProvider,AuthBar,LoginForm,UserMenu}.tsx`, `src/lib/supabase-browser.ts` |

## Riesgos y límites

- Las specs describen el estado actual; pueden quedar imprecisiones de contenido editorial (p. ej. banco de preguntas). Se irán afinando con los cambios.
- El archivo `openspec/` y `.opencode/` son nuevos y no afectan al build ni al despliegue.

## Open Questions

- Ninguna bloqueante para este cambio.
