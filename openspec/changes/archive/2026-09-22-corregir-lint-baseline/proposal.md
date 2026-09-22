# Proposal

## Why

`pnpm lint` (`biome check .`) falla hoy a nivel de repositorio por avisos y errores preexistentes, así que no sirve como puerta de calidad ni se puede exigir en CI. Sin una línea base limpia, cualquier PR arrastra ruido y es difícil distinguir lo nuevo de lo viejo.

## What Changes

- Corregir los diagnósticos de Biome que hoy impiden que `pnpm lint` termine con éxito (variables sin usar en frontmatter de `.astro`, orden de imports y formato).
- Decidir explícitamente qué hacer con `src/data/trivial.json`: o se formatea (diff grande y menos legible) o se excluye de Biome por ser un banco de datos editorial.
- Dejar `pnpm lint` en verde y documentar el comando como verificación de PR.

## Impact

- `biome.json` (posibles overrides/ignores), `src/pages/*.astro`, `public/sw.js`, `src/data/trivial.json`.
- No cambia comportamiento de usuario; solo tooling y estilo.
