import type { VideoData } from '@lib/types';
import { mapVideoRow } from '@lib/videos-service';

/**
 * Catálogo de vídeos leído en build (Astro frontmatter) directamente de
 * Supabase vía PostgREST con la anon key. Si faltan credenciales, Supabase
 * falla o el proyecto está pausado, devuelve `[]` para que la página caiga
 * al respaldo estático (`pickVideos`). Nunca debe romper el build.
 */
export async function fetchVideosAtBuild(): Promise<VideoData[]> {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return [];

  try {
    const response = await fetch(`${url}/rest/v1/videos?select=*&order=sort_order.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return [];

    const rows = await response.json();
    if (!Array.isArray(rows)) return [];

    return rows.map((row) => mapVideoRow(row));
  } catch {
    return [];
  }
}
