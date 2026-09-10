# AI AGENT WORKFLOW — FROMVILLE

> Cómo un agente de IA desarrolla el juego de forma segura y medible. Depende de
> `FROMVILLE_PLAN.md`. Complementos: `TESTING.md`, `PERFORMANCE.md`, `REPO_STRUCTURE.md`.

---

## 1. Ciclo de tarea (obligatorio)

```
READ PLAN (este doc + el doc de la fase)
  ↓
READ REPOSITORY (entender arquitectura y convenciones)
  ↓
UNDERSTAND ARCHITECTURE (no reescribir; extender)
  ↓
IMPLEMENT ONE TASK (una sola tarea, alcance cerrado)
  ↓
RUN TESTS (typecheck + smoke)
  ↓
RUN BUILD (vite build)
  ↓
RUN PERFORMANCE CHECK (F3 / draw calls / no sube presupuesto)
  ↓
REVIEW CHANGES (diff auto-revisado)
  ↓
UPDATE DOCUMENTATION (doc de fase / ROADMAP checkboxes)
  ↓
COMMIT (solo si se pide)
  ↓
NEXT TASK
```

---

## 2. El agente NO debe

- Reescribir el proyecto o la arquitectura de golpe.
- Cambiar decisiones de `FROMVILLE_PLAN.md §5` sin registrar un OPEN DECISION.
- Instalar dependencias innecesarias (cada dep nueva se justifica).
- Modificar sistemas no relacionados con la tarea.
- Generar código duplicado en vez de reutilizar (`utils/`, patrones de THE ROAD).
- Saltarse tests/build/perf.
- Introducir assets, nombres o música de obras protegidas (`IP_ORIGINALITY.md`).
- Ejecutar código en Blender sin guardar el `.blend` antes (`BLENDER_PIPELINE.md §8`).

---

## 3. Reglas de Blender + MCP para el agente

- Antes de `execute_blender_code`: **guardar/copiar** el `.blend`; trabajar sobre la escena del
  proyecto, nunca sobre archivos ajenos abiertos.
- Operaciones **pequeñas y verificables** por llamada (crear 1 kit, no "el pueblo entero").
- Tras modelar: exportar GLB y **optimizar** (`BLENDER_PIPELINE.md §6`) antes de meter en
  `public/assets/`. Respetar presupuestos de `PERFORMANCE.md`.
- Si el add-on/MCP falla (Blender 5.2 nuevo): fallback a modelado manual + GLB, sin bloquear la fase.

---

## 4. Definición de "tarea" bien formada

Cada tarea del `ROADMAP.md` debe tener: **objetivo**, **archivos tocados** (acotados), **criterios
de aceptación verificables** y **cómo se prueba**. Si una tarea toca > ~1 módulo o > ~300 líneas,
se subdivide.

Ejemplo (Fase 1, ver `FROMVILLE_PLAN.md §7`): *Esqueleto + escena gris FPS* → criterios: typecheck
verde, dev muestra escena, build genera dist, no toca the-road/Astro.

---

## 5. Orden de dependencia entre fases

No empezar una fase sin cerrar los criterios de la anterior (ver `ROADMAP.md §dependencias`).
Regla: **render → mover → ver → interactuar → oír → asustar → contar → pulir.**

---

## 6. Checklist por commit

- [ ] `pnpm typecheck:fromville` sin errores
- [ ] `pnpm build:fromville` OK
- [ ] smoke (`pnpm --filter fromville smoke`) OK
- [ ] presupuesto de perf no empeorado (`PERFORMANCE.md`)
- [ ] docs/ROADMAP actualizados
- [ ] sin assets con IP (`IP_ORIGINALITY.md`)
- [ ] commit solo si se pidió; mensaje descriptivo, sin secretos
