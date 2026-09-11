import { getRank } from '@data/trivial';
import { sanitizePlayerAlias, submitTriviaScore } from '@lib/trivial-service';
import { useState } from 'react';
import { useAuth } from '../community/AuthProvider';
import type { TriviaSummary } from './TriviaGame';

const ALIAS_KEY = 'trivial-alias';
const MAX_POINTS_HINT = 30000;

interface Props {
  summary: TriviaSummary;
  onRecorded: (id: string) => void;
}

function loadAlias(): string {
  try {
    return window.localStorage.getItem(ALIAS_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function TriviaSubmit({ summary, onRecorded }: Props) {
  const { user, openLogin } = useAuth();
  const [alias, setAlias] = useState(() => loadAlias());
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const accuracy = summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0;
  const rank = getRank(accuracy).name;
  const effectiveScore = Math.min(summary.score, MAX_POINTS_HINT);

  async function publish() {
    setStatus('sending');
    setError('');
    const clean = sanitizePlayerAlias(alias) || 'Anónimo';
    try {
      window.localStorage.setItem(ALIAS_KEY, clean);
    } catch {
      // sin almacenamiento: se publica igualmente
    }
    const result = await submitTriviaScore({
      userId: user?.id ?? null,
      player: clean,
      mode: summary.modeLabel,
      score: effectiveScore,
      correct: summary.correct,
      total: summary.total,
      bestStreak: summary.bestStreak,
      rank,
    });
    if (result.error) {
      setError(result.error);
      setStatus('error');
      return;
    }
    setStatus('sent');
    if (result.id) onRecorded(result.id);
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-yellow/40 bg-yellow-soft p-5 lg:p-6">
        <p className="text-[10px] font-bold tracking-[.14em] text-yellow uppercase font-mono">
          MARCADOR PUBLICADO EN EL TABLÓN
        </p>
        <p className="mt-2 text-text-muted text-xs leading-relaxed">
          Tu {effectiveScore} pts como «{sanitizePlayerAlias(alias) || 'Anónimo'}»{' '}
          {user ? 'quedan verificadas con tu cuenta.' : ' quedan como anónimas.'} Mira tu posición más abajo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 lg:p-6">
      <p className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-1">
        TABLÓN DEL PUEBLO · PUBLICA TU MARCA
      </p>
      <p className="text-text-muted text-xs leading-relaxed mb-4">
        {user ? (
          <>
            Aparecerás <b className="text-yellow">verificado</b> con tu cuenta. Puedes usar el alias que quieras.
          </>
        ) : (
          <>
            Puedes publicar sin cuenta (marca anónima), pero{' '}
            <button
              type="button"
              onClick={openLogin}
              className="text-yellow underline underline-offset-2 hover:text-yellow-bright transition-colors cursor-pointer"
            >
              inicia sesión
            </button>{' '}
            para que sea tuya de verdad y poder borrarla.
          </>
        )}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <label className="flex-1">
          <span className="sr-only">Alias para el tablón</span>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value.slice(0, 24))}
            maxLength={24}
            placeholder={user ? (user.email ?? '').split('@')[0] : 'Anónimo'}
            disabled={status === 'sending'}
            className="w-full min-h-[44px] px-4 rounded-xl bg-bg border border-border text-sm text-text placeholder:text-text-muted/40 focus:outline-2 focus:outline-yellow"
          />
        </label>
        <button
          type="button"
          onClick={publish}
          disabled={status === 'sending'}
          className="inline-flex items-center justify-center gap-3 min-h-[44px] px-5 bg-yellow text-bg text-[11px] font-bold tracking-[.12em] uppercase font-mono rounded-xl hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          {status === 'sending' ? 'PUBLICANDO...' : 'PUBLICAR EN EL TABLÓN'}
        </button>
      </div>

      {status === 'error' && (
        <p className="mt-3 text-rust-hot text-xs font-mono" role="alert">
          No se pudo publicar: {error}
        </p>
      )}
    </div>
  );
}
