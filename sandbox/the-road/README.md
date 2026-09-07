# THE ROAD

Horror psicológico 3D para navegador. **100% original** — inspirado solo en conceptos generales
(horror, carreteras imposibles, pueblos aislados, bucles sobrenaturales). Sin personajes,
criaturas, lore ni diseños de obras existentes.

## Jugar

```bash
# desde la raíz del repo
pnpm install
pnpm dev:road        # http://localhost:5173
```

Build de producción:

```bash
pnpm build:road      # sandbox/the-road/dist/ (sitio estático)
pnpm preview:road    # servir el build localmente
```

## El MVP (10-20 min)

1. Conduces por una carretera forestal de noche.
2. Un enorme árbol caído bloquea la carretera. Bajas a examinarlo.
3. No hay explicación. Vuelves al coche y dais la vuelta.
4. Aparece **Marrow Falls**: gasolinera, diner, motel, cinco habitantes.
5. Intentas escapar por la carretera... y el mismo árbol te devuelve.
6. De vuelta al pueblo, algo ha cambiado (una ventana, un letrero, un habitante).
7. Tras la segunda vuelta, una **fotografía** aparece en el tablón de la plaza.
8. Tu coche está en la foto. La foto es más vieja que tu llegada.

CORTE. Fin del MVP.

## Controles

| Tecla | Acción |
|-------|--------|
| W / S | acelerar / frenar-marcha atrás (conducir) · avanzar / retroceder (a pie) |
| A / D | dirección / desplazamiento |
| SHIFT | correr |
| E | interactuar (examinar, entrar/salir del coche, hablar) |
| Ratón | mirar (Pointer Lock) · orbitar cámara al conducir |
| ESC | pausa |
| F3 | overlay de debug (FPS, draw calls, triángulos, s, loops, seed) |

## Stack

TypeScript strict + Three.js (WebGL 2) + Vite + pnpm. **Sin** motores de física, sin
backend, sin React, sin dependencias extra. Todos los assets son **procedurales**
(geometría low-poly, texturas de canvas, audio sintetizado con Web Audio API):
el juego funciona 100% offline y no descarga un solo KB de assets.

## Arquitectura

```
src/
├── core/       Game (orquestador + loop único) · Renderer · GameState · Settings ·
│               InputManager · AudioManager · AssetManager
├── player/     FirstPersonController (Pointer Lock + colisiones)
├── vehicle/    Car (malla) · CarController (física arcade)
├── world/      World · RoadCurve (anillo cerrado con seed) · Road · Forest ·
│               Village (Marrow Falls) · FallenTree · Props · CollisionSystem
├── npc/        NPC · NPCController · DialogueSystem · dialogues.ts (datos)
├── events/     EventManager · GameEvent · RoadEvents · VillageEvents
├── interaction/ Interactable · InteractionManager
├── audio/      AmbientAudio · SpatialAudio · CarAudio (todo procedural)
├── ui/         MainMenu · SettingsMenu (en MainMenu) · HUD · DialogueUI ·
│               PhotoOverlay · LoadingScreen · DebugOverlay
└── utils/      MathUtils · Random (mulberry32 con seed)
```

Decisiones clave:

- **El mundo es un anillo cerrado de ~2.6 km** generado con seed (`483920` por defecto):
  "la carretera siempre devuelve al pueblo" es literal — el bucle ES la geometría,
  sin teletransportes ni fades.
- **Carretera no infinita sino cerrada**: la niebla y el bosque ocultan que el mapa es
  finito. Mismo resultado que el streaming de segmentos, con cero pop-in.
- Colisiones propias (círculos XZ), física de coche arcade, un solo `requestAnimationFrame`.

## Verificación

```bash
pnpm typecheck:road   # tsc strict sin errores
pnpm --filter the-road smoke   # smoke test del mundo (anillo + proyección)
```

## Sandbox de controles

Abre **`/controls-sandbox.html`** (junto al juego) para ajustar controles en vivo:

- **Rebinding**: click en una tecla → pulsa la nueva
- **Tuning en vivo**: velocidad, frenada, giro, suavizado, altura/distancia/lag de cámara, asiento del cockpit, sensibilidad
- **JSON**: el cuadro inferior es la config completa — *Copy JSON* la copia, *Apply JSON* importa, *Reset* vuelve a defaults
- Todo se guarda en `localStorage` y el juego lo lee en caliente (recarga la pestaña del juego tras ajustar)

La misma config vive en `src/core/ControlsConfig.ts` (`DEFAULT_CONTROLS`) — pega tu JSON
al agente y queda como default para todos.

## Despliegue

`dist/` es un sitio estático — Netlify, Vercel, Cloudflare Pages o GitHub Pages
(sin backend). `vite.config.ts` usa `base: './'` para rutas relativas.

## Notas

- WebGL 2 requerido. Si tu GPU está en blocklist de Chromium:
  `chrome://settings/system` → aceleración por hardware ON, o lanza con
  `--enable-unsafe-swiftshader --ignore-gpu-blocklist`. Diagnóstico: `webgl-check.html`.
- La calidad gráfica (sombras, pixel ratio) se aplica al arrancar; cambiarla desde
  Settings recarga el renderer.
