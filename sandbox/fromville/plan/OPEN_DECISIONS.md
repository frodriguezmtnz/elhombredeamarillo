# OPEN DECISIONS — FROMVILLE

> Decisiones importantes que no se cierran en el planning. **Ninguna bloquea el desarrollo**: cada
> una tiene una **recomendación provisional** para seguir. Formato: Problema / Opciones /
> Recomendación / Impacto. Revisar al final de la fase indicada.

---

## OD-1 · Nombre comercial del producto
- **Problema:** "FROMVILLE" evoca la marca "FROM"; publicable? 
- **Opciones:** (a) mantener FROMVILLE solo interno; (b) reutilizar el universo propio de THE ROAD
  ("Marrow Falls"); (c) nombre nuevo original.
- **Recomendación provisional:** (b/c) — usar un nombre propio; FROMVILLE queda como *codename*.
- **Impacto:** marketing, ASO/SEO, riesgo legal. **Revisar:** Fase 16.

## OD-2 · Linterna con batería o sin ella
- **Problema:** ¿la batería limitada aporta o castiga?
- **Opciones:** (a) batería generosa (tensa, no frustrante); (b) sin batería, riesgo solo de visibilidad.
- **Recomendación provisional:** (a) con batería perdonadora (`GAME_DESIGN.md §7`).
- **Impacto:** pacing nocturno y diseño de recursos. **Revisar:** Fase 9.

## OD-3 · Motor de física
- **Problema:** ¿colisión custom basta o hace falta Rapier?
- **Opciones:** (a) custom (cápsula+AABB+raycast); (b) Rapier WASM; (c) esperar.
- **Recomendación provisional:** (a) en MVP; interfaz `physics/` para enchufar Rapier si aparecen
  puertas físicas/props/ragdoll. **Impacto:** tamaño binario, complejidad. **Revisar:** Fase 6.

## OD-4 · NPR 3D "toon" vs híbrido estilizado
- **Problema:** ¿llegar al look del mapa ilustrado en 3D o solo como arte 2D?
- **Opciones:** (a) híbrido (3D estilizado + mapa 2D); (b) NPR toon total en 3D; (c) realista.
- **Recomendación provisional:** (a) (`VISUAL_DIRECTION.md`). (b) es un proyecto de shader aparte.
- **Impacto:** coste artístico, rendimiento. **Revisar:** Fase 2.

## OD-5 · Audio procedural vs samples
- **Problema:** el procedural (THE ROAD) puede quedarse corto para terror de alta gama.
- **Opciones:** (a) 100% procedural; (b) samples CC0/CC-BY; (c) híbrido.
- **Recomendación provisional:** (c) híbrido — procedural de base + samples selectos para hits de
  horror, con licencias en `CREDITS.md`. **Impacto:** tamaño, licensing. **Revisar:** Fase 7.

## OD-6 · Streaming de mundo
- **Problema:** ¿hace falta chunk streaming real?
- **Opciones:** (a) mapa finito + niebla (THE ROAD); (b) chunks por distancia; (c) portales.
- **Recomendación provisional:** (a) para la slice; (b) si el mapa crece post-slice.
- **Impacto:** memoria, complejidad. **Revisar:** Fase 12.

## OD-7 · Assets externos en el pipeline
- **Problema:** el MCP **oficial** no trae Poly Haven/Sketchfab/Hyper3D.
- **Opciones:** (a) solo modelado propio; (b) descargar CC0/CC-BY a mano; (c) usar el addon
  ahujasid *solo* para importar (incompatible con el oficial → no mezclar).
- **Recomendación provisional:** (a) + (b) puntual con licencias. **Impacto:** velocidad de producción.
- **Revisar:** Fase 5.

## OD-8 · Guardado en la nube / progreso entre dispositivos
- **Problema:** IndexedDB es local por navegador.
- **Opciones:** (a) solo local; (b) export/import de save (JSON); (c) backend.
- **Recomendación provisional:** (a) MVP + (b) "exportar partida" barato. Sin backend.
- **Impacto:** UX. **Revisar:** Fase 10.

## OD-9 · Accessibilidad del horror (modo no-susto)
- **Problema:** flashes/estridencias excluyen a personas sensibles.
- **Opciones:** (a) nada; (b) toggles de flashing/score + reducir grain/head-bob.
- **Recomendación provisional:** (b), respetando `prefers-reduced-motion`. **Impacto:** alcance.
- **Revisar:** Fase 13.

## OD-10 · Motor/escritorio vs solo navegador
- **Problema:** ¿empaquetar (Electron/Tauri) para Steam?
- **Opciones:** (a) solo web; (b) Tauri wrapper.
- **Recomendación provisional:** (a) para la slice; (b) solo si hay interés de publicación.
- **Impacto:** distribución. **Revisar:** Fase 16.

## OD-11 · ¿Los Sellos son la mecánica central de refugio?
- **Problema:** el Sistema de Sellos (`GAME_DESIGN §5` / `AI §4.5`) da mucha identidad, pero puede
  competir con la linterna y volver el bucle "trampeable" (sellarse y ganar siempre).
- **Opciones:** (a) Sellos **centrales** y escasos; (b) Sellos como **capa** junto a la regla de
  "puerta+cierre"; (c) quitar Sellos, dejar solo cerrojos.
- **Recomendación provisional:** (a) pero con **escasez dura** (se gastan) para que no sea modo dios.
- **Impacto:** pacing nocturno, economía de recursos. **Revisar:** Fase 8.

## OD-12 · ¿Facciones (Pueblo vs La Colina) en el MVP?
- **Problema:** las dos facciones (`WORLD_DESIGN §3.5`) dan rica narrativa pero amplían scope (más
  NPCs, más reglas de acceso, más diálogo).
- **Opciones:** (a) completas en slice; (b) **solo insinuadas** (1 NPC de cada); (c) fuera hasta post-slice.
- **Recomendación provisional:** (b) insinuadas en la vertical slice; mecánica completa después.
- **Impacto:** scope narrativo y de IA de NPCs. **Revisar:** Fase 11.
