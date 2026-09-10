# REPO STRUCTURE — FROMVILLE

> Estructura del proyecto y su integración en el monorepo. Depende de `TECH_ARCHITECTURE.md`.

---

## 1. Decisión: proyecto independiente

FROMVILLE vive en **`sandbox/fromville/`** como paquete propio del workspace pnpm, **sin tocar**
`sandbox/the-road` ni el sitio Astro. Reutiliza *patrones* de THE ROAD (no su código, para no
acoplarlos). Convención de ramas: `game/fromville` (como `game/the-road`).

---

## 2. Workspace y scripts

Añadir a `pnpm-workspace.yaml`:
```yaml
packages:
  - 'sandbox/*'   # ya cubre the-road y fromville
```

Scripts en el `package.json` **raíz** (mismo estilo que `*:road`):
```json
"dev:fromville":       "pnpm --filter fromville dev",
"build:fromville":     "pnpm --filter fromville build",
"preview:fromville":   "pnpm --filter fromville preview",
"typecheck:fromville": "pnpm --filter fromville typecheck"
```

`package.json` del juego (`sandbox/fromville/`): `name: "fromville"`, deps `three`, devDeps
`typescript`, `vite`, `@types/three`. Scripts internos: `dev/build/preview/typecheck/smoke`.
`vite.config.ts` con `base: './'` (rutas relativas, sirve desde subcarpeta).

---

## 3. Árbol de `sandbox/fromville/`

```
sandbox/fromville/
├── index.html
├── vite.config.ts
├── tsconfig.json            # strict
├── package.json
├── README.md                # del juego (se crea en Fase 1)
├── plan/                    # ESTOS documentos (no gitignored)
│   └── *.md
├── public/
│   ├── assets/              # GLB/KTX2/HDRI/audio (Fase 5+)
│   └── webgl-check.html     # reutilizar patrón de THE ROAD
├── scripts/
│   └── smoke.ts             # smoke determinista del mundo (seed)
└── src/
    ├── main.ts
    ├── style.css
    ├── core/        Game, Renderer, InputManager, Settings, GameState, AssetManager, AudioManager
    ├── camera/      FirstPersonCamera (head-bob, FOV por estado)
    ├── player/      FirstPersonController (WASD, sprint, crouch, sigilo, resistencia)
    ├── world/       World, LoopRoad, Town, Forest, Terrain, Props, CollisionSystem
    ├── environment/ DayNight, Weather, FogController
    ├── interaction/ Interactable, InteractionManager, tipos (Door, Switch, Note, ...)
    ├── creatures/   Creature, PoseAnimator
    ├── ai/          PerceptionSystem, CreatureFSM, WaypointGraph, Steering
    ├── physics/     (colisión custom; Rapier opcional detrás de interfaz)
    ├── horror/      HorrorDirector, TensionModel, EventBook
    ├── events/      EventManager, GameEvent, eventos concretos
    ├── narrative/   StorySystem, ClueSystem, LoreSystem, DialogueSystem, data/*.ts
    ├── audio/       AmbientAudio, SpatialAudio, PlayerAudio, HorrorAudio
    ├── rendering/   postfx (composer/passes), shaders, materials
    ├── ui/          MainMenu, HUD, DialogueUI, Notebook, PhotoOverlay, LoadingScreen, DebugOverlay
    ├── save/        SaveSystem (idb-keyval), schema/version
    ├── debug/       DebugOverlay logic, cheats
    └── utils/       MathUtils, Random (mulberry32), EventSystem(emisor), Disposable
```

---

## 4. Carpetas de pipeline (fuera del bundle)

```
sandbox/fromville/
├── blender/                 # fuente de assets (NO se bundlea)
│   ├── scenes/              # .blend por kit/hero
│   ├── assets/              # librería local
│   ├── scripts/             # .py de ayuda para el MCP (export, naming)
│   └── exports/             # GLB crudos pre-optimización
└── (public/assets/)         # GLB/KTX2 optimizados → lo que carga Three
```

Los `.blend` grandes y crudos van al `.gitignore` si pesan; se versionan los GLB optimizados.

---

## 5. Convenciones

- **TypeScript strict**, sin `any` gratuito. Imports nombrados de `three` (tree-shaking).
- **Biome** (config del repo) para lint/format. `THREE.Timer`, no `Clock`.
- **PR pequeño por tarea** (ver `AI_AGENT_WORKFLOW.md`). No commitear sin pedirlo.
- `docs/` está **gitignored** en la raíz → por eso el planning vive en `plan/` dentro del juego.
- El juego se puede servir en una ruta de la web (p. ej. `/fromville/`) como se hizo con
  `/the-road/` (ver commit `feat(web): servir THE ROAD en /the-road/`), opcional y en Fase 16.
