# NARRATIVE & MYSTERY — FROMVILLE

> Sistemas de narrativa y el misterio principal. Todo **original** (ver `IP_ORIGINALITY.md`).
> Depende de `GAME_DESIGN.md`. Complementos: `WORLD_DESIGN.md`, `HORROR_SYSTEM.md`.

---

## 1. Cómo se cuenta la historia

Principalmente por el entorno, **no** por cinemáticas:

- **Documentos** (notas, cartas, expedientes, recortes) legibles en el cuaderno.
- **Objetos colocados** (una mesa puesta para nadie; juguetes; fotos).
- **Grabaciones** (casetes, radio, contestador) con audio.
- **Lugares** (el Den, la piscina manchada, el memorial).
- **Eventos** del Director que revelan reglas del mundo.
- **Conversaciones** breves con NPCs/vecinos (diálogo con opciones mínimas).

Regla: **evitar cinemáticas excesivas.** Si hay cutscene, que sea in-engine, corta y saltable.

---

## 2. Subsistemas

### Story system
Máquina de progreso por **beat** (no "quests"). Cada beat tiene: disparador (pista descubierta,
noche superada, zona visitada), contenido (evento/documento/diálogo), y estado persistente. El
orden es **parcialmente no lineal**: el jugador puede descubrir beats en distinto orden, pero hay
un grafo de prerequisitos que garantiza coherencia.

### Dialogue system
Árbol mínimo por NPC, con estado ("conocido", "asustado", "ya no está"). El diálogo es fuente de
pistas y de *dread* (un vecino que de noche dice cosas que de día no diría). Reutiliza el patrón
`DialogueSystem` de THE ROAD.

### Clue system
Cada **pista** es un ítem tipado con: `id`, `texto`, `tema` (a qué pregunta del misterio apunta),
`descubierta`. El cuaderno agrupa pistas por tema. Las pistas se **conectan** (como el muro de
expedientes de la web) para formar teorías. Ver `NARRATIVE §4`.

### Lore system
Capas de lore **no obligatorias**: textos de ambiente, detalles del bosque, inscripciones. Nunca
bloquea el progreso; recompensa al que explora.

### Event system
Narrativa disparada por el Horror Director (`HORROR_SYSTEM.md §4`) que *además* avanza el misterio
(el coche que reaparece = pista del bucle).

---

## 3. Misterio principal (propio, reinterpretado)

Mito **original** (nada de la serie: ni sacrificio literal, ni reencarnaciones, ni nombres, ni el
"traje amarillo"). Núcleo temático: **el pueblo colecciona historias a medias.**

**El porqué (capa oculta, se revela tarde):** hay lugares en *cruces de caminos* —físicos y vitales—
que retienen a quien estaba **a punto de cambiar de vida**. El pueblo es uno: **recoge** a los que
pasaban por ahí y **los reproduce** en ciclos. No es un lugar con reglas; es una **historia que no
sabe terminar** y te usa de argumento.

Preguntas del jugador, respondidas **progresivamente** (nunca de golpe):

1. ¿Dónde estoy? → un pueblo que no aparece en ningún mapa.
2. ¿Por qué estoy aquí? → venías "por la carretera", en un cambio de vida, como todos.
3. ¿Por qué no puedo salir? → la carretera es un bucle; el bosque te devuelve (regla física §6).
4. ¿Qué son las criaturas? → **Los Hollow**: antiguos habitantes que **memorizan y repiten** rutinas
   y voces de los que ya no están. Imitan porque **aprenden**; *coleccionan* personas, no las comen.
5. ¿Quién manda aquí? → ***El Coleccionista*** (antagonista propio): el "comisario" que **prepara el
   escenario**; solo **toma la forma de quienes murieron aquí**; te habla por **radio/teléfono**;
   colecciona **objetos-persona** (una foto, unas gafas, un diente) como "recuerdo de la función".
   **No** viste de amarillo ni es un humano reconocible.
6. ¿Alguien me ayuda? → ***La Guía*** (figura ambigua propia): una presencia que da pistas **útiles
   pero con coste moral** (te pide que abras una puerta, que leas un nombre en voz alta, que dejes un
   objeto). Nunca sabes si acelera tu salida o tu repetición.
7. ¿Qué ocurre de noche? → el pueblo "reorganiza" su población; los Hollow salen del Den; los Sellos
   importan (`GAME_DESIGN.md §5`).
8. ¿Relación bosque ↔ pueblo? → el bosque es un **organismo/umbral**; el Boundary es su "piel"; los
   **Árboles-Umbral** son sus pliegues (`WORLD_DESIGN.md §8`).
9. ¿Hay salida real? → Sí, pero exige **terminar tu propia historia**: dejar atrás el objeto/persona
   que te ancla al cruce. Cerrar tu arco, no el del pueblo.

**Detalle de ambientación (pista, no texto literal):** *todo funciona* —hay agua en el grifo, luz en
la nevera con comida, un coche con depósito— pese al aislamiento. Que nada esté roto es **lo más
inquietante**: el lugar está "vivo" y te mantiene **cómodo el tiempo justo**. El jugador lo nota sin
que se lo digan.

**Revelación central (final de la slice, no del juego):** el jugador encuentra una **fotografía**
de sí mismo llegando, fechada **años antes** de su llegada, con **otros** parados en el mismo cruce.
El bucle no es un lugar: es una **función** que el pueblo representa con gente nueva. Conecta con el
payoff de THE ROAD (la foto del coche).

> El lore de arriba es un **borrador original**; se iterará. No toma nombres/criaturas/eventos/lore
> de ninguna serie (solo el concepto genérico de "pueblo que no te deja ir"). Ver `IP_ORIGINALITY.md`.

---

## 4. Estructura de pistas (payoff)

Cada pregunta del misterio tiene 2-4 pistas repartidas por zonas. El cuaderno muestra temas
**vacíos** que se rellenan (curiosidad → sospecha → confirmación). Ejemplo del hilo del bucle:

```
Pista A: "El odómetro del RV caído marca 0 pese a kilómetros dibujados" (Car Cemetery)
Pista B: "Dos letreros idénticos a 1 km" (Loop Road)
Pista C: "Tu coche en una foto vieja" (Town Center, beat de la slice)
   → Tema "La carretera" se completa → desbloquea la comprensión del Boundary
```

**Regla de diseño:** ninguna pista es decorativa; todas alimentan un tema que paga (principio
*payoff*, `GAME_DESIGN.md §10`).

---

## 5. Ritmo por ciclo día/noche

- **Día 1:** normalidad + primeras grietas (algo no encaja).
- **Noche 1:** primera aparición (observación, no ataque). Enseña la regla del refugio.
- **Día 2:** el pueblo cambió; aparece la fotografía (payoff de la slice).
- **Noche 2+:** Manipulate (la criatura imita tu voz). Profundiza el misterio.

La **vertical slice** termina tras el *Descubrimiento* de la fotografía, con la promesa del hilo
completo (ver `ROADMAP.md §MVP`).
