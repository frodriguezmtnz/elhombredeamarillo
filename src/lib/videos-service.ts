import { getSupabase } from '@lib/supabase-browser';
import type { VideoData, VideoReference } from '@lib/types';

interface VideoRow {
  id: string;
  code: string;
  category: string;
  title: string;
  description: string;
  video_id: string;
  published_at: string | null;
  sort_order: number;
  label: string | null;
  guests: string[] | null;
  references: VideoReference[] | null;
}

export function mapVideoRow(row: VideoRow): VideoData {
  return {
    id: row.id,
    code: row.code,
    category: row.category === 'debate' ? 'debate' : 'analysis',
    title: row.title,
    description: row.description,
    videoId: row.video_id,
    publishedAt: row.published_at ?? undefined,
    order: row.sort_order,
    label: row.label ?? undefined,
    guests: row.guests ?? undefined,
    references: row.references ?? undefined,
  };
}

/**
 * Elige el catálogo a mostrar: el remoto (Supabase) si trae vídeos,
 * y si no, el respaldo estático.
 */
export function pickVideos(fallback: VideoData[], remote?: VideoData[]): VideoData[] {
  return remote && remote.length > 0 ? remote : fallback;
}

function describeError(err: unknown): string {
  if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
    return 'El archivo tarda demasiado en responder';
  }
  return err instanceof Error ? err.message : 'No hay conexión con el archivo';
}

/**
 * Catálogo de vídeos desde Supabase (lectura pública vía RLS).
 * La web parte de los datos estáticos y los reemplaza con esta respuesta
 * cuando llega; si falla, se queda con los estáticos.
 */
export async function fetchVideos(): Promise<{ data?: VideoData[]; error?: string }> {
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('videos')
      .select('*')
      .order('sort_order', { ascending: false })
      .abortSignal(AbortSignal.timeout(10_000));

    if (error) return { error: error.message };
    return { data: ((data ?? []) as VideoRow[]).map(mapVideoRow) };
  } catch (err) {
    return { error: describeError(err) };
  }
}
