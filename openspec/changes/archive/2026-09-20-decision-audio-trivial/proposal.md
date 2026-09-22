# Proposal

## Why

Hay dos decisiones abiertas sobre el audio del trivial que hoy están sin cerrar y generan dudas (y un archivo muerto en el repo):

1. La **campana de Boyd** tiene dos versiones: `campana-boyd-trivial.mp3` (v1) y `campana-boyd-trivial-v2.mp3` (v2, la activa). Falta decidir con cuál nos quedamos y borrar la otra.
2. La **música de fondo** durante la partida está descartada de momento por derechos de autor, pero conviene dejar registrada la decisión y las opciones.

## What Changes

- Decidir entre la campana v1 y v2 y eliminar el asset no usado.
- Documentar la decisión sobre la música de fondo (licencia) y, si se aprueba en el futuro, abrir un cambio aparte que actualice el comportamiento.
- Si se cambia la campana elegida, actualizar la spec `trivial-game` con el comportamiento final.

## Decision

- **Campana de Boyd**: nos quedamos con la **v2** (`campana-boyd-trivial-v2.mp3`). Ya es la activa en `BELL_SRC` (`src/components/trivial/TriviaCountdown.tsx`) y la **v1 se ha retirado** del repositorio.
- **Música de fondo**: **descartada** por derechos de autor. No se añade el mp3 ni la lógica de reproducción. Si en el futuro se aprueba su uso, se abrirá un cambio aparte (volumen bajo, fade in/out y control de silencio) que actualice la spec `trivial-game`.

## Impact

- `public/assets/audio/*`, `src/components/trivial/TriviaCountdown.tsx` (si aplica).
- Spec `trivial-game` (si la decisión cambia comportamiento).
- Depende de confirmación del equipo/legal para la música de fondo.
