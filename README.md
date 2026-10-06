# El Hombre de Amarillo

[![Vercel](https://vercelbadge.vercel.app/api/frodriguezmtnz/elhombredeamarillo)](https://elhombredeamarillo.vercel.app)
[![CI](https://github.com/frodriguezmtnz/elhombredeamarillo/actions/workflows/ci.yml/badge.svg)](https://github.com/frodriguezmtnz/elhombredeamarillo/actions/workflows/ci.yml)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.185-000000?logo=three.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_Auth-3FCF8E?logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-package_manager-F69220?logo=pnpm&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-lint_%2B_format-60A5FA?logo=biome&logoColor=white)

Web de contenido y comunidad para el canal de YouTube `@koiboy_OG`, dedicado al análisis, las teorías y los debates sobre la serie FROM.

Cuatro espacios conectados con estética de archivo de investigación:

- **Inicio (`/`)** — Umbral cinematográfico con hero, portales a las secciones y últimos vídeos del canal.
- **Vídeos (`/videos`)** — Biblioteca audiovisual con búsqueda, filtros, orden, paginación, vídeo destacado y directorio de creadores.
- **Expedientes (`/expedientes`)** — Muro de teorías con conexiones interactivas, cronología de investigación y archivo comunitario de misterios votables.
- **Trivial (`/trivial`)** — Prueba de iniciación: preguntas sobre el pueblo con rangos, tablón verificado y modos hasta la T4 / sin spoilers.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | [Astro 7](https://astro.build) (estático + islands) |
| UI | React 19 (`@astrojs/react`) |
| Estilos | Tailwind CSS v4 (plugin Vite) |
| 3D | Three.js (imports dinámicos para code-splitting) |
| Backend / Auth | Supabase (PostgreSQL + Auth + Realtime) |
| Analytics | Vercel Analytics + Speed Insights |
| Fuentes | Self-hosted con `@fontsource` |
| Lint / Format | Biome |
| Package manager | pnpm |
| Deploy | Vercel (+ Docker/nginx alternativo) |
| PWA | Service worker + `manifest.webmanifest` |

## Requisitos

- Node.js 22+
- pnpm

## Puesta en marcha

```bash
pnpm install
pnpm dev
```

Comandos útiles:

```bash
pnpm build     # build de producción (output: dist/)
pnpm preview   # sirve el build localmente
pnpm lint      # biome check
pnpm lint:fix  # biome check --write
pnpm icons     # regenera los iconos PWA desde favicon.svg
pnpm thumbs    # descarga las miniaturas de vídeos a public/assets/thumbs/
pnpm video:add <videoId> --code="..." --description="..."  # añade un vídeo a Supabase
pnpm video:sync # siembra la tabla desde src/data/videos.ts (solo inicial)
```

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores (pide las credenciales de Supabase).

```env
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...   # solo scripts locales
```

`SUPABASE_SERVICE_ROLE_KEY` (Dashboard > Settings > API > service_role) **nunca** debe exponerse al frontend ni a Vercel; se usa únicamente desde `pnpm video:sync` y `pnpm video:add`.

## Base de datos

El esquema y los datos semilla de Supabase viven en `supabase/` (`001_schema.sql`, `002_seed.sql`, `003_trivial.sql`, `004_trivial_verified_scores.sql` para el tablón del Trivial y `005_videos.sql` para el catálogo de vídeos).

## Estructura

```
src/
├── components/
│   ├── cases/        # Muro de expedientes (React islands)
│   ├── community/    # Comunidad: misterios, votos, auth (React islands)
│   ├── effects/      # Efectos visuales y escenas Three.js
│   ├── ui/           # Header, Footer, Icon, Pagination
│   └── videos/       # Biblioteca de vídeos (React islands)
├── data/             # Respaldo estático (vídeos) y contenido editorial (expedientes, trivial.json)
├── layouts/          # BaseLayout
├── lib/              # Helpers y clientes (youtube, supabase, videos, utils)
├── pages/            # index, videos, expedientes, trivial, sitemap.xml
└── styles/           # global.css (Tailwind + variables)
```

El contenido editorial de expedientes sigue siendo estático en `src/data/*.ts`; la comunidad y el **catálogo de vídeos** viven en Supabase. La tabla `videos` es la fuente de verdad: el build (JSON-LD, vídeo destacado y portada) y la página de vídeos la leen, con `src/data/videos.ts` como respaldo si Supabase no está disponible. Añadir un vídeo no requiere redeploy:

```bash
pnpm video:add <videoId> --code="T5 // TEORÍA" --description="..." --category=analysis
```

`pnpm video:add` trae el título real desde YouTube (oEmbed) y hace upsert; el vídeo aparece en `/videos` en segundos. La fecha se fija con `--published-at=2026-07-14` y el orden con `--order=250` (por defecto, el último + 10). Después, `pnpm thumbs` descarga su miniatura (detecta IDs tanto en `src/` como en la tabla) y una PR con la imagen hace que el siguiente build refresque el destacado, la portada y el SEO. El flujo completo está descrito en `.opencode/skills/publish-video/`.

> `pnpm video:sync` es solo para sembrar la tabla desde el estático: **sobrescribe** los cambios hechos en Supabase Studio, así que no lo ejecutes tras editar desde Supabase.

## OpenSpec

El comportamiento del proyecto se documenta como **specs** ([OpenSpec](https://github.com/Fission-AI/OpenSpec)) antes de tocar código, para que equipo e IA acuerden qué cambia:

- `openspec/specs/` — fuente de verdad de lo que hace el sistema (trivial-game, comunidad, expedientes, videos, pwa-offline, autenticacion).
- `openspec/changes/` — cambios propuestos o en curso (`proposal.md`, `specs/`, `tasks.md`); los completados pasan a `changes/archive/`.

Flujo de trabajo:

```bash
/opsx-explore            # pensar una idea sin comprometerla
/opsx-propose <nombre>   # crear el cambio (proposal + specs + tasks)
/opsx-apply <nombre>     # implementar marcando las tasks
/opsx-archive <nombre>   # archivar y actualizar las specs
```

Regla: el feedback nuevo entra por `propose` (no directamente a código) y cada merge archiva su cambio.

## Deploy

El proyecto está pensado para Vercel (build: `pnpm build`, output: `dist`). También incluye `Dockerfile` + `nginx.conf` para autoalojamiento.
