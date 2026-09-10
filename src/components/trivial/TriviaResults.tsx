import { TRIVIA_QUESTIONS, getRank } from '@data/trivial';
import type { TriviaBestScore, TriviaQuestion } from '@lib/types';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import type { TriviaSummary } from './TriviaGame';

const BEST_KEY = 'trivial-best';

interface Props {
  summary: TriviaSummary;
  deck: TriviaQuestion[];
  onPlayAgain: () => void;
  onNewMode: () => void;
}

function loadBest(): TriviaBestScore | null {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as TriviaBestScore) : null;
  } catch {
    return null;
  }
}

export default function TriviaResults({ summary, deck, onPlayAgain, onNewMode }: Props) {
  const { correct, total, score, bestStreak, modeLabel, records } = summary;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const rank = getRank(accuracy);
  const [best, setBest] = useState<TriviaBestScore | null>(null);
  const isNewBest = best !== null && score > best.score;

  // biome-ignore lint/correctness/useExhaustiveDependencies: solo debe evaluarse al montar, con el resumen final de la partida
  useEffect(() => {
    const previous = loadBest();
    setBest(previous);
    if (!previous || score > previous.score) {
      const entry: TriviaBestScore = {
        score,
        correct,
        total,
        modeLabel,
        rank: getRank(accuracy).name,
        date: new Date().toISOString(),
      };
      try {
        window.localStorage.setItem(BEST_KEY, JSON.stringify(entry));
      } catch {
        // almacenamiento no disponible: la sesión se muestra igual
      }
    }
    // Solo al montar: resume la partida terminada
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 lg:p-10">
      <p className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-2">
        EXPEDIENTE CERRADO · MODO {modeLabel.toUpperCase()}
      </p>

      <div className="flex flex-col lg:flex-row lg:items-end gap-8">
        <div>
          <h2 className="font-pixel text-[clamp(2rem,5vw,3.5rem)] uppercase leading-none">
            {correct}/{total} aciertos
          </h2>
          <p className="mt-3 text-text-muted text-sm font-mono tracking-wider">
            {accuracy}% de precisión · {score} puntos · mejor racha x{bestStreak}
          </p>
        </div>
        <div className="lg:ml-auto text-left lg:text-right">
          <p className="text-[9px] font-bold tracking-[.14em] text-text-muted uppercase font-mono">RANGO ALCANZADO</p>
          <p className="mt-1 font-pixel text-[clamp(1.6rem,4vw,2.6rem)] uppercase text-yellow">{rank.name}</p>
        </div>
      </div>

      <p className="mt-4 text-text-muted text-sm leading-relaxed max-w-[60ch]">{rank.description}</p>

      {/* Resumen de respuestas */}
      <div className="mt-8 border-t border-border pt-6">
        <p className="text-[10px] font-bold tracking-[.14em] text-text-muted uppercase font-mono mb-3">
          BITÁCORA DE LA PARTIDA
        </p>
        <ol className="space-y-2">
          {records.map((record, i) => {
            const question = deck[i];
            const original = TRIVIA_QUESTIONS.find((q) => q.id === record.questionId);
            const label = original?.question ?? question?.question ?? '';
            return (
              <li key={record.questionId} className="flex items-start gap-3 text-xs leading-relaxed">
                <span
                  className={clsx(
                    'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-[10px] font-bold',
                    record.correct
                      ? 'border-yellow/50 bg-yellow-soft text-yellow'
                      : 'border-rust/50 bg-rust/10 text-rust-hot',
                  )}
                  aria-hidden="true"
                >
                  {record.correct ? '✓' : '✗'}
                </span>
                <span className="text-text-muted line-clamp-2">
                  {label}
                  {record.timedOut && <b className="text-rust-hot"> — se hizo de noche (sin responder)</b>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {best && (
        <p className="mt-6 text-[10px] font-bold tracking-[.1em] text-text-muted/60 uppercase font-mono">
          MEJOR MARCA HISTÓRICA: {best.score} PTS · {best.correct}/{best.total} · {best.rank}
          {isNewBest && <b className="ml-2 text-yellow-bright"> — NUEVO RÉCORD</b>}
        </p>
      )}

      <div className="flex flex-wrap gap-3 mt-8">
        <button
          type="button"
          onClick={onPlayAgain}
          className="inline-flex items-center gap-3 min-h-[48px] px-5 bg-yellow text-bg text-[11px] font-bold tracking-[.12em] uppercase font-mono rounded-xl hover:brightness-110 transition-all cursor-pointer"
        >
          JUGAR OTRA VEZ <b>→</b>
        </button>
        <button
          type="button"
          onClick={onNewMode}
          className="inline-flex items-center gap-3 min-h-[48px] px-5 border border-border text-text text-[11px] font-bold tracking-[.12em] uppercase font-mono rounded-xl hover:border-yellow hover:text-yellow transition-all cursor-pointer"
        >
          CAMBIAR DE PRUEBA
        </button>
        <a
          href="/expedientes"
          className="inline-flex items-center gap-3 min-h-[48px] px-5 border border-border text-text-muted text-[11px] font-bold tracking-[.12em] uppercase font-mono rounded-xl hover:border-yellow hover:text-yellow transition-all"
        >
          IR A LOS EXPEDIENTES <b>↗</b>
        </a>
      </div>
    </div>
  );
}
