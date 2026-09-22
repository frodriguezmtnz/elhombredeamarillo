# Tasks

## 1. Campana de Boyd

- [x] 1.1 Comparar v1 y v2 (duración, tono, encaje con la cuenta atrás) y registrar la elección en este cambio — **elegida la v2**
- [x] 1.2 Actualizar `BELL_SRC` a la versión elegida y verificar reproducción en `/trivial` — **ya apuntaba a la v2**
- [x] 1.3 Borrar el mp3 descartado y verificar que `public/assets/audio/` solo contiene el usado — **v1 retirada; queda solo `campana-boyd-trivial-v2.mp3`**

## 2. Música de fondo

- [x] 2.1 Documentar las opciones (auto-hospedar vs streaming, licencia de Chris Tilton) y registrar la decisión del equipo — **descartada por derechos de autor**
- [x] 2.2 Si se aprueba, abrir un cambio nuevo que añada la música (volumen bajo, fade y control de silencio) y actualice la spec `trivial-game`; si no, dejar constancia del descarte — **constancia del descarte registrada; si algún día se aprueba, irá en un cambio aparte**

## 3. Verificación

- [x] 3.1 Ejecutar `pnpm build` y verificar que el proyecto compila tras eliminar el asset — **build ✓ (dist solo con la v2)**
- [x] 3.2 Ejecutar `openspec validate decision-audio-trivial --strict` y verificar que pasa
