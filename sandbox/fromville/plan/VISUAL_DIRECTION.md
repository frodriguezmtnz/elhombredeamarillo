# VISUAL DIRECTION — FROMVILLE

> Dirección de arte. Decisión cerrada con el usuario: **híbrido estilizado** (no fotorrealismo),
> con el mapa ilustrado como arte 2D. Depende de `FROMVILLE_PLAN.md`. Complementos:
> `PERFORMANCE.md`, `BLENDER_PIPELINE.md`, `WORLD_DESIGN.md`.

---

## 1. Look objetivo

**"Realistic-adjacent stylized horror"** — atmósfera cinematográfica pero con paleta y pincelada
controladas, no PBR de producción AAA. Prioridad absoluta: **Atmosphere > Polygon count**.

Razones del híbrido (vs fotorrealismo):
- Encaja con navegador (menos coste de materiales/luz que un PBR realista).
- **Original** frente al look fotográfico de la obra que inspira (`IP_ORIGINALITY.md`).
- La estilización *esconde* la geometría procedural y la repetición del bosque a favor del terror.

---

## 2. Paleta

Derivada del mapa ilustrado del usuario:

- **Verdes apagados** oliva/salvia para el bosque (nunca verde vivo).
- **Beige/crema/sepia** para suelo, carretera y papel.
- **Acentos fríos** (azul-verdoso) para noche, niebla y lo sobrenatural.
- **Un acento cálido raro** (ámbar de farola/ventana, rojo de tejado) = señal de refugio o de peligro.
- Desaturación general + grano de película → sensación "recuerdo/maqueta".

**Día vs Noche:** día = sepia cálido lechoso; noche = azul-verdoso con foco puntual (linterna). El
atardecer cruza por naranjas→púrpuras→azules (ver `HORROR_SYSTEM.md §3`).

---

## 3. El mapa ilustrado como arte 2D

La imagen de referencia (mapa dibujado a mano) se reutiliza como **activo 2D del juego**, no como
render 3D:

- **Mapa en papel** que el jugador encuentra (objetivo + orientación "a la antigua", sin minimapa).
- **Pantalla de carga / menú principal / portada.**
- Estilo coherente con la paleta §2.

Ventaja: refuerza *environmental storytelling*, da identidad y **no** obliga a un NPR 3D complejo.
(Se documenta como OPEN DECISION si en el futuro se quisiera el 3D *toon* total: `OPEN_DECISIONS.md`.)

---

## 4. Iluminación

| Técnica | Uso | Nota |
|---|---|---|
| Directional (sun/moon) | Ciclo día/noche | Una sola, frustum ajustado para sombras baratas |
| Hemisphere | Relleno cielo/suelo | Cambia con la fase |
| SpotLight | Linterna | Cono + penumbra + flicker (`GAME_DESIGN.md §7`) |
| PointLight | Farolas/ventanas | Pocos, budget estricto |
| **Lightmaps horneados** | Interiores | Desde Blender (ver `BLENDER_PIPELINE.md`) |
| **Fog volumétrico** | Atmósfera + ocultar borde | Niebla exponencial + capas de "god rays" baratos |

**Sombra:** preferir sombras horneadas (lightmap) sobre dinámicas para interiores; dinámicas solo
para jugador/criatura/props móviles. Cascaded shadows opcionales en HIGH.

---

## 5. Post-procesado (EffectComposer)

Pipeline (en este orden), activable por calidad LOW/MED/HIGH:

```
RenderPass → (SSAO/GTAO opcional) → Bloom → GodRays(opc) → Vignette → FilmGrain → ColorGrading(LUT) → OutputPass(ACES)
```

- **Tone mapping:** ACESFilmic.
- **Bloom:** sutil, para luces nocturnas y el "brillo" de lo sobrenatural.
- **Vignette + grain:** sellan el look "pelicula/maqueta".
- **LUT/color grading:** uno cálido (día) y uno frío (noche), interpolados por fase.
- **SSAO/GTAO:** solo MED/HIGH; en LOW se sustituye por AO horneada.

**Reducir en LOW:** desactivar SSAO, bloom y god rays; bajar pixelRatio (cap 1.0-1.25).

---

## 6. Materiales y shaders

- **PBR "sucio" y desaturado** (roughness alto, metalness bajo) para lo realista-adjacent.
- **Texturas pintadas a mano** (hand-painted) para bosque/props → coherente con el mapa y barato.
- **Shader de agua/lodo** barato para Wetlands/Pleasant Lake.
- **Fog shader** con densidad por fase (hook del Director).
- **Impostores** para árboles lejanos (ver `PERFORMANCE.md`).

---

## 7. Referencias de sensación (no copiar sistemas)

Analizar *cómo* generan tensión, no *qué*: P.T. (bucle + escala), Silent Hill (niebla como límite),
Alan Wake (luz vs oscuridad), Firewatch/Edith Finch (paleta y narrativa ambiental), SOMA/Amnesia
(vulnerabilidad + audio). El resultado debe ser **FROMVILLE**, reconocible por su paleta de mapa
ilustrado y su luz de pueblo aislado.
