---
name: publish-video
description: Publicar un vídeo nuevo de YouTube en la web (catálogo Supabase + miniatura + PR). Usar cuando el usuario pasa un ID de vídeo para añadirlo a /videos. Palabras clave: publicar video, anadir video, nuevo video, video ID, video:add.
---

# Publicar un vídeo nuevo

Flujo para añadir un vídeo al catálogo sin redeploy. La fuente de verdad es la
tabla `videos` de Supabase; `src/data/videos.ts` es solo respaldo.

## Cuándo
Cuando el usuario pasa un ID de YouTube (11 caracteres) para añadirlo a `/videos`.

## Entrada
- `videoId` (`^[A-Za-z0-9_-]{11}$`)
- Campos editoriales (se proponen y el usuario aprueba): `code`, `category`,
  `description`, `publishedAt`, `label`, `guests`, `references`.

## Pasos
1. **Dry-run**: `pnpm video:add <videoId> --code="..." --description="..." --category=analysis --dry-run`.
   Trae el título y el canal reales vía oEmbed y muestra la fila sin escribir.
2. **Proponer la fila** al usuario con el estilo del sitio:
   - `code`: p. ej. `T5 // TEORÍA`, `T5 // ACTUALIDAD`, `T4E10`.
   - `category`: `analysis` o `debate`.
   - `description`: 1-2 frases editoriales (no el texto de YouTube).
   - `publishedAt`: `YYYY-MM-DD` si el usuario la conoce (oEmbed no la da).
   - Si es debate: `--label` y `--guests` con claves de `CREATORS` en
     `src/data/videos.ts` (`piroxeno`, `cafe`, `andrea`, `reinos`, `burri`,
     `charlemos`, `cine`).
   - `order`: automático (último + 10) salvo indicación.
3. **Esperar aprobación**; ajustar lo que pida.
4. **Insertar** (sin `--dry-run`): upsert en Supabase. Aparece en `/videos` al instante.
5. **Miniatura**: `pnpm thumbs` descarga `public/assets/thumbs/<videoId>.jpg`
   (prueba maxresdefault → hq720 → hqdefault). Si falla, la web usa el respaldo
   remoto de `i.ytimg.com`, así que no bloquea.
6. **PR de miniatura**: rama `chore/thumbs-<videoId>`, commit de la imagen, push y
   `gh pr create` (assignee del repo + label `enhancement`). Al mergear, el build
   de Vercel refresca JSON-LD, vídeo destacado y portada desde la tabla.
7. **Referencias** (fanart, entrevistas): `video:add` las inserta vacías. Si el vídeo
   tiene, añadirlas a `references` con un update puntual (service key) o desde
   Supabase Studio.

## Reglas
- No editar `src/data/videos.ts` para añadir vídeos: es el respaldo estático.
- `pnpm video:sync` es **siembra inicial**: sube el estático y sobrescribiría
  ediciones hechas en Supabase Studio. No ejecutarlo tras editar en Studio.
- Nunca commitear `.env` ni la service role key.
- En tests o fixtures de `src/`, no usar IDs de 11 caracteres literales: el escáner
  de miniaturas los descargaría. Generarlos con `repeat()`.

## Verificación
- `pnpm lint` y `pnpm test` en verde.
- Confirmar la fila insertada (`select` por `id` en Supabase).
- `pnpm thumbs` sin fallos.
