# TESTING — FROMVILLE

> Estrategia de pruebas. **No generar tests artificiales** que no aporten valor. Depende de
> `TECH_ARCHITECTURE.md`. Complementos: `AI_AGENT_WORKFLOW.md`, `PERFORMANCE.md`.

---

## 1. Filosofía

Un juego WebGL es difícil de testear "unit-style". Prioridad a lo que **sí** da valor:
determinismo del mundo, invariantes de sistemas lógicos, build, y un smoke de arranque. El
*feel* (horror, animación) se valida **a mano** y con el debug overlay, no con asserts.

---

## 2. Capas de test

### 2.1 Core / lógica pura (Vitest o node)
- **Random/seed:** `mulberry32` reproducible (misma seed → misma secuencia).
- **MathUtils:** proyección, clamp, easing, wrap de ángulos.
- **DayNight:** la fase calculada es correcta para un tiempo dado; transiciones monotónicas.
- **TensionModel:** presupuesto sube/baja en rangos válidos `[0,1]`; cooldowns respetados.
- **EventBook:** nunca elige el mismo evento dos veces seguidas; filtra por fase/zona.
- **CreatureFSM:** transiciones legales dadas `awareness`/estímulo (sin estados imposibles).
- **ClueSystem/Story:** grafo de prerequisitos sin ciclos; un beat no se dispara dos veces.
- **SaveSystem:** round-trip serialize→deserialize (schema version + migración).

### 2.2 Mundo (smoke determinista)
- `scripts/smoke.ts` (patrón de THE ROAD): construye el mundo con seed fija y **asserta**
  invariantes: el anillo cierra (punto final ≈ inicial), nº de POIs, colisiones sin solapes
  críticos, todo `Interactable` tiene `id` único. Sin abrir navegador.

### 2.3 Interacción
- Raycast: un `IInteractable` en frente se detecta; `canInteract` respeta llaves/día-noche;
  `onInteract` cambia el estado persistible.

### 2.4 Build
- `pnpm build:fromville` sin errores; tamaño del chunk del juego dentro de presupuesto;
  `base:'./'` → rutas relativas.

### 2.5 Performance (regresión)
- Test que carga el mundo headless (o con `--enable-unsafe-swiftshader`) y **falla si** draw calls
  o triángulos superan el umbral de `PERFORMANCE.md`. Guardas de regresión por fase.

---

## 3. Lo que NO se automatiza (validación manual)

- Sensación de terror, timing del Director, "fairness" de persecuciones, calidad de audio/visual.
- Checklist manual por fase en `ROADMAP.md` (Definition of Done).

---

## 4. Herramientas

- **Vitest** para lógica (rápido, ESM, TS). Sin framework de render.
- **Playwright** *opcional* para un smoke de arranque real (abre `dist`, espera canvas, lee el
  overlay de debug, captura errores de consola). Solo si aporta; no para tests frágiles de píxel.
- **F3 debug overlay** como herramienta de QA en vivo (FPS, draw calls, estado de criatura, seed).

---

## 5. Integración en el workflow

Cada tarea de `AI_AGENT_WORKFLOW.md` corre: `typecheck` → `smoke` → `build` → (perf si toca mundo).
Un PR que toca un sistema lógico añade/actualiza su test de §2.1. No se exige cobertura arbitraria
de componentes de Three (sin valor).
