# Plan de Desarrollo — Migración a Astro + React + Tailwind + Supabase

> **Proyecto:** El Hombre de Amarillo — Web de contenido y comunidad
> **Stack objetivo:** Astro 5.x / React 19 / Tailwind CSS v4 / Supabase / TypeScript
> **Deployment:** Vercel
> **Estado:** En planificación — No se modifica el código hasta completar cada fase

---

## Decisiones técnicas adoptadas

| Decisión | Elección | Motivo |
|----------|----------|--------|
| Framework | **Astro 5.x** | Static-first + islands de interactividad. Ideal para sitio 80% estático |
| UI Library | **React 19** | Solo para islands interactivos, no para todo el sitio |
| Estilos | **Tailwind CSS v4** | Utility-first, migración completa包括 premium CSS |
| Backend | **Supabase** | PostgreSQL + Auth + Realtime + API REST automática |
| Auth | **Google / GitHub** | Supabase Auth con proveedores sociales |
| Comunidad | **Solo lectura + votos** | Sin envío de hipótesis desde la web |
| Datos vídeos | **Estáticos en `src/data/*.ts`** | Contenido editorial que solo gestiona el autor |
| Lint/Format | **Biome** | Más rápido que ESLint + Prettier, zero config |
| Package manager | **pnpm** | Rápido, eficiente en disco |
| Language | **TypeScript** | Tipado en toda la nueva base de código |

---

## Mapeo de archivos existentes → nuevos destinos

### Datos

| Archivo actual | Nuevo destino | Notas |
|----------------|---------------|-------|
| `data.js` | `src/data/videos.ts` | Convertir a TypeScript, exportar tipos |
| `expedientes-data.js` | `src/data/cases.ts` | Convertir a TypeScript, exportar tipos |

### Helpers / utilidades (código duplicado → centralizado)

| Archivo actual | Ubicación actual | Nuevo destino |
|----------------|------------------|---------------|
| `escapeHtml()` | `app.js:15-19` / `expedientes.js:33-37` / `misterios-comunidad.js:104-106` | `src/lib/utils.ts` |
| `normalizeText()` | `app.js:21-27` / `expedientes.js:39-45` / `misterios-comunidad.js:114-118` | `src/lib/utils.ts` |
| `$`, `$$` | `app.js:5-6` / `expedientes.js:9-10` / `misterios-comunidad.js:81-82` | No necesario (React/JSX) |
| `thumbnailUrl()` | `app.js:31-37` | `src/lib/youtube.ts` |
| `youtubeUrl()` | `app.js:41-53` / `expedientes.js:47-51` | `src/lib/youtube.ts` |
| `relativeTime()` | `app.js:71-74` | `src/lib/utils.ts` |
| `formatChannelNumber()` | `app.js:77-78` | `src/lib/utils.ts` |
| `episodeScore()` | `app.js:80-103` | `src/lib/utils.ts` |
| `creatorInitials()` | `app.js:105-108` | `src/lib/utils.ts` |

### Layouts y componentes

| Archivo actual | Nuevo destino | Tipo |
|----------------|---------------|------|
| `<header>` (HTML inline en cada `.html`) | `src/components/ui/Header.astro` | Estático |
| `<footer>` (HTML inline en cada `.html`) | `src/components/ui/Footer.astro` | Estático |
| Hero de home (`index.html:43-118`) | `src/components/home/Hero.astro` | Estático |
| Portal grid (`index.html:123-154`) | `src/components/home/PortalGrid.astro` | Estático |
| Manifesto (`index.html:156-161`) | `src/components/home/Manifesto.astro` | Estático |
| Featured video (`index.html:166-202`) | `src/components/home/RecentVideo.astro` | Estático |
| Canal card (`index.html:206-226`) | `src/components/home/ChannelCard.astro` | Estático |
| CTA final (`index.html:228-242`) | `src/components/home/FinalCTA.astro` | Estático |
| Hero de vídeos (`videos.html:36-52`) | `src/components/videos/VideoHero.astro` | Estático |
| Featured video section (`videos.html:54-107`) | `src/components/videos/FeaturedVideo.tsx` | React island |
| Canal card section (`videos.html:109-133`) | `src/components/videos/ChannelCard.tsx` | React island |
| Video grid (`videos.html:136-158`) | `src/components/videos/VideoGrid.tsx` | React island |
| Video card individual | `src/components/videos/VideoCard.tsx` | React island |
| Video filters (`videos.html:77-98`) | `src/components/videos/VideoFilters.tsx` | React island |
| Pagination (`videos.html:99-103`) | `src/components/ui/Pagination.tsx` | React island |
| Creator directory (`videos.html:490-547`) | `src/components/videos/CreatorDirectory.tsx` | React island |
| Hero de expedientes (`expedientes.html:25-49`) | `src/components/cases/CasesHero.astro` | Estático |
| Archive panel (`expedientes.html:51-103`) | `src/components/cases/ArchivePanel.astro` | Estático |
| Case grid (board) | `src/components/cases/CaseGrid.tsx` | React island |
| Case card individual | `src/components/cases/CaseCard.tsx` | React island |
| Case dialog/modal | `src/components/cases/CaseDialog.tsx` | React island |
| Case connections SVG | `src/components/cases/CaseConnections.tsx` | React island |
| Case timeline | `src/components/cases/CaseTimeline.tsx` | React island |
| Archive method section | `src/components/cases/ArchiveMethod.astro` | Estático |
| Mystery lab header (`expedientes.html:106-115`) | `src/components/community/MysteryLabHeader.astro` | Estático |
| Mystery process (`expedientes.html:118-123`) | `src/components/community/MysteryProcess.astro` | Estático |
| Mystery dashboard (`expedientes.html:126-130`) | `src/components/community/CommunityStats.tsx` | React island |
| Mystery toolbar (`expedientes.html:132-154`) | `src/components/community/MysteryToolbar.tsx` | React island |
| Mystery list (cards) | `src/components/community/MysteryList.tsx` | React island |
| Mystery detail | `src/components/community/MysteryDetail.tsx` | React island |
| Vote button | `src/components/community/VoteButton.tsx` | React island |
| Stream mode dialog | `src/components/community/StreamMode.tsx` | React island |
| Submit mystery dialog (`expedientes.html:175-197`) | **No migrar** | Solo lectura + votos |
| Login button | `src/components/community/LoginButton.tsx` | React island |
| User menu | `src/components/community/UserMenu.tsx` | React island |

### Estilos

| Archivo actual | Nuevo destino | Notas |
|----------------|---------------|-------|
| `styles.css` (base: 1-348) | `src/styles/global.css` + clases Tailwind | Variables, reset, tipografías, utilidades |
| `styles.css` (home: 349-706) | Clases Tailwind en componentes `.astro` | Migrar a utility classes |
| `styles.css` (videos: 710-1085) | Clases Tailwind en componentes `.tsx` | Migrar a utility classes |
| `premium.css` | `src/styles/premium.css` + clases Tailwind | Migración completa a Tailwind |
| `expedientes.css` | Clases Tailwind en componentes | Migración completa a Tailwind |
| `misterios-comunidad.css` | Clases Tailwind en componentes | Migración completa a Tailwind |

### Efectos / animaciones

| Archivo actual | Nuevo destino | Tipo |
|----------------|---------------|------|
| `premium.js` (ScrollProgress) | `src/components/effects/ScrollProgress.tsx` | React island |
| `premium.js` (pointer light) | `src/components/effects/PointerLight.tsx` | React island |
| `premium.js` (reveal on scroll) | `src/components/effects/RevealOnScroll.tsx` | React island |
| `premium.js` (magnetic buttons) | `src/components/effects/MagneticButtons.tsx` | React island |
| `premium.js` (counter animation) | `src/components/effects/CounterAnimation.tsx` | React island |
| `premium.js` (case board depth) | `src/components/effects/CaseBoardDepth.tsx` | React island |
| `premium.js` (hero tilt) | `src/components/effects/HeroTilt.tsx` | React island |

### API / Backend

| Archivo actual | Nuevo destino | Notas |
|----------------|---------------|-------|
| `api/youtube.js` | `src/pages/api/youtube.ts` | Convertir a TypeScript |
| — | `src/pages/api/votes.ts` | Nuevo: CRUD de votos |
| — | `src/pages/api/auth/callback.ts` | Nuevo: callback Supabase Auth |
| — | `src/lib/supabase.ts` | Nuevo: cliente Supabase server |
| — | `src/lib/supabase-browser.ts` | Nuevo: cliente Supabase browser |

### Páginas

| Archivo actual | Nuevo destino |
|----------------|---------------|
| `index.html` | `src/pages/index.astro` |
| `videos.html` | `src/pages/videos.astro` |
| `expedientes.html` | `src/pages/expedientes.astro` |

### Assets / configuración

| Archivo actual | Nuevo destino | Notas |
|----------------|---------------|-------|
| `assets/**` | `public/assets/**` | Sin cambios de contenido |
| `abrir_web.bat` | Eliminar | Vite tiene su propio dev server |
| `abrir-web.command` | Eliminar | Vite tiene su propio dev server |
| `readme.md` | `README.md` | Actualizar con nuevo stack |

---

## Fase 1 — Setup del proyecto y migración estática

**Objetivo:** Proyecto Astro funcionando en Vercel con las 3 páginas renderizando contenido estático. Sin JavaScript dinámico.
**Duración estimada:** 8-10 horas
**Dependencias:** Ninguna (fase inicial)

### 1.1 Inicialización del proyecto
- [ ] Ejecutar `pnpm create astro@latest` con template basics
- [ ] Instalar integración React: `pnpm astro add react`
- [ ] Instalar Tailwind CSS v4: `pnpm astro add tailwind`
- [ ] Instalar Biome: `pnpm add -D @biomejs/biome`
- [ ] Configurar `biome.json` (format + lint)
- [ ] Configurar `tsconfig.json` con path aliases:
  - `@/` → `src/`
  - `@components/` → `src/components/`
  - `@lib/` → `src/lib/`
  - `@data/` → `src/data/`
- [ ] Crear `.env.local` con variables (valores vacíos):
  ```
  SUPABASE_URL=
  SUPABASE_ANON_KEY=
  YOUTUBE_API_KEY=
  ```
- [ ] Crear `.env.example` con las mismas variables (sin valores)
- [ ] Añadir `.env.local` a `.gitignore`
- [ ] Verificar que `pnpm dev` arranca sin errores
- [ ] Verificar que `pnpm build` completa sin errores

### 1.2 Crear layout base
- [ ] Crear `src/layouts/BaseLayout.astro`:
  - `<head>` completo (charset, viewport, title dinámico via prop)
  - Open Graph básico (og:title, og:description, og:type)
  - Favicon → `public/assets/favicon.svg`
  - Google Fonts (CDN o self-hosted)
  - Slot para `<slot />`
  - `<slot name="head" />` para meta extra por página
- [ ] Crear `src/layouts/HomeLayout.astro` (extiende BaseLayout, añade efectos premium)
- [ ] Crear `src/layouts/PageLayout.astro` (extiende BaseLayout, añade header de página)

### 1.3 Migrar Header y Footer
- [ ] Crear `src/components/ui/Header.astro`:
  - Migrar HTML de `index.html:10-41`
  - Logo SVG inline
  - Navegación: INICIO / VÍDEOS / EXPEDIENTES
  - Menú hamburguesa para móvil
  - Lógica de menú como `<script>` inline (sin React, sin import)
  - Clase `is-scrolled` con JS inline
- [ ] Crear `src/components/ui/Footer.astro`:
  - Migrar HTML de `index.html:275-298`
  - Enlaces de canal (YouTube)
  - Créditos

### 1.4 Crear helpers centralizados
- [ ] Crear `src/lib/utils.ts`:
  ```typescript
  export function escapeHtml(value: unknown): string
  export function normalizeText(value: unknown): string
  export function relativeTime(publishedAt: string | null): string
  export function formatChannelNumber(count: string | null): string
  export function episodeScore(video: VideoData): number
  export function creatorInitials(name: string): string
  export function formatDate(dateString: string): string
  ```
- [ ] Crear `src/lib/youtube.ts`:
  ```typescript
  export function thumbnailUrl(videoId: string, quality?: string): string
  export function youtubeUrl(videoId: string): string
  export function channelUrl(handle: string): string
  ```

### 1.5 Crear tipos TypeScript
- [ ] Crear `src/lib/types.ts`:
  ```typescript
  interface VideoData { videoId, title, category, tags, publishedAt, description, slug, creator }
  interface CreatorData { id, name, slug, role, avatar, channelUrl }
  interface ChannelData { name, handle, description, avatar, banner, subscriberCount, videoCount }
  interface DossierData { id, number, category, categoryLabel, status, statusTone, title, shortTitle, summary, thesis, evidence, doubts, tags, sourceIds, related }
  interface SourceData { id, order, phase, code, kind, title, summary, dossiers, videoId?, searchTitle? }
  interface MysteryData { id, code, title, shortTitle, category, context, contributors, mentions, hypotheses[] }
  interface HypothesisData { id, title, description, author, votes }
  ```

### 1.6 Migrar datos
- [ ] Crear `src/data/videos.ts`:
  - Migrar `CHANNEL` de `data.js:63-75`
  - Migrar `CREATORS` de `data.js:38-59`
  - Migrar `VIDEOS` de `data.js:123-325`
  - Exportar como `const` con tipos
  - Incluir funciones helper (`getFeaturedVideo`, `getVideosByCategory`, etc.)
- [ ] Crear `src/data/cases.ts`:
  - Migrar `FROM_CASES` de `expedientes-data.js`
  - Exportar `dossiers`, `sources`, `meta`
  - Incluir funciones helper (`getDossierById`, `getSourceById`, etc.)

### 1.7 Migrar página de Inicio
- [ ] Crear `src/pages/index.astro`:
  - Hero section (HTML estático, migrar de `index.html:43-118`)
  - Portal grid (HTML estático, migrar de `index.html:123-154`)
  - Manifesto (HTML estático, migrar de `index.html:156-161`)
  - Featured video (HTML estático, migrar de `index.html:166-202`)
  - Canal card (HTML estático, migrar de `index.html:206-226`)
  - Final CTA (HTML estático, migrar de `index.html:228-242`)
  - Portal links con rutas correctas: `/videos`, `/expedientes`
- [ ] Migrar estilos de home a Tailwind (de `styles.css:349-706`)
  - Hero section → clases Tailwind
  - Portal cards → clases Tailwind
  - Manifesto → clases Tailwind
  - Video destacad → clases Tailwind
  - Canal card → clases Tailwind
  - Footer home → clases Tailwind
- [ ] Verificar que la página se renderiza correctamente

### 1.8 Migrar CSS base a Tailwind
- [ ] Configurar `src/styles/global.css`:
  - Importar Tailwind: `@import "tailwindcss"`
  - Variables CSS custom (migrar de `styles.css:11-34`):
    ```css
    --bg, --surface, --surface-raised, --border, --text, --text-muted,
    --yellow, --yellow-bright, --yellow-glow, --yellow-soft, --amber, --amber-hot,
    --rust, --rust-hot, --ivory, --muted, --dim, --line
    ```
  - Fuentes (migrar de `styles.css:41-46`):
    ```css
    --font-display: "Space Grotesk", sans-serif;
    --body-font: "Inter", sans-serif;
    --mono-font: "JetBrains Mono", monospace;
    --pixel: "VT323", monospace;
    ```
  - CSS reset base (migrar de `styles.css:56-107`)
  - Utilidades custom que no se pueden expresar con Tailwind (migrar de `styles.css:109-230`):
    - `.hero-fade`, `.hero-content`, `.hero-eyebrow`, `.hero-title`
    - `.glow-button`, `.glow-button::before`
    - `.section-eyebrow`, `.section-head`
    - `.avatar-ring`, `.avatar-ring-glow`
    - `.glass-badge`, `.glass-card`
    - `.scroll-progress`, `.page-loaded`
    - `@keyframes` personalizados
  - Scrollbar custom (migrar de `styles.css:240-246`)
  - Visually hidden utility (migrar de `styles.css:342-351`)
- [ ] Verificar que Tailwind funciona correctamente
- [ ] Verificar que las variables CSS están disponibles

### 1.9 Migrar página de Vídeos (estática)
- [ ] Crear `src/pages/videos.astro`:
  - Hero section (HTML estático, migrar de `videos.html:36-52`)
  - Placeholder para featured video (se completa en Fase 2)
  - Placeholder para canal card (se completa en Fase 2)
  - Placeholder para grid de vídeos (se completa en Fase 2)
  - Placeholder para directorio de creadores (se completa en Fase 2)
- [ ] Migrar estilos de vídeos a Tailwind (de `styles.css:710-1085`)

### 1.10 Migrar página de Expedientes (estática)
- [ ] Crear `src/pages/expedientes.astro`:
  - Cases hero (HTML estático, migrar de `expedientes.html:25-49`)
  - Archive panel header (HTML estático, migrar de `expedientes.html:51-67`)
  - Placeholder para archive toolbar (se completa en Fase 2)
  - Placeholder para case board (se completa en Fase 2)
  - Placeholder para case timeline (se completa en Fase 2)
  - Archive method section (HTML estático, migrar de `expedientes.html:218-228`)
  - Mystery lab header (HTML estático, migrar de `expedientes.html:106-115`)
  - Mystery process (HTML estático, migrar de `expedientes.html:118-123`)
  - Placeholder para mystery dashboard (se completa en Fase 2)
  - Mystery lab footer (HTML estático, migrar de `expedientes.html:169-172`)
- [ ] Migrar estYLES de expedientes a Tailwind (de `expedientes.css`)

### 1.11 Deploy inicial
- [ ] Conectar repositorio a Vercel
- [ ] Configurar build command: `pnpm build`
- [ ] Configurar output directory: `dist`
- [ ] Verificar que las 3 páginas se renderizan en Vercel
- [ ] Verificar responsive en 3 breakpoints (desktop, tablet, móvil)
- [ ] Verificar que los assets (imágenes, favicon) se cargan
- [ ] Verificar que Google Fonts se carga

### Criterio de aceptación Fase 1
- [ ] Las 3 páginas son visibles en Vercel
- [ ] Header y footer compartidos funcionan
- [ ] Navegación entre páginas funciona
- [ ] Responsive funciona en los 3 breakpoints
- [ ] No hay errores en consola del navegador
- [ ] `pnpm build` completa sin errores
- [ ] Lighthouse performance ≥ 90 (estático puro)

---

## Fase 2 — Islands interactivos

**Objetivo:** Añadir interactividad a Vídeos y Expedientes con React islands. La comunidad sigue con datos hardcodeados temporalmente.
**Duración estimada:** 10-12 horas
**Dependencias:** Fase 1 completada

### 2.1 Header interactivo
- [ ] Añadir menú hamburguesa funcional con JS inline en `Header.astro`
- [ ] Añadir clase `is-scrolled` al header al hacer scroll
- [ ] Añadir `<script>` inline para toggle del menú móvil
- [ ] Verificar que `aria-expanded` se actualiza correctamente

### 2.2 Video Filters (React island)
- [ ] Crear `src/components/videos/VideoFilters.tsx`:
  - Filtros: Todos / Análisis / Debate
  - Búsqueda por texto con debounce (150ms)
  - Orden: Recientes / Episodio / A-Z
  - Layout: Grid / Lista
  - Estado sincronizado con URL (query params)
  - Filtros: `?filter=all|analysis|debate`
  - Búsqueda: `?q=texto`
  - Layout: `?layout=grid|list`
  - Orden: `?sort=recent|episode|alpha`
- [ ] Integrar con `client:load` en `videos.astro`

### 2.3 Video Card + Grid (React island)
- [ ] Crear `src/components/videos/VideoCard.tsx`:
  - Tarjeta con thumbnail, meta, badges, enlace
  - Fallback de imagen (`onerror`)
  - Referencias del vídeo
  - Thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  - Fallback: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
  - Badges de creadores invitados
  - CTA "VER ANÁLISIS →"
- [ ] Crear `src/components/videos/VideoGrid.tsx`:
  - Renderiza lista de VideoCard
  - Lazy loading de imágenes
  - Animación de entrada
- [ ] Integrar en `videos.astro`

### 2.4 Featured Video (React island)
- [ ] Crear `src/components/videos/FeaturedVideo.tsx`:
  - Muestra el vídeo más reciente (calculado con `episodeScore`)
  - Thumbnail grande
  - Título, fecha relativa, descripción
  - Sección de referencias (links a otros vídeos)
- [ ] Integrar en `videos.astro`

### 2.5 Channel Card (React island)
- [ ] Crear `src/components/videos/ChannelCard.tsx`:
  - Datos del canal (nombre, suscriptores, total vídeos)
  - Avatar con borde gradient
  - Enlace a YouTube
  - Subscriber count formateado
- [ ] Integrar en `videos.astro`

### 2.6 Pagination (React island)
- [ ] Crear `src/components/ui/Pagination.tsx`:
  - 12 vídeos por página
  - Botones de página numerados
  - Anterior / Siguiente
  - Resumen: "Mostrando 1-12 de 48 vídeos"
- [ ] Integrar en `videos.astro`

### 2.7 Creator Directory (React island)
- [ ] Crear `src/components/videos/CreatorDirectory.tsx`:
  - Solo visible cuando filtro = "debate"
  - Tarjetas de creador: avatar, nombre, canal, participaciones
  - Enlace a canal de YouTube
- [ ] Integrar en `videos.astro`

### 2.8 Case Filters (React island)
- [ ] Crear `src/components/cases/CaseFilters.tsx`:
  - Filtros por categoría: Todos / Origen / Entidades / Salida / Objetos / Personajes / Reglas
  - Búsqueda por texto
  - Vista: Muro / Cronología
- [ ] Integrar en `expedientes.astro`

### 2.9 Case Grid + Cards (React island)
- [ ] Crear `src/components/cases/CaseCard.tsx`:
  - Tarjeta estilo "expediente físico"
  - Número, categoría, estado, título, resumen
  - Imagen de YouTube thumbnail
  - Footer con conteo de fuentes
  - Rotación CSS variable
  - `data-case-id` para conexiones
- [ ] Crear `src/components/cases/CaseGrid.tsx`:
  - Grid de 4 columnas
  - Renderiza CaseCards
- [ ] Integrar en `expedientes.astro`

### 2.10 Case Dialog (React island)
- [ ] Crear `src/components/cases/CaseDialog.tsx`:
  - Usa `<dialog>` nativo
  - Contenido completo del expediente:
    - Header con número, categoría, estado
    - Tesis central
    - Pruebas y conexiones
    - Dudas y límites
    - Evolución en vídeos (fuentes)
    - Expedientes relacionados (botones)
    - Tags
  - Control de hash en URL (`#case-id`)
  - Cierra con Escape o clic fuera
  - Scroll to top al abrir
- [ ] Integrar con `client:only="react"` en `expedientes.astro`

### 2.11 Case Connections SVG (React island)
- [ ] Crear `src/components/cases/CaseConnections.tsx`:
  - SVG overlay con líneas de conexión entre expedientes
  - Cálculo de posiciones con `getBoundingClientRect`
  - Resizing con `ResizeObserver`
  - Hover en CaseCard: resaltar conexiones del expediente
  - Líneas: color rojo con glow
  - Puntos de conexión en cada extremo
  - Oculto en móvil (≤900px)
- [ ] Integrar con `client:visible` en `expedientes.astro`

### 2.12 Case Timeline (React island)
- [ ] Crear `src/components/cases/CaseTimeline.tsx`:
  - Vista cronológica de fuentes/vídeos
  - Timeline vertical con números
  - Tarjetas con thumbnail, fase, código, título
  - Botones para abrir expedientes relacionados
  - Enlace a YouTube
- [ ] Integrar en `expedientes.astro`

### 2.13 Case hover effects (React island)
- [ ] Crear `src/components/cases/CaseHoverEffects.tsx`:
  - En mobile: reveal 3D al hacer scroll
  - En desktop: efecto de profundidad al hover
  - Integrar con `client:idle`

### 2.14 Comunidad — vista de misterios (datos hardcodeados temporalmente)
- [ ] Crear `src/components/community/MysteryToolbar.tsx`:
  - Búsqueda por texto
  - Filtros: Todos / Entidades / Origen / Personajes / Reglas
  - Orden: Más participación / Más votados / Más recientes
  - Botón "Modo Stream"
- [ ] Crear `src/components/community/MysteryList.tsx`:
  - Lista de misterios (datos hardcodeados de `misterios-comunidad.js`)
  - Tarjetas con código, categoría, título, métricas
  - Selección de misterio activo
  - Paginación de 6 misterios
- [ ] Crear `src/components/community/MysteryDetail.tsx`:
  - Detalle del misterio seleccionado
  - Lista de hipótesis ordenadas por votos
  - Conteo de votos por hipótesis
  - Botón "+ PROPONER EXPLICACIÓN" (sin funcionalidad aún)
- [ ] Crear `src/components/community/CommunityStats.tsx`:
  - Dashboard de estadísticas
  - Total misterios abiertos
  - Total hipótesis
  - Total votos
- [ ] Crear `src/components/community/MysteryProcess.astro`:
  - Sección de proceso (HTML estático)
  - 4 pasos: Recibimos → Agrupamos → Explicamos → Votamos
- [ ] Integrar en `expedientes.astro`

### 2.15 Modo Stream (React island)
- [ ] Crear `src/components/community/StreamMode.tsx`:
  - Dialog a pantalla completa
  - Un misterio por pantalla
  - Top 3 hipótesis por votos
  - Botón "Revelar resultados" (muestra porcentajes)
  - Navegación con flechas del teclado
  - Posición: "1 / 6"
- [ ] Integrar con `client:only="react"` en `expedientes.astro`

### Criterio de aceptación Fase 2
- [ ] Búsqueda y filtros funcionan en Vídeos
- [ ] Paginación funciona (12 por página)
- [ ] Featured video muestra el más reciente
- [ ] Modal de expedientes abre y muestra contenido completo
- [ ] Conexiones SVG se dibujan correctamente
- [ ] Timeline funciona
- [ ] Comunidad muestra misterios y hipótesis
- [ ] Modo Stream funciona con navegación por teclado
- [ ] Responsive funciona en todos los componentes
- [ ] No hay errores en consola del navegador
- [ ] Lighthouse performance ≥ 85

---

## Fase 3 — Base de datos y comunidad dinámica

**Objetivo:** Conectar la comunidad con Supabase. Datos dinámicos, votos persistentes, autenticación.
**Duración estimada:** 10-12 horas
**Dependencias:** Fase 2 completada

### 3.1 Configurar Supabase
- [ ] Crear proyecto en Supabase
- [ ] Crear schema de base de datos:
  ```sql
  -- Mysteries
  CREATE TABLE mysteries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    short_title TEXT NOT NULL,
    category TEXT NOT NULL,
    context TEXT NOT NULL,
    contributors TEXT,
    mentions_count INT DEFAULT 0,
    status TEXT DEFAULT 'open',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- Hypotheses
  CREATE TABLE hypotheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mystery_id UUID REFERENCES mysteries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT DEFAULT 'Anónimo',
    votes_count INT DEFAULT 0,
    status TEXT DEFAULT 'published',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- Votes
  CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hypothesis_id UUID REFERENCES hypotheses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(hypothesis_id, user_id)
  );

  -- Row Level Security
  ALTER TABLE mysteries ENABLE ROW LEVEL SECURITY;
  ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
  ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Public can read mysteries" ON mysteries FOR SELECT USING (true);
  CREATE POLICY "Public can read hypotheses" ON hypotheses FOR SELECT USING (true);
  CREATE POLICY "Public can read votes" ON votes FOR SELECT USING (true);
  CREATE POLICY "Auth users can vote" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can remove own vote" ON votes FOR DELETE USING (auth.uid() = user_id);
  ```
- [ ] Crear datos semilla:
  - 6 misterios (de `misterios-comunidad.js:4-79`)
  - 21 hipótesis (de `misterios-comunidad.js:11-77`)
- [ ] Configurar Auth providers: Google y GitHub
  - Crear OAuth apps en Google Cloud Console
  - Crear OAuth app en GitHub Settings
  - Configurar callback URLs en Supabase
- [ ] Configurar URL del sitio en Supabase Auth settings

### 3.2 Crear clientes Supabase
- [ ] Crear `src/lib/supabase.ts` (cliente server):
  ```typescript
  import { createClient } from '@supabase/supabase-js'
  // Cliente para API routes y SSR
  ```
- [ ] Crear `src/lib/supabase-browser.ts` (cliente browser):
  ```typescript
  import { createClient } from '@supabase/supabase-js'
  // Singleton para React islands
  ```

### 3.3 API Routes
- [ ] Crear `src/pages/api/mysteries.ts`:
  - GET: lista de misterios con conteo de hipótesis y votos
- [ ] Crear `src/pages/api/hypotheses.ts`:
  - GET: hipótesis por mystery_id, ordenadas por votos
- [ ] Crear `src/pages/api/votes.ts`:
  - POST: insertar voto (requiere auth)
  - DELETE: quitar voto (requiere auth, solo propio)
- [ ] Crear `src/pages/api/auth/callback.ts`:
  - Callback de Supabase Auth (redirección)

### 3.4 Auth — Login con Google/GitHub
- [ ] Crear `src/components/community/LoginButton.tsx`:
  - Dos botones: "Entrar con Google" / "Entrar con GitHub"
  - Llama a `supabase.auth.signInWithOAuth()`
  - Provider: 'google' o 'github'
- [ ] Crear `src/components/community/UserMenu.tsx`:
  - Avatar del usuario (foto de Google/GitHub)
  - Nombre o email
  - Botón "Cerrar sesión"
  - Dropdown con opciones
- [ ] Crear `src/components/community/AuthProvider.tsx`:
  - Context de autenticación
  - `onAuthStateChange` listener
  - Estado: user, loading, signIn, signOut
- [ ] Integrar en `Header.astro` o `expedientes.astro`

### 3.5 Vote Button (React island)
- [ ] Crear `src/components/community/VoteButton.tsx`:
  - Si no autenticado: muestra tooltip "Inicia sesión para votar"
  - Si autenticado: toggle voto (POST/DELETE a `/api/votes`)
  - Actualización optimista del conteo
  - Estados: "votado" (relleno) / "no votado" (outline)
  - Animación de transición
  - Deshabilitado mientras se procesa
- [ ] Integrar en `MysteryDetail.tsx`

### 3.6 Conectar MysteryList y MysteryDetail con Supabase
- [ ] Modificar `MysteryList.tsx`:
  - Cargar misterios desde `/api/mysteries`
  - Loading state
  - Error state
- [ ] Modificar `MysteryDetail.tsx`:
  - Cargar hipótesis desde `/api/hypotheses?mystery_id=X`
  - Cargar votos del usuario actual
  - Mostrar conteo real de votos
- [ ] Modificar `CommunityStats.tsx`:
  - Cargar estadísticas reales desde Supabase

### 3.7 Realtime para votos
- [ ] Configurar Supabase Realtime en tabla `votes`
- [ ] En `MysteryDetail.tsx`, suscribirse a cambios:
  ```typescript
  supabase.channel('votes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, handler)
    .subscribe()
  ```
- [ ] Actualizar conteos en tiempo real

### 3.8 Gestión de datos de misterios
- [ ] Eliminar datos hardcodeados de `MysteryList.tsx`
- [ ] Los misterios se cargan únicamente desde Supabase
- [ ] Mantener el seed data como fallback en desarrollo

### Criterio de aceptación Fase 3
- [ ] Login con Google funciona
- [ ] Login con GitHub funciona
- [ ] Cerrar sesión funciona
- [ ] Los misterios se cargan desde Supabase
- [ ] Las hipótesis se cargan desde Supabase
- [ ] Votar funciona (requiere login)
- [ ] No se pueden duplicar votos
- [ ] Quitar voto funciona
- [ ] Los votos se actualizan en tiempo real
- [ ] El header muestra el usuario logueado
- [ ] El menú de usuario funciona
- [ ] No hay errores en consola del navegador

---

## Fase 4 — Premium, Tailwind completo y pulido

**Objetivo:** Migrar el sistema visual premium a Tailwind. Optimizar rendimiento, SEO y accesibilidad.
**Duración estimada:** 10-12 horas
**Dependencias:** Fase 3 completada

### 4.1 Migrar premium.css a Tailwind
- [ ] Crear `src/styles/premium.css` con:
  - Variables premium (migrar de `premium.css:1-19`)
  - Base reset premium (migrar de `premium.css:22-50`)
  - Header premium (migrar de `premium.css:52-94`)
  - Tipografías premium (migrar de `premium.css:97-107`)
  - Barra de progreso de scroll (migrar de `premium.css:110-125`)
  - Hero cinematic (migrar de `premium.css:128-153`)
  - Portal cards (migrar de `premium.css:156-174`)
  - Manifesto (migrar de `premium.css:177-199`)
  - Video destacad (migrar de `premium.css:202-224`)
  - Canal card (migrar de `premium.css:227-267`)
  - Footer premium (migrar de `premium.css:270-280`)
  - Scrollbar premium (migrar de `premium.css:283-289`)
- [ ] Verificar que todos los efectos visuales se mantienen

### 4.2 Migrar expedientes.css a Tailwind
- [ ] Migrar estilos de expedientes a clases de Tailwind
  - Cases hero (migrar de `expedientes.css:1-178`)
  - Archive panel (migrar de `expedientes.css:179-267`)
  - Case board (migrar de `expedientes.css:271-447`)
  - Case dialog (migrar de `expedientes.css:599-780`)
  - Timeline (migrar de `expedientes.css:458-597`)
  - Responsive (migrar de `expedientes.css:781-830`)

### 4.3 Migrar misterios-comunidad.css a Tailwind
- [ ] Migrar estilos de comunidad a clases de Tailwind
  - Mystery lab (migrar de `misterios-comunidad.css:1-14`)
  - Mystery heading (migrar de `misterios-comunidad.css:26-47`)
  - Mystery process (migrar de `misterios-comunidad.css:86-119`)
  - Mystery dashboard (migrar de `misterios-comunidad.css:120-136`)
  - Mystery toolbar (migrar de `misterios-comunidad.css:137-186`)
  - Mystery workspace (migrar de `misterios-comunidad.css:187-267`)
  - Mystery detail (migrar de `misterios-comunidad.css:248-333`)
  - Community dialog (migrar de `misterios-comunidad.css:348-415`)
  - Stream mode (migrar de `misterios-comunidad.css:417-536`)

### 4.4 Migrar premium.js a islands
- [ ] Crear `src/components/effects/ScrollProgress.tsx`:
  - Barra de progreso de scroll
  - Clase `is-scrolled` en header
  - `client:idle`
- [ ] Crear `src/components/effects/PointerLight.tsx`:
  - Variables CSS `--cursor-x`, `--cursor-y`
  - Parallax del hero
  - `client:idle`
- [ ] Crear `src/components/effects/RevealOnScroll.tsx`:
  - IntersectionObserver
  - Clases `reveal-item` e `in-view`
  - `client:visible`
- [ ] Crear `src/components/effects/MagneticButtons.tsx`:
  - Efecto magnético en botones principales
  - `client:idle`
- [ ] Crear `src/components/effects/CounterAnimation.tsx`:
  - Animación de números al hacer scroll
  - `client:visible`
- [ ] Crear `src/components/effects/CaseBoardDepth.tsx`:
  - Efecto 3D en el muro de expedientes
  - Solo desktop
  - `client:idle`

### 4.5 Optimización de imágenes
- [ ] Verificar todas las imágenes en `public/assets/`
- [ ] Añadir `loading="lazy"` donde no esté
- [ ] Añadir `decoding="async"` donde no esté
- [ ] Verificar fallbacks de imagen (`onerror`)
- [ ] Considerar uso de `<Image>` de Astro para optimización automática

### 4.6 SEO completo
- [ ] Crear `public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://elhombredeamarillo.com/sitemap.xml
  ```
- [ ] Crear `src/pages/sitemap.xml.ts` (generado dinámicamente)
- [ ] Añadir `<link rel="canonical">` en cada página
- [ ] Completar Open Graph en todas las páginas:
  - `og:type` → `website`
  - `og:url` → URL completa
  - `og:image` → URL completa de imagen
  - `og:locale` → `es_ES`
- [ ] Añadir `twitter:card` meta tags
- [ ] Añadir schema.org JSON-LD:
  - `WebSite` en index
  - `BreadcrumbList` en páginas internas

### 4.7 Accessibility
- [ ] Verificar navegación por teclado
- [ ] Verificar que los `<dialog>` atrapan el focus
- [ ] Verificar `prefers-reduced-motion` en todas las animaciones
- [ ] Verificar contraste de colores
- [ ] Verificar que los formularios tienen labels accesibles
- [ ] Probar con VoiceOver/NVDA (básico)

### 4.8 Performance
- [ ] Auditar con Lighthouse (target: 95+ todas las métricas)
- [ ] Verificar que el JS cargado es mínimo
- [ ] Verificar que los fonts no bloquean el render
- [ ] Añadir `<link rel="preconnect">` para dominios externos
- [ ] Configurar headers de cache en Vercel (`vercel.json`):
  ```json
  {
    "headers": [
      {
        "source": "/assets/(.*)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      }
    ]
  }
  ```
- [ ] Verificar que no hay JavaScript innecesario en páginas estáticas

### 4.9 Responsive final
- [ ] Verificar todos los breakpoints:
  - Desktop (>1180px)
  - Tablet (900-1180px)
  - Móvil pequeño (640-900px)
  - Móvil (<640px)
- [ ] Verificar menú hamburguesa en móvil
- [ ] Verificar modales en móvil
- [ ] Verificar formularios en móvil
- [ ] Verificar modo Stream en móvil

### 4.10 Deploy final
- [ ] Verificar build completo: `pnpm build`
- [ ] Verificar que no hay errores de TypeScript
- [ ] Verificar que Vercel despliega correctamente
- [ ] Probar flujos completos:
  - Navegar por las 3 páginas
  - Buscar y filtrar vídeos
  - Paginar vídeos
  - Abrir expediente y ver conexiones
  - Navegar por timeline
  - Login con Google
  - Login con GitHub
  - Votar hipótesis
  - Quitar voto
  - Modo Stream
- [ ] Verificar que no hay errores en consola

### Criterio de aceptación Fase 4
- [ ] Todos los efectos premium funcionan
- [ ] Animaciones de scroll funcionan
- [ ] Modo Stream funciona con navegación por teclado
- [ ] Responsive funciona en todos los breakpoints
- [ ] Lighthouse performance ≥ 95
- [ ] Lighthouse accessibility ≥ 90
- [ ] Lighthouse SEO ≥ 95
- [ ] No hay errores en consola del navegador
- [ ] Deploy estable en Vercel

---

## Cronograma resumen

```
Fase 1 — Setup y migración estática
├── 1.1  Inicialización proyecto ............... 30 min
├── 1.2  Layouts base .......................... 1.5 horas
├── 1.3  Header y Footer ....................... 1.5 horas
├── 1.4  Helpers centralizados ................. 1 hora
├── 1.5  Tipos TypeScript ...................... 1 hora
├── 1.6  Migrar datos ......................... 1.5 horas
├── 1.7  Página de Inicio ..................... 2 horas
├── 1.8  CSS base a Tailwind .................. 2 horas
├── 1.9  Página de Vídeos (estática) .......... 1 hora
├── 1.10 Página de Expedientes (estática) ..... 1.5 horas
└── 1.11 Deploy inicial ....................... 30 min
    TOTAL: ~14 horas

Fase 2 — Islands interactivos
├── 2.1  Header interactivo ................... 1 hora
├── 2.2  Video Filters ....................... 2 horas
├── 2.3  Video Card + Grid ................... 2 horas
├── 2.4  Featured Video ...................... 1 hora
├── 2.5  Channel Card ....................... 1 hora
├── 2.6  Pagination ......................... 1 hora
├── 2.7  Creator Directory .................. 1 hora
├── 2.8  Case Filters ....................... 1 hora
├── 2.9  Case Grid + Cards .................. 1.5 horas
├── 2.10 Case Dialog ....................... 2 horas
├── 2.11 Case Connections SVG ............... 1.5 horas
├── 2.12 Case Timeline ..................... 1 hora
├── 2.13 Case hover effects ................. 1 hora
├── 2.14 Comunidad vista lectura ............. 2 horas
└── 2.15 Modo Stream ....................... 1.5 horas
    TOTAL: ~19 horas

Fase 3 — Base de datos y comunidad
├── 3.1  Configurar Supabase .................. 2 horas
├── 3.2  Clientes Supabase ................... 30 min
├── 3.3  API Routes .......................... 2 horas
├── 3.4  Auth Google/GitHub .................. 2 horas
├── 3.5  Vote Button ........................ 1.5 horas
├── 3.6  Conectar componentes con Supabase ... 2 horas
├── 3.7  Realtime votos ..................... 1 hora
└── 3.8  Eliminar datos hardcodeados ......... 30 min
    TOTAL: ~11 horas

Fase 4 — Premium y pulido
├── 4.1  premium.css a Tailwind .............. 3 horas
├── 4.2  expedientes.css a Tailwind .......... 2 horas
├── 4.3  misterios-comunidad.css a Tailwind .. 2 horas
├── 4.4  premium.js a islands ................ 2 horas
├── 4.5  Optimización imágenes ............... 30 min
├── 4.6  SEO completo ....................... 1 hora
├── 4.7  Accessibility ...................... 1 hora
├── 4.8  Performance ....................... 1 hora
├── 4.9  Responsive final ................... 1 hora
└── 4.10 Deploy final ....................... 1 hora
    TOTAL: ~14 horas
```

**Total general: ~58 horas de desarrollo**

---

## Dependencias entre fases

```
Fase 1 (Setup y migración estática)
    │
    ├──→ Fase 2 (Islands interactivos)
    │         │
    │         └──→ Fase 3 (Base de datos y comunidad)
    │                    │
    │                    └──→ Fase 4 (Premium y pulido)
    │
    └──→ Fase 4 (CSS premium puede empezar en paralelo con Fase 2)
```

---

## Notas importantes

### No se modifica el código existente hasta completar cada fase
El código actual (`app.js`, `expedientes.js`, `misterios-comunidad.js`, etc.) se mantiene intacto como referencia. Cada fase se desarrolla de forma independiente y se verifica antes de avanzar.

### Los datos hardcodeados de comunidad se eliminan en Fase 3
Durante Fase 2, los misterios e hipótesis se mantienen como datos hardcodeados para verificar la UI. En Fase 3 se reemplazan por datos de Supabase.

### El deploy se hace por fases
Cada fase tiene su propio criterio de aceptación. No se despliega a producción hasta completar todos los criterios de la fase.

### Variables de entorno
```env
# .env.local
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
YOUTUBE_API_KEY=AIzaSy...
```
