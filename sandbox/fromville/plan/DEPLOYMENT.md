# DEPLOYMENT — FROMVILLE

> Despliegue como sitio estático. Depende de `REPO_STRUCTURE.md`. Complemento: `PERFORMANCE.md`.

---

## 1. Naturaleza del build

`pnpm build:fromville` → `sandbox/fromville/dist/` = **sitio estático** (HTML/JS/CSS + assets
GLB/KTX2/audio). **Sin backend.** Con `base:'./'` funciona desde cualquier subruta.

---

## 2. Recomendación: Cloudflare Pages

| Opción | Veredicto | Por qué |
|---|---|---|
| **Cloudflare Pages** | ✅ **Recomendado** | CDN global, ancho de banda ilimitado (importante para assets 3D pesados), preview por PR, gratis para este uso |
| Vercel | ✅ válido | Ya usado para la web Astro; buen DX; pero límites de banda si los assets crecen |
| Netlify | ✅ válido | Similar; funciones innecesarias aquí |
| GitHub Pages | ⚠️ solo prototipo | Sin preview por PR, límites de tamaño/banda peores para GLB/KTX2 |

**Decisión:** desplegar el juego en **Cloudflare Pages**; opcionalmente integrarlo en la web Astro
existente (Vercel) en una ruta `/fromville/` como se hizo con `/the-road/` (Fase 16, opcional).

---

## 3. Configuración

- **Build command:** `pnpm install --frozen-lockfile && pnpm build:fromville`
- **Output dir:** `sandbox/fromville/dist`
- **Node:** ≥ 20 (repo usa Node 24). **pnpm** habilitado.
- **Cache:** `node_modules` y el store de pnpm.

---

## 4. Headers / cache (assets)

En `public/_headers` (Cloudflare/Netlify) o `vercel.json`/`_headers`:
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*.js
  Cache-Control: public, max-age=31536000, immutable
/index.html
  Cache-Control: no-cache
```
Los GLB/KTX2 llevan hash en el nombre (Vite) → cache agresiva segura.

---

## 5. Requisitos de cliente

- **WebGL2** requerido. Página `webgl-check.html` (patrón THE ROAD) para diagnosticar GPUs en
  blocklist. Enlace visible si falla el arranque.
- **HTTPS** (Pointer Lock y AudioContext requieren contexto seguro).
- Avisar de **audio**: el AudioContext se reanuda en el primer gesto del usuario (política de
  autoplay); el menú principal sirve de "tap to start".

---

## 6. Tamaño y carga inicial

- Mantener el **chunk inicial** pequeño (code-splitting; el juego carga su chunk).
- **Lazy-load** de assets por zona; pantalla de carga con progreso (`AssetManager`).
- Presupuesto de descarga inicial objetivo (p. ej. < 5 MB hasta el menú) → se afina en Fase 14.

---

## 7. CI (opcional pero recomendado)

Pipeline: `typecheck` → `smoke` → `build` → (perf guard) → deploy de preview. Gate de merge en
que el build y el smoke pasen (ver `TESTING.md`, `AI_AGENT_WORKFLOW.md §6`).
