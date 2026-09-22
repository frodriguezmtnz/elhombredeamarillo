import { TRIVIA_CATEGORY_LABELS } from '@data/trivial';
import { computePoints, getTimeLimit } from '@lib/trivial-scoring';
import type { TriviaAnswerRecord, TriviaQuestion } from '@lib/types';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface TriviaSessionState {
  records: TriviaAnswerRecord[];
  score: number;
  streak: number;
  bestStreak: number;
}

export interface TriviaSummary {
  modeLabel: string;
  records: TriviaAnswerRecord[];
  correct: number;
  total: number;
  score: number;
  bestStreak: number;
  /** Racha en curso al cerrar la partida (se conserva al «continuar racha») */
  streak: number;
}

interface Props {
  deck: TriviaQuestion[];
  modeLabel: string;
  /** Estado acumulado de la sesión (modo «continuar racha») */
  initial?: TriviaSessionState;
  onFinish: (summary: TriviaSummary) => void;
  onQuit: () => void;
}

export default function TriviaGame({ deck, modeLabel, initial, onFinish, onQuit }: Props) {
  const firstLimit = getTimeLimit(deck[0]?.difficulty ?? 1);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(firstLimit);
  const [records, setRecords] = useState<TriviaAnswerRecord[]>(initial?.records ?? []);
  const [streak, setStreak] = useState(initial?.streak ?? 0);
  const [bestStreak, setBestStreak] = useState(initial?.bestStreak ?? 0);
  const [score, setScore] = useState(initial?.score ?? 0);
  const timeRef = useRef(firstLimit);
  const lockRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const question = deck[index];
  const limit = getTimeLimit(question.difficulty);
  const answered = selected !== null || timedOut;

  const answer = useCallback(
    (choice: number | null) => {
      if (lockRef.current) return;
      lockRef.current = true;
      // Congela la cuenta: al fallar (o acertar) el tiempo deja de descontarse
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const correct = choice !== null && choice === question.answer;
      const left = timeRef.current;
      const nextStreak = correct ? streak + 1 : 0;
      const points = correct ? computePoints(question.difficulty, left, limit, nextStreak) : 0;

      const record: TriviaAnswerRecord = {
        questionId: question.id,
        correct,
        timedOut: choice === null,
        timeLeft: Math.round(left * 10) / 10,
        points,
      };

      if (choice === null) setTimedOut(true);
      else setSelected(choice);
      setRecords((prev) => [...prev, record]);
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      setScore((prev) => prev + points);
    },
    [question, streak, limit],
  );

  // Temporizador por pregunta. El `lockRef` hace que, una vez respondida,
  // el efecto se re-ejecute sin reiniciar la cuenta (el tiempo queda congelado
  // en el momento de la respuesta hasta pulsar «siguiente»).
  useEffect(() => {
    if (lockRef.current) return;
    const questionLimit = getTimeLimit(deck[index]?.difficulty ?? 1);
    timeRef.current = questionLimit;
    setTimeLeft(questionLimit);

    const interval = window.setInterval(() => {
      timeRef.current = Math.max(0, timeRef.current - 0.1);
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        window.clearInterval(interval);
        intervalRef.current = null;
        answer(null);
      }
    }, 100);
    intervalRef.current = interval;

    return () => {
      window.clearInterval(interval);
      if (intervalRef.current === interval) intervalRef.current = null;
    };
  }, [index, answer, deck]);

  // Atajos de teclado: 1-4 / A-D responden y Enter (o Espacio) pasa a la siguiente
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;

      if (!answered) {
        const key = e.key.toLowerCase();
        let choice = -1;
        if (key >= '1' && key <= '4') choice = Number(key) - 1;
        else if (key >= 'a' && key <= 'd') choice = key.charCodeAt(0) - 97;
        if (choice >= 0 && choice < question.options.length) {
          e.preventDefault();
          answer(choice);
        }
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        // Si hay un botón activo con foco, deja que su propio click avance
        if (target?.closest('button:not([disabled]), a[href]')) return;
        e.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answered, answer, question]);

  function next() {
    lockRef.current = false;
    if (index + 1 >= deck.length) {
      const correct = records.filter((r) => r.correct).length;
      onFinish({
        modeLabel,
        records,
        correct,
        total: records.length,
        score,
        bestStreak,
        streak,
      });
    } else {
      setSelected(null);
      setTimedOut(false);
      setIndex((i) => i + 1);
    }
  }

  const progress = limit > 0 ? timeLeft / limit : 0;
  const secondsLeft = Math.ceil(timeLeft);
  const urgency: 'yellow' | 'orange' | 'red' = secondsLeft <= 5 ? 'red' : secondsLeft <= 10 ? 'orange' : 'yellow';
  const isLast = index + 1 === deck.length;
  const streakActive = streak >= 3;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 lg:p-10">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-[.12em] text-yellow uppercase font-mono">
            {String(index + 1).padStart(2, '0')}/{String(deck.length).padStart(2, '0')}
          </span>
          <span className="px-2 py-1 rounded bg-surface-raised border border-border text-[9px] font-bold tracking-[.1em] text-text-muted uppercase font-mono">
            {TRIVIA_CATEGORY_LABELS[question.category]}
          </span>
          {question.spoilersUpTo > 0 ? (
            <span className="px-2 py-1 rounded bg-rust/10 border border-rust/30 text-[9px] font-bold tracking-[.1em] text-rust-hot uppercase font-mono">
              T{question.spoilersUpTo} · spoilers
            </span>
          ) : (
            <span className="px-2 py-1 rounded bg-yellow/10 border border-yellow/25 text-[9px] font-bold tracking-[.1em] text-yellow/80 uppercase font-mono">
              sin spoilers
            </span>
          )}
          <span className="text-[9px] font-bold tracking-[.1em] text-text-muted/60 uppercase font-mono">
            {'●'.repeat(question.difficulty)}
            <span className="text-border-light">{'●'.repeat(3 - question.difficulty)}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {streakActive && (
            <span className="text-[10px] font-bold tracking-[.12em] text-yellow-bright uppercase font-mono animate-pulse">
              racha x{streak}
            </span>
          )}
          <span className="text-[11px] font-bold tracking-[.12em] text-yellow uppercase font-mono">{score} pts</span>
        </div>
      </div>

      {/* Temporizador */}
      <div className="mt-6 flex items-center gap-4">
        <div
          className="flex-1 h-2 rounded-full bg-border overflow-hidden"
          role="timer"
          aria-label={`Tiempo restante: ${secondsLeft} segundos`}
        >
          <div
            className={clsx(
              'h-full rounded-full transition-[width,background-color] duration-100',
              urgency === 'yellow' && 'bg-yellow',
              urgency === 'orange' && 'bg-amber-hot',
              urgency === 'red' && 'bg-rust-hot',
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span
          aria-hidden="true"
          className={clsx(
            'font-pixel leading-none tabular-nums transition-colors',
            urgency === 'yellow' && 'text-yellow',
            urgency === 'orange' && 'text-amber-hot',
            urgency === 'red' && 'text-rust-hot animate-pulse',
          )}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
        >
          {secondsLeft}
          <span className="align-top text-[0.45em]">s</span>
        </span>
      </div>
      {urgency === 'red' && (
        <p className="mt-1 text-right text-[10px] font-bold tracking-[.16em] text-rust-hot uppercase font-mono animate-pulse">
          ¡Se hace de noche!
        </p>
      )}

      {/* Pregunta */}
      <h2 className="mt-4 font-pixel text-[clamp(1.5rem,3.4vw,2.25rem)] leading-snug uppercase">{question.question}</h2>

      {/* Opciones */}
      {/* biome-ignore lint/a11y/useSemanticElements: un group de botones no tiene equivalente semántico único */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6" role="group" aria-label="Opciones de respuesta">
        {question.options.map((option, i) => {
          const isCorrect = i === question.answer;
          const isSelected = i === selected;
          return (
            <button
              key={`${question.id}-${i}`}
              type="button"
              disabled={answered}
              onClick={() => answer(i)}
              aria-pressed={isSelected}
              className={clsx(
                'text-left min-h-[56px] px-4 py-3 rounded-xl border text-sm leading-snug transition-all',
                !answered && 'border-border bg-surface-raised hover:border-yellow/50 hover:text-yellow cursor-pointer',
                answered && isCorrect && 'border-yellow bg-yellow/10 text-yellow-bright',
                answered && isSelected && !isCorrect && 'border-rust bg-rust/10 text-rust-hot',
                answered && !isCorrect && !isSelected && 'border-border/50 text-text-muted/50',
              )}
            >
              <span className="inline-block w-6 font-mono text-[11px] font-bold text-text-muted/60">
                {String.fromCharCode(65 + i)}.
              </span>
              {option}
              {answered && isCorrect && <b className="float-right">✓</b>}
              {answered && isSelected && !isCorrect && <b className="float-right">✗</b>}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div
          aria-live="polite"
          className={clsx(
            'mt-6 rounded-xl border p-4 lg:p-5',
            records[records.length - 1]?.correct ? 'border-yellow/40 bg-yellow-soft' : 'border-rust/40 bg-rust/10',
          )}
        >
          <p className="text-[10px] font-bold tracking-[.14em] uppercase font-mono text-text-muted">
            {records[records.length - 1]?.correct
              ? `Correcto · +${records[records.length - 1]?.points} pts`
              : timedOut
                ? 'Se hizo de noche · sin puntos'
                : 'Incorrecto · sin puntos'}
          </p>
          <div className="mt-2 flex flex-col sm:flex-row gap-4 sm:items-start">
            {question.image && (
              <img
                src={question.image}
                alt={question.imageAlt ?? ''}
                loading="lazy"
                className="w-full sm:w-48 sm:shrink-0 rounded-lg border border-border bg-bg object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm text-text leading-relaxed">{question.explanation}</p>
              {question.links && question.links.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {question.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold tracking-[.06em] text-yellow underline decoration-yellow/40 hover:text-yellow-bright hover:decoration-yellow transition-colors"
                      >
                        {link.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 mt-4">
            <button
              type="button"
              onClick={onQuit}
              className="text-[10px] font-bold tracking-[.12em] uppercase font-mono text-text-muted hover:text-rust-hot transition-colors cursor-pointer"
            >
              ABANDONAR
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-3 min-h-[44px] px-5 bg-yellow text-bg text-[11px] font-bold tracking-[.12em] uppercase font-mono rounded-xl hover:brightness-110 transition-all cursor-pointer"
            >
              {isLast ? 'VER EL EXPEDIENTE FINAL' : 'SIGUIENTE PREGUNTA'} <b>→</b>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
