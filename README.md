# El Hombre de Amarillo

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
pnpm video:sync # sube a Supabase los vídeos de src/data/videos.ts
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
├── data/             # Contenido editorial estático (vídeos, expedientes, trivial.json)
├── layouts/          # BaseLayout
├── lib/              # Helpers y clientes (youtube, supabase, utils)
├── pages/            # index, videos, expedientes, trivial, sitemap.xml
└── styles/           # global.css (Tailwind + variables)
```

El contenido editorial de expedientes se gestiona como datos estáticos en `src/data/*.ts`; la comunidad es dinámica y vive en Supabase. El catálogo de **vídeos** se pinta primero desde `src/data/videos.ts` (SEO y respaldo) y se refresca en runtime con la tabla `videos` de Supabase, de modo que añadir un vídeo no requiere redeploy:

```bash
pnpm video:add <videoId> --code="T5 // TEORÍA" --description="..." --category=analysis
```

`pnpm video:add` trae el título real desde YouTube (oEmbed) y hace upsert en Supabase; el vídeo aparece en `/videos` en segundos. La fecha de publicación se puede fijar con `--published-at=2026-07-14` y el orden con `--order=250` (por defecto, el último + 10). Las miniaturas siguen auto-hospedándose en `public/assets/thumbs/` con `pnpm thumbs` (o el respaldo remoto de YouTube si no existe la local).

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
