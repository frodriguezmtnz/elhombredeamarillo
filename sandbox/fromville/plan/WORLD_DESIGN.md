# WORLD DESIGN — FROMVILLE

> Diseño del mundo a partir del **mapa ilustrado de referencia** del usuario. Depende de
> `FROMVILLE_PLAN.md`. Complementos: `HORROR_SYSTEM.md`, `TECH_ARCHITECTURE.md`,
> `VISUAL_DIRECTION.md`.

---

## 1. Fuente de verdad: el mapa

El layout canónico es el mapa dibujado a mano (no el ASCII del brief). Idea rectora:

> **THE LOOP ROAD** es un anillo cerrado alrededor del núcleo urbano; fuera, **ENDLESS FOREST**;
> en el borde exterior, **THE LABYRINTHINE BOUNDARY**. La carretera *siempre* devuelve al pueblo.

Esto **ya está resuelto en THE ROAD**: su `RoadCurve` genera un anillo cerrado con seed. FROMVILLE
adopta ese patrón (ver §6). El mapa es literalmente realizable.

---

## 2. Arquitectura espacial

Tres anillos concéntricos + radio de entrada:

```
        [ ENTRY HIGHWAY ]  (llegada, norte-oeste)
                 \
   LABYRINTHINE BOUNDARY  ← perímetro que no deja salir (bosque repetitivo + niebla)
   ┌───────────────────────────────┐
   │  ENDLESS FOREST (anillo)       │
   │   ┌───────────────────────┐    │
   │   │  THE LOOP ROAD (anillo)│   │
   │   │   ┌───────────────┐    │   │
   │   │   │  TOWN CENTER  │    │   │  ← núcleo denso, interactuable
   │   │   │  (POIs)       │    │   │
   │   │   └───────────────┘    │   │
   │   └────────────────────────┘   │
   └────────────────────────────────┘
```

- **Núcleo (Town Center):** alta densidad de interacción y narrativa. Seguro de día.
- **Anillo de Loop Road:** columna vertebral; conecta POIs; el bucle narrativo.
- **Endless Forest:** masa forestal procedural entre el anillo y el límite. Desorientación.
- **Labyrinthine Boundary:** borde "vivo" que reconfigura caminos y devuelve al jugador.

---

## 3. Zonificación por función

| Tipo | Zonas | Regla |
|---|---|---|
| **Seguras** | Town Center de día, refugios con puerta cerrada | Sin criaturas; checkpoints |
| **Neutras** | Loop Road, Gas Station, Water Tower | Tránsito; transición al anochecer |
| **Peligrosas** | Endless Forest, Broken Houses, Labyrinthine Boundary | Criaturas activas de noche |
| **Prohibidas** | Creature Sleeping Den | Solo narrativa tardía; castigo si entras |
| **Misterio** | Cueva de los Sellos, Hidden Tunnels, Communal Lighthouse Point | Desbloqueables |

## 3.5 Dos facciones (sociales)

El pueblo no es monolítico: dos comunidades con **reglas, acceso y humor** distintos, que cambian
según el ciclo día/noche (original; inspirado en el concepto genérico de "comunidad dividida"):

| Facción | Dónde | Carácter | Qué te da / qué te niega |
|---|---|---|---|
| **El Pueblo** | Núcleo / Loop Road | Normas, sheriff, horario estricto, "no salgas de noche" | Abrir de día, comerciar, información **oficial y censurada**; desconfía del bosque |
| **Los Colunist** | **La Colina** (NE) | Comuna más laxa, ritualista, saben del Den | Sellos y conocimiento del bosque; **no** te fiarán armamento/comida fácil; acceso nocturno propio |

- **Día:** puedes moverte entre ambos; de **noche** cada bando **cierra** a su manera (el Pueblo con
  sellos y turnos; la Colina con un ritual distinto).
- **Narrativa:** las dos versiones de la historia **se contradicen** → el jugador arma el misterio
  (`NARRATIVE_MYSTERY.md`). Los Colunist son el puente hacia el **Den** y los **Túneles**.
- **MVP:** **solo insinuadas** (un NPC de cada bando); mecánica de facción completa post-slice
  (ver `OPEN_DECISIONS.md §OD-12`).

---

## 4. POIs del mapa → función de gameplay

> **Renombrado IP:** los nombres fandom del mapa original (*Colony Houses → La Colina / Los Colunist*,
> *Farway Trees → Árboles-Umbral*, *Talisman Cave → Cueva de los Sellos*) **no** se usan en el producto
> publicado (ver `IP_ORIGINALITY.md`). Dejan de ser "Fromville": el lugar tiene nombre propio.

Inventario de hitos legibles en el mapa (nombres **originales**, ver `IP_ORIGINALITY.md`):

| POI | Zona | Función | Día/Noche |
|---|---|---|---|
| Entry Highway (+coche) | Núcleo | Llegada, inicio | Día |
| Town Center | Núcleo | NPCs, hub | Seguro |
| Diner | Núcleo | Pistas, refugio secundario | Día |
| Sheriff's Station | Núcleo | Documentos, cerrojos | Refugio |
| Church + Graveyard | Núcleo | Misterio, refugio mayor | Refugio |
| Clinic | Núcleo | Objetos (llaves/fusibles) | Día |
| Gas Station | Anillo | Recurso (batería), landmark | Neutra |
| Water Tower | Anillo | Landmark de orientación | Neutra |
| Barn & Supply Post | Anillo | Refugio + suministros | Refugio |
| Residential Clustered Houses | Anillo | Exploración, setpieces | Peligro de noche |
| Former Chamber | Anillo | Lore | Neutra |
| Forum Chamber | Anillo | Lore raro | Neutra |
| Broken Houses + Stained Pool | Anillo | Setpiece de horror | Peligro |
| Communal Lighthouse Point | Este | Misterio/late | Neutra |
| La Colina (Los Colunist) | NE | 2ª facción; área tardía; conocimiento de Sellos | Peligro |
| The Shack | Este | Refugio pequeño | Refugio |
| Firewatch Tower | NE | Oteador / hito | Refugio alto |
| Creature Sleeping Den | Sur | Spawn/retorno criatura; conecta con Túneles | **Prohibido** |
| Cueva de los Sellos | SE | Origen/forja de Sellos; objeto especial / lore | Secreto |
| Hidden Underground Tunnels | Sur | **Shortcut** entre POIs | Secreto |
| Car Cemetery / Crashed RV / Training Yards | Oeste | Landmarks de orientación | Peligro |
| Pleasant Lake / Wetlands / Quarried Clearing / Forest Clearings | Bosque | Biomas/claros | Desorientación |
| The Labyrinthine Boundary | Perímetro | No deja salir | Siempre |

**Landmarks visuales** (para orientarse sin minimapa): Water Tower, Church, Firewatch Tower,
Quarried Clearing, el coche de Entry Highway.

---

## 5. El bosque (personaje)

Requisitos: grande, oscuro, claustrofóbico, difícil de orientar, **repetitivo a propósito**, sonoro.

- **Generación procedural con seed** (como THE ROAD): claro central + anillos de árboles.
- **Repetición intencionada:** los mismos *clusters* de árboles reaparecen → el jugador no puede
  memorizar; refuerza "no puedo salir".
- **Claros (clearings)** como puntos de referencia y de eventos.
- **Niebla densa** recorta el horizonte → sensación de grandeza sin renderizar miles de árboles.
- **Sonido direccional:** crujidos, alas, pasos que imitan (ver `HORROR_SYSTEM.md`).
- **Técnica de rendimiento:** ver §7 y `PERFORMANCE.md` (instancing + impostores + LOD).

---

## 6. La carretera-bucle (el "no puedes salir")

**Opción recomendada: (A) Loop físico real + (D) ilusión narrativa.** El anillo cerrado de THE ROAD
es literal: caminar lo bastante lejos te devuelve por el otro lado, con niebla/bosque ocultando el
cierre. Sin teletransportes visibles → no parece un bug.

Refuerzo narrativo: hitos que se repiten (el mismo RV caído, el mismo letrero) y el Labyrinthine
Boundary que "reordena" caminos del bosque para desorientar (opción C puntual, ver §8).

**Descartado:** teleport silencioso puro (B) como mecanismo principal — se nota. Solo se admite
para transiciones de escena con fade.

---

## 7. Streaming y percepción de grandeza

**MVP: sin streaming real.** El mapa es finito y oculto por niebla + bosque (patrón THE ROAD: cero
pop-in). El jugador percibe un mundo enorme porque no ve el borde.

**Late (áreas grandes):** chunks modulares por distancia (grid de tiles), cargar/descargar anillos
según posición del jugador, occlusion por geometría (interiores cierran puertas → no renderizan lo
que hay detrás). Ver `TECH_ARCHITECTURE.md §7` y `PERFORMANCE.md`.

---

## 8. Reconfiguración procedural (Labyrinthine Boundary)

Mecánica de "el bosque cambia": al cruzar cierto umbral hacia el límite, el sistema de tiles
**reembaraja** la semilla de un sector ya visitado (sendero que desaparece, árbol distinto, camino
devuelto). Reglas para que no parezca bug:

- Solo en el Boundary/Endless Forest, nunca en el núcleo.
- Solo con transición (niebla densa, giro, o "parpadeo" de tensión del Director).
- Frecuencia baja; siempre deja un *landmark* reconocible para no frustrar.
- **Árboles-Umbral** (renombrado, NO "Farway"): un tipo concreto de árbol marcador que, al cruzarlo,
  **reubica** al jugador en otro sector del bosque (el mecanismo de reconfiguración se *ancla* a estos
  árboles). Son el "portal" diegético, no un bug.
- **Umbral de entrada:** al llegar, un **árbol caído + bandada de cuervos** marca que "ya estás dentro"
  (el bucle empieza); refuerza el motivo del mapa y enlaza con el bucle de THE ROAD.

---

## 9. Modularidad

Nada de "un mesh gigante". Kits reutilizables (ver `BLENDER_PIPELINE.md §5`):

```
House_A/B/C   Road_Straight/Curve/Intersection   Fence_A/B
Tree_A/B/C    Rock_A/B    Lamp_A/B    InteriorRoom_A/B    Prop_*
```

El pueblo se compone combinando piezas + variación por seed (rotación, escala, material). Esto
abarata el pipeline Blender y el rendimiento (instancing).
