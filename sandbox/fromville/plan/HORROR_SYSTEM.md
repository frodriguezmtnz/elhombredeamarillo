# HORROR SYSTEM — FROMVILLE

> Sistema de terror dinámico: Director, tensión, ciclo día/noche y eventos. Depende de
> `GAME_DESIGN.md`. Complementos: `AI.md`, `NARRATIVE_MYSTERY.md`, `TECH_ARCHITECTURE.md`.

---

## 1. Filosofía

No jumpscares constantes. Terror por mezcla de:

```
Atmosphere + Sound + Environmental storytelling + Uncertainty
+ Expectation + Rare events + Chase + Silence
```

El objetivo es **expectativa sostenida**, no picos frecuentes. El scare solo funciona si hubo
buildup. Ver principio *slow burn* (`GAME_DESIGN.md §10`).

---

## 2. El Horror Director

Un módulo central (evolución del `ScareDirector` de THE ROAD) que orquesta la intensidad.

**Modelo: presupuesto de tensión (tension budget).**

- Variable `tension ∈ [0,1]` que sube con estímulos (criatura cerca, oscuridad, sonido raro,
  persecución) y decae con el tiempo en calma.
- El Director lee `tension` + `phase` (día/noche) + `danger` y **elige el siguiente beat** de una
  libreta de eventos, respetando **cooldowns** y **no repitiendo** el mismo tipo seguido.
- Regla de **dinamómetro de miedo** (inspirada en L4D/Amnesia, no copiando sus sistemas): si la
  tensión es muy alta y sostenida, inyecta un *respiro* (silencio, amanecer, refugio); si es muy
  baja, sube la apuesta (un evento). Mantiene la curva en la banda incómoda sin agotar.

**Salidas del Director (puede modular):**
- `spawnCreature()` / `creatureMode(...)` (ver `AI.md`)
- `playSound(cue, position)` — susurros, pasos, golpes, llamadas
- `setFog(density)`, `setLightFlicker(intensity)`, `triggerEvent(id)`
- `silence()` — cortar toda la capa ambiental de golpe (herramienta clave, §5)

**Entradas:** posición del jugador, línea de visión, fase día/noche, batería linterna, ruido
emitido, pistas descubiertas, `tension`, eventos recientes.

---

## 3. Ciclo día/noche (mecánica)

Reloj de juego con fases y **hooks** que el Director y los sistemas escuchan:

```
DAY → SUNSET → DUSK → NIGHT → DANGER → (pre-dawn) → DAY
```

| Fase | Duración aprox | Qué pasa |
|---|---|---|
| Day | 5-7 min | Exploración libre, NPCs, tensión base baja |
| Sunset | 60-90 s | Transición jugable: luz cálida→fría, pájaros callan, viento sube, niebla crece, NPCs se retiran |
| Dusk | 30-45 s | Penumbra; primera aparición distante; "algo me mira" |
| Night | 4-6 min | Criaturas activas, visibilidad reducida, eventos |
| Danger | 1-2 min | Pico; patrulla agresiva; la ventana más letal |
| Day | ... | Amanecer: las criaturas se retiran al Den; el pueblo "respira" |

**Iluminación:** interpolación de color/intensidad de la direccional (sun→moon), temperatura de
color, cielo (gradient/HDRI barato), y densidad de niebla por fase. Implementación en
`TECH_ARCHITECTURE.md §4`.

**Regla de diseño:** el jugador debe *sentir* el anochecer por el entorno (señales), no por un HUD.

---

## 4. Eventos procedurales (libreta)

Eventos **contextuales, poco frecuentes y memorables**. Cada uno declara: fase válida, zona válida,
coste de tensión, cooldown y requisito. Ejemplos de la libreta:

| Evento | Contexto | Efecto |
|---|---|---|
| Puerta abierta | interior, día→noche | Una puerta que dejaste cerrada está abierta |
| Luz que se enciende | casa lejana, dusk | Una ventana se ilumina sola |
| Silueta en ventana | refugio, night | Figura quieta que desaparece al mirar |
| Objeto movido | núcleo | Un objeto cambia de sitio entre visitas |
| Teléfono que suena | diner/sheriff | Llamada; contestar da pista o terror |
| Pasos que imitan | bosque | Tus propios pasos, retrasados |
| Figura distante | boundary | Silueta que no se acerca; se va al acercarte |
| Coche que aparece | entry highway | Un vehículo que no estaba (loop payoff) |
| Persona desaparecida | NPC | Un habitante "ya no está" |
| Árbol/camino distinto | boundary | Reconfiguración (ver `WORLD_DESIGN.md §8`) |
| Teléfon que **dice tu nombre** | refugio/teléfono, night | La llamada usa datos que el juego registró (`AI.md §2.8`) |
| Voz tras la puerta | refugio sellado | Imita a un conocido pidiendo que **abras el sello** (dilema §Sellos) |
| Caja de música | interior, dusk→night | Melodía lejana que **reutiliza el asset musical de THE ROAD**; anuncia evento |
| Bandada de cuervos | umbral de entrada | Al cruzar el árbol caído, levantarse todas las aves = "ya estás dentro" |

**Anti-repetición:** el Director evita el mismo evento dos ciclos seguidos y escala la rareza.

---

## 5. El silencio como herramienta

El audio ambiental (viento, insectos, crujidos) es una **mantle continua**. El Director puede
cortarla de golpe (`silence()`): la **ausencia** de sonido comunica peligro mejor que un ruido.
Tras un silencio, el primer sonido que vuelve (una rama, una respiración) golpea fuerte. Regla:
silencio > estruendo para el terror sostenido.

---

## 6. Curva de tensión por sesión (vertical slice)

```
Tensión
1.0 |                                   ▁▇ (Danger/chase)
0.8 |                        ▇▅ (aparición) 
0.6 |             ▅ (dusk)             ▃▅ (noche 2)
0.4 |      ▃ (señal)                         ▂ (respiro amanecer)
0.2 | ▂ (calma exploración)                      
    +----------------------------------------------→ tiempo
      Día        Sunset  Night    Day   Night   Payoff
```

El Director empuja la curva hacia arriba pero **nunca deja que se aplaste** en un máximo constante
(fatiga) ni que se quede plana (aburrimiento). Cada ciclo termina en un *payoff* narrativo
(`NARRATIVE_MYSTERY.md`).

---

## 7. Anti-patrones

- Jumpscares sin buildup → los prohíbe el presupuesto (un susto gasta tensión, no la genera gratis).
- Criatura omnipresente → cooldowns y retirada al Den de día.
- Ruido constante → alternar con silencio.
- Eventos que revelan demasiado → deben ser *ambiguos* (miedo de lo desconocido).
