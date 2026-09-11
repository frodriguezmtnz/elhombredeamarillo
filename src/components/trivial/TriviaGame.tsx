import { TRIVIA_CATEGORY_LABELS } from '@data/trivial';
import type { TriviaAnswerRecord, TriviaQuestion } from '@lib/types';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';

export const TIME_LIMIT_SECONDS = 20;

export interface TriviaSummary {
  modeLabel: string;
  records: TriviaAnswerRecord[];
  correct: number;
  total: number;
  score: number;
  bestStreak: number;
}

interface Props {
  deck: TriviaQuestion[];
  modeLabel: string;
  onFinish: (summary: TriviaSummary) => void;
  onQuit: () => void;
}

function computePoints(difficulty: number, timeLeft: number, streakAfter: number): number {
  const base = difficulty * 100;
  const speed = Math.round(Math.max(0, timeLeft) * 5);
  const streakBonus = Math.min(streakAfter, 5) * 20;
  return base + speed + streakBonus;
}

export default function TriviaGame({ deck, modeLabel, onFinish, onQuit }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [records, setRecords] = useState<TriviaAnswerRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const timeRef = useRef(TIME_LIMIT_SECONDS);
  const lockRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const question = deck[index];
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
      const points = correct ? computePoints(question.difficulty, left, nextStreak) : 0;

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
    [question, streak],
  );

  // Temporizador por pregunta. El `lockRef` hace que, una vez respondida,
  // el efecto se re-ejecute sin reiniciar la cuenta (el tiempo queda congelado
  // en el momento de la respuesta hasta pulsar «siguiente»).
  // biome-ignore lint/correctness/useExhaustiveDependencies: se relanza solo por pregunta (index); answer se recrea al responder pero lockRef corta el reinicio
  useEffect(() => {
    if (lockRef.current) return;
    timeRef.current = TIME_LIMIT_SECONDS;
    setTimeLeft(TIME_LIMIT_SECONDS);

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
  }, [index, answer]);

  function next() {
    lockRef.current = false;
    if (index + 1 >= deck.length) {
      const correct = records.filter((r) => r.correct).length;
      onFinish({
        modeLabel,
        records,
        correct,
        total: deck.length,
        score,
        bestStreak,
      });
    } else {
      setSelected(null);
      setTimedOut(false);
      setIndex((i) => i + 1);
    }
  }

  const progress = timeLeft / TIME_LIMIT_SECONDS;
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
          {question.season > 0 && (
            <span className="px-2 py-1 rounded bg-rust/10 border border-rust/30 text-[9px] font-bold tracking-[.1em] text-rust-hot uppercase font-mono">
              T{question.season} · spoilers
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
      <div
        className="mt-4 h-1 rounded-full bg-border overflow-hidden"
        role="timer"
        aria-label={`Tiempo restante: ${Math.ceil(timeLeft)} segundos`}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-[width] duration-100',
            progress > 0.5 ? 'bg-yellow' : progress > 0.25 ? 'bg-amber-hot' : 'bg-rust-hot',
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="mt-1 text-right text-[9px] font-bold tracking-[.1em] text-text-muted/60 font-mono">
        {Math.ceil(timeLeft)}s
      </div>

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
          <p className="mt-2 text-sm text-text leading-relaxed">{question.explanation}</p>
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
