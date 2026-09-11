import clsx from 'clsx';
import { useEffect, useState } from 'react';

interface Props {
  modeLabel: string;
  alias: string;
  onDone: () => void;
}

const INTRO_MS = 900;
const COUNT_MS = 600;
const GO_MS = 700;

/**
 * Cuenta atrás de toque de queda: la campana de Boyd suena y el pueblo
 * se encierra. 5·4·3·2·1 → ¡A JUGAR! Clic o tecla para saltar.
 */
export default function TriviaCountdown({ modeLabel, alias, onDone }: Props) {
  // step: 'intro' → 5..1 → 'go'
  const [step, setStep] = useState<'intro' | 'go' | number>('intro');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const fast = window.setTimeout(onDone, 300);
      return () => window.clearTimeout(fast);
    }

    const timers: number[] = [];
    let delay = INTRO_MS;
    for (let n = 5; n >= 1; n--) {
      timers.push(window.setTimeout(() => setStep(n), delay));
      delay += COUNT_MS;
    }
    timers.push(window.setTimeout(() => setStep('go'), delay));
    timers.push(window.setTimeout(onDone, delay + GO_MS));

    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [onDone]);

  return (
    <div
      onClick={onDone}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onDone();
      }}
      className="fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center bg-bg/92 backdrop-blur-md"
    >
      <p className="text-[10px] font-bold tracking-[.18em] text-yellow/80 uppercase font-mono">
        MODO {modeLabel.toUpperCase()} · JUGANDO COMO «{alias || 'Anónimo'}»
      </p>

      {step === 'intro' ? (
        <div className="mt-8 flex flex-col items-center gap-5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-16 w-16 text-yellow animate-[swing_0.9s_ease-in-out_infinite]"
            aria-hidden="true"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <p className="font-pixel text-[clamp(1.6rem,4vw,2.6rem)] uppercase text-text">La campana de Boyd suena...</p>
        </div>
      ) : step === 'go' ? (
        <p className="mt-6 font-pixel text-[clamp(3.5rem,12vw,9rem)] uppercase text-yellow-bright drop-shadow-[0_0_30px_rgba(244,201,67,0.5)]">
          ¡A JUGAR!
        </p>
      ) : (
        <p
          key={step}
          className={clsx(
            'mt-6 font-pixel text-[clamp(5rem,16vw,12rem)] leading-none',
            step <= 2 ? 'text-rust-hot' : 'text-yellow',
          )}
        >
          {step}
        </p>
      )}

      <p className="mt-10 text-[9px] font-bold tracking-[.14em] text-text-muted/50 uppercase font-mono">
        clic en cualquier parte para saltar la campana
      </p>

      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
      `}</style>
    </div>
  );
}
