# El Hombre de Amarillo

Web de contenido y comunidad para el canal de YouTube `@koiboy_OG`, dedicado al análisis, las teorías y los debates sobre la serie FROM.

Tres espacios conectados con estética de archivo de investigación:

- **Inicio (`/`)** — Umbral cinematográfico con hero, portales a las secciones y últimos vídeos del canal.
- **Vídeos (`/videos`)** — Biblioteca audiovisual con búsqueda, filtros, orden, paginación, vídeo destacado y directorio de creadores.
- **Expedientes (`/expedientes`)** — Muro de teorías con conexiones interactivas, cronología de investigación y archivo comunitario de misterios votables.

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
```

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores (pide credenciales a Supabase/YouTube).

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
YOUTUBE_API_KEY=AIzaSy...
```

## Base de datos

El esquema y los datos semilla de Supabase viven en `supabase/` (`001_schema.sql`, `002_seed.sql`).

## Estructura

```
src/
├── components/
│   ├── cases/        # Muro de expedientes (React islands)
│   ├── community/    # Comunidad: misterios, votos, auth (React islands)
│   ├── effects/      # Efectos visuales y escenas Three.js
│   ├── ui/           # Header, Footer, Icon, Pagination
│   └── videos/       # Biblioteca de vídeos (React islands)
├── data/             # Contenido editorial estático (vídeos, expedientes)
├── layouts/          # BaseLayout
├── lib/              # Helpers y clientes (youtube, supabase, utils)
├── pages/            # index, videos, expedientes, sitemap.xml
└── styles/           # global.css (Tailwind + variables)
```

El contenido editorial (vídeos y expedientes) se gestiona como datos estáticos en `src/data/*.ts`; la comunidad es dinámica y vive en Supabase.

## Deploy

El proyecto está pensado para Vercel (build: `pnpm build`, output: `dist`). También incluye `Dockerfile` + `nginx.conf` para autoalojamiento.
