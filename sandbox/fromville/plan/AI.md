# AI — CRIATURAS Y COMPORTAMIENTO

> Diseño de criaturas originales y su IA. Depende de `HORROR_SYSTEM.md` (el Director las invoca).
> Complementos: `GAME_DESIGN.md`, `WORLD_DESIGN.md`, `TECH_ARCHITECTURE.md`.
> **Ninguna criatura copia diseños/nombres/lore de obra protegida** (ver `IP_ORIGINALITY.md`).

---

## 1. Criaturas originales

Concepto compartido con el terror de "aparentar humano": apariencia **casi** humana, comportamiento
antinatural, movimientos inquietantes, paciencia, inteligencia y capacidad de **manipular**. Pero
diseño, nombre, lore y comportamiento **originales**.

**Criatura principal — "The Hollow" (nombre provisional, cambiar si suena a IP):**
- Silueta humanoide alargada, proporciones ligeramente incorrectas (brazos largos, cabeza que no
  parpadea). Sin rostro definido.
- Se mueve "a saltos" de pose (frames irregulares) → inquietante, no "corre".
- **No ataca a la vista:** se acerca, observa, imita voces, y *elige* el momento. El "ataque" es
  una elipsis (fundido a negro → despiertas en otro sitio), no un gore interactivo.

**Secundarios (variations por seed):** imitadores (repiten tu voz/pasos), observadores lejanos
(nunca se acercan), y "vecinos" que de día parecen NPCs normales y de noche dejan de serlo.

> Ver `IP_ORIGINALITY.md` para el checklist de que el diseño no cruce la línea de copia.

---

## 2. Arquitectura de IA: FSM jerárquica + *awareness*

El brief propone una FSM plana (Idle/Patrol/.../Attack). **Diagnóstico: insuficiente** — una FSM
plana produce "NPC que corre hacia mí". Solución: **dos capas**:

### Capa 1 — Modelo de percepción (no es un estado, es un *sensor*)
Cada frame se calcula un escalar **`awareness ∈ [0,1]`** por criatura, alimentado por:
- **Estímulos:** ruido del jugador (correr > andar > agachado), luz de linterna directa, línea de
  visión (raycast), "saber" que el jugador está en su zona.
- **Decaimiento:** si no hay estímulo, `awareness` baja (pierde rastro → pasa a Search).

`awareness` **modula** las transiciones de la FSM y la velocidad/agresividad. Esto es lo que hace
que parezca que "sabe que estoy aquí" en vez de un trigger binario.

### Capa 2 — Máquina de estados (comportamiento)

```
Dormant ──(Director spawn / noche)──► Patrol
  ▲                                    │ (estímulo: ruido/luz/LoS)
  │                                    ▼
  │                               Investigate ──(no nada)──► Patrol
  │                                    │ (LoS confirmada)
  │                                    ▼
  │                               Observe ──(decide)──┬─► Stalk (te sigue sin que lo veas)
  │                                                    ├─► Manipulate (imita voz, abre puerta,
  │                                                    │     apaga luz, te guía a una zona)
  │                                                    └─► Approach
  │                                    │ (awareness alto / acorrala)
  │                                    ▼
  └──────── Retreat ◄──────────────  Chase ──(atrapa)──► Consume(elipsis)
                 (amanecer / pierde rastro)   │
                                              ▼
                                          Search (última posición conocida)
                                              │ (no te encuentra)
                                              ▼
                                          Disappear → Patrol/Dormant
```

Estados clave y su *intención de terror*:
- **Observe:** se queda quieto mirándote desde lejos. No ataca. Genera paranoia.
- **Stalk:** te sigue manteniendo distancia y rompiendo LoS; lo *oyes* más que lo ves.
- **Manipulate:** el estado estrella. Imita una voz amiga, abre una puerta que cerraste, apaga tu
  linterna, o "abre camino" hacia una trampa. Hace que el jugador desconfíe del mundo.
- **Chase:** persecución real pero **breve** y con reglas (pierdes al romper LoS + meterte en un
  refugio + no correr en silencio).
- **Consume:** no es un game over con gore; es transición (fundido) → consecuencia narrativa.

### 2.7 Regla de velocidad (fairness + terror)

**La criatura NUNCA corre.** Camina con deliberación y **corta el paso** (te rodea, te espera en la
encrucijada, aparecen **varias** a la vez). Esto hace la persecución *justa y legible*: el peligro no
es la velocidad sino **el ruido y la posición**.

- **Correr** te aleja de ella, pero **genera ruido** → sube `awareness` y **atrae a otras** criaturas
  de la zona. El sprints es una apuesta, no una solución.
- **Agacharse/andar** en silencio baja tu huída sonora y permite esquivarla.
- Consecencia de diseño: el instinto del jugador (sal corriendo) **le perjudica**; aprender la regla
  (silencio + ruta + refugio) es la curva de maestría. Coherente con `GAME_DESIGN.md §4` (resistencia
  + ruido).

### 2.8 `Manipulate` enriquecido (el estado estrella)

Además de abrir puertas/apagar luz, `Manipulate` ahora:
- **Roba voces:** imita a un NPC *que ya no está* (una llamada de auxilio, alguien que conociste de
  día) para que **tú abras** o **salgas del refugio**.
- **Usa tu perfil:** el juego registra decisiones y datos (tu nombre, a quién ayudaste, qué puertas
  cerraste); la criatura los **menciona** ("sé lo que hiciste en la casa de..."). Objetivo: *sabe
  cosas de mí* → paranoia sin combate.
- **Provoca el error:** su fin es que **rompas tu propia regla de seguridad** (abrir un sello,
  encender la luz, salir del bucle seguro).

---

## 3. Movimiento y navegación

- **Sin navmesh pesada** en MVP: **graph de waypoints** por zona (calles, senderos, claros) +
  steering básico (seek/flee/wander/avoid). Barato y suficiente para un pueblo.
- **Pathfinding puntual** (A* sobre el grafo de waypoints) para Chase/Search.
- **Animación:** procedural (rotación de huesos simple / sway) o clip corto si viene de Blender.
  El "movimiento a saltos" se hace con timing irregular de poses, no con interpolación suave.

---

## 4. Reglas de "justicia" (fairness)

El jugador debe poder sobrevivir leyendo señales:
- La criatura **anuncia** su estado por sonido antes que por vista (Stalk = crujidos; Chase =
  respiración/cercanía).
- **Refugios + puerta cerrada** rompen el Chase de forma fiable (pero con coste: tiempo/ruido).
- De **día** la criatura principal está Dormant en el Den → el día es realmente seguro (regla clara).
- **Nunca** dos persecuciones simultáneas en MVP.

### 4.5 Sellos (barrera dura)

Un **Sello** es una marca colocada en un umbral (puerta/ventana) que **impide a la criatura cruzar**
mientras el volumen esté **cerrado y sellado**. Reglas:

- Válido solo si **todas las aberturas** están cerradas **y** el sello está puesto. Una ventana
  abierta o una puerta sin pestillo **invalidan** el sello.
- Los Sellos son **escasos** (se consumen / se rompen) → recurso, no botón de "inmortalidad".
- `Manipulate` intenta que **tú mismo lo retires** (voz amiga tras la puerta, promesa de salida).
- Cerrar un sello es una **acción de seguridad** y a la vez un **check**: el jugador confirma que el
  refugio es de verdad seguro. Ver `GAME_DESIGN.md §5`.

---

## 5. Interfaz con el Director

El Director no "controla" micro-pasos; fija **modo y objetivo** y deja que la FSM actúe:
`creature.setMode('Stalk', targetPOI)` / `setAggro(awarenessBias)` / `recall()` (amanecer).
El Director sube/baja la agresividad global según `tension` (`HORROR_SYSTEM.md §2`).

---

## 6. Implementación (referencia)

Ver `TECH_ARCHITECTURE.md §7` (módulo `creatures/` + `ai/`): `Creature` (mesh + skeleton/pose),
`PerceptionSystem` (awareness), `CreatureFSM` (estados), `WaypointGraph`, `SteeringBehavior`.
Debug: F3 muestra el estado y `awareness` de cada criatura (`GAME_DESIGN.md` / `TECH_ARCHITECTURE.md §10`).
