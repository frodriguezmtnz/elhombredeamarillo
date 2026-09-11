import { getSupabase } from '@lib/supabase-browser';
import type { TriviaLeaderboardEntry, TriviaLeaderboardScope, TriviaScorePayload } from '@lib/types';

interface TriviaScoreRow {
  id: string;
  user_id: string | null;
  player: string;
  mode: string;
  score: number;
  correct: number;
  total: number;
  best_streak: number;
  rank: string;
  created_at: string;
}

function mapRow(row: TriviaScoreRow): TriviaLeaderboardEntry {
  return {
    id: row.id,
    player: row.player,
    mode: row.mode,
    score: row.score,
    correct: row.correct,
    total: row.total,
    bestStreak: row.best_streak,
    rank: row.rank,
    verified: row.user_id !== null,
    createdAt: row.created_at,
  };
}

/** Inicio (lunes 00:00, hora local) de la semana en curso */
export function weekStartIso(): string {
  const now = new Date();
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
  return monday.toISOString();
}

/** Limpia el alias: sin espacios raros y dentro del límite de la BD (24 chars) */
export function sanitizePlayerAlias(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 24);
}

function describeError(err: unknown): string {
  if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
    return 'El archivo tarda demasiado en responder';
  }
  return err instanceof Error ? err.message : 'No hay conexión con el archivo';
}

/**
 * Envía una partida terminada al tablón.
 * `player` se guarda con el payload ya saneado por la UI.
 */
export async function submitTriviaScore(payload: TriviaScorePayload): Promise<{ id?: string; error?: string }> {
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('trivia_scores')
      .insert({
        user_id: payload.userId,
        player: sanitizePlayerAlias(payload.player) || 'Anónimo',
        mode: payload.mode.slice(0, 40),
        score: payload.score,
        correct: payload.correct,
        total: payload.total,
        best_streak: payload.bestStreak,
        rank: payload.rank,
      })
      .select('id')
      .abortSignal(AbortSignal.timeout(10_000))
      .single();

    if (error) return { error: error.message };
    return { id: (data as { id: string }).id };
  } catch (err) {
    return { error: describeError(err) };
  }
}

/** Top de puntuaciones (histórico o semana en curso) */
export async function fetchTriviaLeaderboard(
  scope: TriviaLeaderboardScope,
  limit = 10,
): Promise<{ data?: TriviaLeaderboardEntry[]; error?: string }> {
  try {
    const sb = await getSupabase();
    let query = sb.from('trivia_scores').select('*');
    if (scope === 'week') {
      query = query.gte('created_at', weekStartIso());
    }
    const { data, error } = await query
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit)
      .abortSignal(AbortSignal.timeout(10_000));

    if (error) return { error: error.message };
    return { data: ((data ?? []) as TriviaScoreRow[]).map(mapRow) };
  } catch (err) {
    return { error: describeError(err) };
  }
}
