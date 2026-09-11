import { getSupabase } from '@lib/supabase-browser';
import { fetchTriviaLeaderboard } from '@lib/trivial-service';
import type { TriviaLeaderboardEntry, TriviaLeaderboardScope } from '@lib/types';
import { relativeTime } from '@lib/utils';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';

interface Props {
  /** Cambiar esta clave fuerza una recarga (p. ej. tras publicar) */
  refreshKey: number;
  /** Id de la fila recién publicada por el usuario para resaltarla */
  highlightId: string | null;
}

const SCOPES: { key: TriviaLeaderboardScope; label: string }[] = [
  { key: 'week', label: 'ESTA SEMANA' },
  { key: 'all', label: 'HISTÓRICO' },
];

export default function TriviaLeaderboard({ refreshKey, highlightId }: Props) {
  const [scope, setScope] = useState<TriviaLeaderboardScope>('week');
  const [entries, setEntries] = useState<TriviaLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchTriviaLeaderboard(scope, 10);
    if (result.error) {
      setError(result.error);
    } else {
      setError('');
      setEntries(result.data ?? []);
    }
    setLoading(false);
  }, [scope]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey cambia desde fuera para forzar recarga tras publicar
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Realtime: cuando alguien publica una marca, recargamos el tablón
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    getSupabase()
      .then((sb) => {
        if (cancelled) return;
        channel = sb
          .channel('trivia-leaderboard')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trivia_scores' }, () => {
            load();
          })
          .subscribe();
      })
      .catch(() => {
        // sin credenciales: el tablón funciona igual con recarga manual
      });

    return () => {
      cancelled = true;
      if (channel) {
        const ch = channel;
        channel = null;
        getSupabase()
          .then((sb) => sb.removeChannel(ch))
          .catch(() => {});
      }
    };
  }, [load]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono">TABLÓN DEL PUEBLO</p>
        <div className="flex gap-1" role="tablist" aria-label="Ámbito del tablón">
          {SCOPES.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={scope === item.key}
              onClick={() => setScope(item.key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-[9px] font-bold tracking-[.12em] uppercase font-mono transition-colors cursor-pointer',
                scope === item.key ? 'bg-yellow text-bg' : 'text-text-muted hover:text-yellow hover:bg-yellow/10',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="flex items-center gap-3 py-8 justify-center">
          <span className="w-4 h-4 border-2 border-text-muted/20 border-t-yellow rounded-full animate-spin" />
          <span className="text-[9px] font-bold tracking-[.1em] text-text-muted/60 uppercase font-mono">
            Consultando el archivo...
          </span>
        </div>
      ) : error ? (
        <div className="py-6 text-center">
          <p className="text-rust-hot text-xs font-mono">Tablón no disponible: {error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 text-[9px] font-bold tracking-[.12em] uppercase font-mono text-text-muted hover:text-yellow transition-colors cursor-pointer"
          >
            REINTENTAR
          </button>
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-text-muted text-xs font-mono">
          Nadie ha publicado una marca todavía. El pueblo espera a su primer sheriff.
        </p>
      ) : (
        <ol className="mt-4">
          {entries.map((entry, i) => {
            const isMe = entry.id === highlightId;
            return (
              <li
                key={entry.id}
                className={clsx(
                  'flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 text-xs',
                  isMe && 'bg-yellow-soft rounded-lg',
                )}
              >
                <span
                  className={clsx(
                    'w-7 shrink-0 text-center font-pixel text-base',
                    i === 0 ? 'text-yellow' : i < 3 ? 'text-yellow/60' : 'text-text-muted/50',
                  )}
                >
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 truncate font-bold tracking-wide text-text">
                  {entry.player}
                  {entry.verified && (
                    <b className="ml-1.5 text-yellow" title="Cuenta verificada">
                      ✓
                    </b>
                  )}
                  {isMe && <b className="ml-1.5 text-yellow-bright">(tú)</b>}
                </span>
                <span className="hidden sm:block w-32 truncate text-right text-[9px] uppercase font-mono text-text-muted/60">
                  {entry.mode}
                </span>
                <span className="w-14 text-right font-mono font-bold text-yellow">{entry.score}</span>
                <span className="hidden md:block w-24 text-right text-[9px] font-mono text-text-muted/50">
                  {entry.correct}/{entry.total} · {relativeTime(entry.createdAt)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
