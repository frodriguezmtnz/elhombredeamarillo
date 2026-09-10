# GAME DESIGN — FROMVILLE

> Documento de diseño de juego. Depende de `FROMVILLE_PLAN.md`. Complementos:
> `WORLD_DESIGN.md` (mapa), `HORROR_SYSTEM.md` (tensión), `AI.md` (criaturas),
> `NARRATIVE_MYSTERY.md` (historia).

---

## 1. Formato

**First-person horror walking simulator.** NO es shooter, RPG, survival-crafting ni multijugador.
El jugador: camina, explora, observa, escucha, investiga, interactúa, resuelve pequeños misterios,
encuentra objetos y **sobrevive**.

**Decisión de diseño central: no hay armas.** El jugador nunca puede "ganar" a una criatura. El
miedo emege de vulnerabilidad, incertidumbre, oscuridad, sonido, aislamiento, persecución y narrativa.

---

## 2. Core loop (justificación)

El loop del brief se ajusta en tres puntos:

1. **"Investigar" y "encontrar pista" se fusionan** en *leer el entorno*: en un walking sim no hay
   menús de investigación; la interacción con objetos ES la investigación.
2. **La preparación es un estado explícito de día** (rutas, linterna, refugios identificados), no
   un subproducto. Da agencia y recompensa la exploración.
3. **El amanecer no resetea: acumula.** Cada noche resuelta desbloquea una nueva anomalía/acceso.
   El progreso es comprensión del misterio (ver `NARRATIVE_MYSTERY.md`).

```
LLEGAR → [DÍA] explorar/investigar/preparar → [ANOCHECER] señales →
[NOCHE] sobrevivir (ocultarse/huir) → [AMANECER] el mundo cambia → repite con más acceso
```

**Bucle de micro-tensión (minuto a minuto):** moverme → oigo/véo algo → decido (acercarme /
esconderme / huir / apagar luz) → consecuencia → respiro → pista nueva.

---

## 3. Ciclo día/noche como motor de gameplay

Ver mecánicas completas en `HORROR_SYSTEM.md §3`. Resumen de diseño:

- **Día:** seguro relativo. Exploración, NPCs, recolección, preparación. Máxima visibilidad.
- **Atardecer:** transición jugable (~60-90 s). El jugador *siente* el cambio: luz cálida→fría,
  pájaros callan, viento sube, niebla aparece, los NPCs se retiran. Ventana para llegar a un refugio.
- **Noche:** el mundo cambia. Criaturas activas, visibilidad reducida, eventos sobrenaturales.
- **Peligro:** pico en la madrugada; la criatura principal patrulla más agresivamente.

El jugador aprende las reglas y planifica en torno a ellas: eso es el *survival* sin combate.

---

## 4. Supervivencia sin combate

Mecanismos (por orden de importancia). No todos son necesarios en MVP (ver `ROADMAP.md`):

| Mecanismo | Qué hace | MVP |
|---|---|---|
| **Ocultarse** | Armarios, sótanos, tras mobiliario; rompe línea de visión | Sí |
| **Cerrar/bloquear puertas** | Barreras temporales; algunas cedén | Sí |
| **Refugiarse** | Zonas seguras definidas (ver §5) | Sí |
| **Apagar la linterna** | Reduce detección; te deja ciego | Sí |
| **Permanecer quieto / sigilo** | El ruido atrae; agacharse reduce hu sonora | Fase 8 |
| **Huir** | Correr gasta resistencia; perder persecución | Sí |
| **Interpretar pistas** | Elegir ruta/horario correcto | Sí |
| **Usar objetos** | Llaves, fusibles, talismán | Sí |

**Resistencia:** correr consume una barra que se recupera andando; evita el "spam-sprint" y fuerza
decidir cuándo corres (y cuándo eso hace ruido).

---

## 5. Sistema de refugios

Un refugio es una **volumetría segura** con reglas, no una simple habitación. La seguridad se
modela como el **Sistema de Sellos** (ver `AI.md §4.5`): no basta con "estar dentro".

- **Regla de sellos:** el refugio es seguro **solo si** (a) toda abertura (puerta/ventana) está
  **cerrada y sellada**, y (b) a veces **sin luz** encendida dentro. Falta una condición → **deja de
  ser seguro** y una criatura puede entrar. La seguridad es **activa**, no pasiva.
- **Escasez:** los Sellos son un **recurso limitado** (se gastan/rompen) → no hay "modo dios".
  Elegir dónde sellar y cuándo *no* hacerlo es el dilema central de la noche.
- **Bloqueo:** pestillo/cerrote y marco de ventana como `Interactable` con estado
  (`open/closed/locked` + `sealed: bool`); sellar es una acción deliberada con **tiempo/ruido**.
- **Manipulate ataca la regla:** la criatura **no rompe el sello**; te **provoca para que lo rompas**
  (imita una voz conocida, promete una salida). El horror es *dudar de abrir o no*.
- **Iluminación:** farola/vela/linterna propia; la luz dentro puede atraer miradas desde fuera.
- **Comunicación:** los refugios son hitos del mapa (casa, cabaña, iglesia, sheriff, torre).
- **Qué ocurre dentro:** guardado/checkpoint, eventos internos (golpes en la puerta, una voz que
  imita, la luz que parpadea, un susurro que **dice tu nombre**), y *payoff* narrativo (documentos).

Refugios del mapa (ver `WORLD_DESIGN.md §4`): casa del pueblo, cabaña del bosque, iglesia, sheriff,
The Shack, torre de vigilancia.

---

## 6. Interacción genérica (`IInteractable`)

Un único sistema por raycast desde la cámara. Nada de lógica por objeto.

```
IInteractable {
  id: string
  label(): string          // prompt: "Examinar", "Abrir", "Encender"
  canInteract(state): bool // llave necesaria, día/noche, prerequisite
  onInteract(state): void  // efecto + cambia estado
  state: Record<string, unknown>  // persistible (open/closed, on/off, taken)
}
```

Tipos: puerta, cerrojo, cajón, interruptor, linterna, teléfono, documento/nota, objeto, ventana,
vehículo (examinar), refugio (entrar), talismán. El `InteractionManager` mantiene el *hovered*
actual y muestra el prompt de UI. Ver `TECH_ARCHITECTURE.md §6`.

---

## 7. Linterna

**Decisión: SÍ hay batería limitada, pero generosa y perdonadora** (no castiga, tensa).

- Cono de luz (SpotLight) con penumbra + ligera atenuación.
- **Flicker** procedural que el Horror Director puede modular (parpadeo = señal de peligro).
- **Intensidad** por estado de batería (fuerte → tenue → muerta).
- **Interacción con criaturas:** encenderla te hace visible; apagarla es estrategia.
- **Intención de diseño:** la batería es un reloj blando que empuja a no acampar en el bosque.

Alternativa registrada como `OPEN_DECISIONS.md §linterna`: linterna sin batería + riesgo puramente
de visibilidad (más puro, menos tenso). Recomendación provisional: con batería.

---

## 8. Inventario

**Inventario mínimo, NO RPG.** Solo lo que se usa en el mundo:

```
Keys | Flashlight | Notes (leídas) | Objects (llave, fusible, talismán) | Clues
```

Slot de "objeto en mano" para examinar/colocar. Sin combos, sin peso, sin crafting. Las *Notes* y
*Clues* viven en un cuaderno accesible desde pausa (ver §9), no como HUD.

---

## 9. UI (mínima, no invasiva)

El miedo viene del mundo, no de la interfaz. Sin HUD permanente.

- **Prompt de interacción:** texto discreto centrado-inferior solo al apuntar algo interactuable.
- **Cuaderno/Notes:** solo en pausa (documentos y pistas descubiertas).
- **Objetivo:** opcional, muy vago ("buscar una forma de salir"), nunca flechas ni minimapa.
- **Pausa/Settings:** menú con guardar/cargar, sensibilidad, calidad (LOW/MED/HIGH), audio.
- **Nada de:** barra de vida visible, contador de batería en HUD (se comunica por el flicker de la luz).

---

## 10. Principios de diseño (checklist de revisión)

1. Fear of the unknown — no enseñar todo.
2. Environmental storytelling — el escenario cuenta la historia.
3. Sound before sight — el sonido anuncia el peligro.
4. Vulnerability — el jugador no es poderoso.
5. Exploration — explorar siempre recompensa.
6. Scarcity — no todo está disponible.
7. Unpredictability — el mundo no se comporta igual dos veces.
8. Silence — el silencio como herramienta (ver `HORROR_SYSTEM.md §5`).
9. Slow burn — no spamear jumpscares.
10. Payoff — toda pista acaba teniendo significado.

**Anti-patrones a evitar:** caminar→trigger→cinemática→repetir; enemigos "NPC que corre hacia mí";
HUD invasivo; jumpscares sin buildup; pistas sin resolución.
