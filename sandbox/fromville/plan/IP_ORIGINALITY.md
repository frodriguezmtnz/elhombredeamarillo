# IP & ORIGINALITY — FROMVILLE

> **Documento crítico.** FROMVILLE está *inspirado conceptualmente* en el terror de la serie FROM,
> pero debe ser una **obra original**, no un fangame. Este doc acota qué se puede usar y qué no.
> Depende de `FROMVILLE_PLAN.md`.

---

## 1. Regla general

Se pueden tomar **conceptos e ideas** (que no son protegibles), **nunca** la **expresión** concreta
(personajes, nombres, diálogos, diseños, música, assets, lore específico). Objetivo: producir una
*sensación* similar con material **propio**.

> "Un pueblo del que no puedes escapar" = idea (usable).
> "El talismán de [nombre concreto de la serie]" = expresión (NO).

---

## 2. Conceptos GENÉRICOS (usables, no son de nadie)

- Pueblo pequeño americano aislado; carretera que devuelve al punto de partida.
- Bosque que rodea y desorienta; ciclo día/noche; criaturas nocturnas.
- Refugiarse en casas; linterna con batería; misterio ambiental; paranoia; "algo te observa".
- Reglas sobrenaturales del lugar; comunidad con un secreto; bucle temporal/espacial.
- Arquetipos genéricos: sheriff, diner, iglesia, cementerio, motel, gasolinera.

Estos son **tropos del género de terror** → libres.

---

## 3. Elementos que DEBEN ser originales (no copiar)

| Categoría | Evitar | Hacer en su lugar |
|---|---|---|
| **Nombres propios** | Nombres de personajes, lugares y términos concretos de la serie | Nombres nuevos ("FROMVILLE" es provisional y genérico-suficiente; revisar; criaturas "The Hollow" provisional) |
| **Criaturas** | Sus diseños, reglas y nombres exactos | Silueta humanoide propia con lore propio (`AI.md §1`) |
| **Lore** | El mito/origen concreto de la serie | Misterio propio (`NARRATIVE_MYSTERY.md §3`) |
| **Objetos clave** | El talismán/artefacto específico y su iconografía | Objeto original (p. ej. la "fotografía" es un recurso narrativo genérico de bucle) |
| **Diálogos/textos** | Líneas o documentos de la serie | Textos escritos desde cero |
| **Música/sonido** | BSO o efectos sonoros identificables | Audio procedural/CC0 propio |
| **Assets 3D** | Modelos/renders/texturas de la serie o de fans | Blender propio o CC0 verificado |
| **Logos/tipos** | Logotipo y rótulos de la serie | Identidad visual propia (`VISUAL_DIRECTION.md`) |
| **Caras/actores** | Semejanza deliberada con actores | Diseños neutros |

---

## 3.5 Traductor fandom → original (mapa y conceptos)

La wiki de fans llama **"Fromville"** al pueblo (es un **apodo de la comunidad**, no nombre canónico),
y usa términos concretos protegidos. El mapa de referencia los toma prestados → **renombrar** y
**transformar** antes de publicar. Equivalencias adoptadas en este planning:

| Término fandom (NO usar) | Equivalente FROMVILLE (propio) | Dónde |
|---|---|---|
| "Fromville" (apodo fan) | **Marrow Falls / codename FROMVILLE** | `OPEN_DECISIONS.md §OD-1` |
| Man in Yellow / traje amarillo | ***El Coleccionista*** (sin amarillo) | `NARRATIVE_MYSTERY.md §3` |
| Boy in White | ***La Guía*** (figura ambigua propia) | `NARRATIVE_MYSTERY.md §3` |
| Farway Trees | **Árboles-Umbral** | `WORLD_DESIGN.md §8` |
| Talismans | **Sellos** | `GAME_DESIGN.md §5` |
| Colony / Colony House | **La Colina / Los Colunist** | `WORLD_DESIGN.md §3.5` |
| Creature "walking, circling" | Regla de velocidad propia | `AI.md §2.7` |
| Lore del sacrificio/reencarnación | Mito del "cruce de caminos" propio | `NARRATIVE_MYSTERY.md §3` |

> Regla operativa: si un nombre/diseño/diálogo es reconocible **de la serie**, se sustituye por el
> equivalente de esta tabla. El **concepto de género** (pueblo-bucle, criatura que no corre, sello de
> protección, voz que imita) sí es reutilizable porque es genérico.

---

## 4. El nombre "FROMVILLE"

"FROM" es un título protegido como marca; **"Fromville" es literalmente el apodo que la comunidad de
fans da al pueblo de la serie**, así que evoca la marca de forma directa. **"FROMVILLE" es solo un
codename interno** y **no** se usa en un producto publicado sin análisis legal. Alternativas
originales a evaluar en Fase 16: p. ej. **"Marrow Falls"** (ya usado en THE ROAD, propio del repo),
"Still Creek", "Hollow Bend", "The Loop", etc. Ver `OPEN_DECISIONS.md §OD-1`.

---

## 5. Relación con THE ROAD

`sandbox/the-road` ya declara ser **100% original** e inspirado solo en conceptos generales. FROMVILLE
sigue la misma política y **reutiliza su mundo narrativo propio** (Marrow Falls, el bucle, la
fotografía) en lugar de material de la serie. Esto es una ventaja de IP: tenemos un universo propio.

---

## 6. Assets de terceros (Blender/CC0)

- Poly Haven / Poly Pizza / Sketchfab: **revisar licencia**. CC0 = ok; **CC-BY exige atribución**
  (guardar crédito junto al asset). **No usar** modelos que repliquen props de la serie.
- El add-on oficial de Blender **no** integra estos catálogos (`BLENDER_PIPELINE.md §2`): si se
  usan, seremos explícitos con la licencia en `public/assets/CREDITS.md`.

---

## 7. Checklist por PR (para el agente)

- [ ] Ningún nombre/diálogo/diseño/música copiado de obra protegida.
- [ ] Criaturas y lore = los definidos en `AI.md` / `NARRATIVE_MYSTERY.md` (originales).
- [ ] Todo asset de terceros tiene licencia verificada y (si CC-BY) atribución.
- [ ] El nombre comercial del producto se revisa antes de publicar (no "FROM" literal).
