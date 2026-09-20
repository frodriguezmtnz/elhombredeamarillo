import clsx from 'clsx';
import { useEffect, useState } from 'react';

interface Props {
  modeLabel: string;
  alias: string;
  onDone: () => void;
}

const INTRO_MS = 10000;
const COUNT_MS = 1000;
const COUNTDOWN_MS = 5 * COUNT_MS;
const GO_MS = 700;
const BELL_FADE_MS = 1200;
const SKIP_FADE_MS = 250;
const BELL_SRC = '/assets/audio/campana-boyd-trivial-v2.mp3';

/**
 * Cuenta atrás de toque de queda: la campana de Boyd suena y el pueblo
 * se encierra. 5·4·3·2·1 → ¡A JUGAR! Clic o tecla para saltar.
 */
export default function TriviaCountdown({ modeLabel, alias, onDone }: Props) {
  // step: 'intro' → 5..1 → 'go'
  const [step, setStep] = useState<'intro' | 'go' | number>('intro');

  // Campana de Boyd en bucle durante el intro Y la cuenta atrás, con fundido a
  // silencio al final (justo cuando sale «¡A JUGAR!»). El clic en el modo que
  // abrió esta pantalla actúa como gesto de usuario para el autoplay.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bell = new Audio(BELL_SRC);
    bell.loop = true;
    bell.volume = 0.7;
    bell.play().catch(() => {
      // Autoplay bloqueado o archivo no disponible: se juega igual sin sonido
    });

    let fadeId: number | null = null;
    const fadeTo = (duration: number) => {
      if (fadeId !== null) return;
      const startVolume = bell.volume;
      const startedAt = performance.now();
      fadeId = window.setInterval(() => {
        const t = Math.min(1, (performance.now() - startedAt) / duration);
        bell.volume = Math.max(0, startVolume * (1 - t));
        if (t >= 1 && fadeId !== null) {
          window.clearInterval(fadeId);
          fadeId = null;
          bell.pause();
        }
      }, 50);
    };

    // La campana suena durante todo el intro + los 5 segundos de cuenta atrás
    const fadeTimer = window.setTimeout(
      () => fadeTo(BELL_FADE_MS),
      Math.max(0, INTRO_MS + COUNTDOWN_MS - BELL_FADE_MS),
    );

    return () => {
      window.clearTimeout(fadeTimer);
      if (fadeId !== null) {
        window.clearInterval(fadeId);
        fadeId = null;
      }
      // Al saltar la cuenta, fundido corto en vez de corte seco
      if (!bell.paused) fadeTo(SKIP_FADE_MS);
      else bell.currentTime = 0;
    };
  }, []);

  // La cuenta atrás se puede saltar con clic o teclado (Enter / Espacio / Esc)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        onDone();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

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
      className="fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center bg-bg"
    >
      <p className="text-[10px] font-bold tracking-[.18em] text-yellow/80 uppercase font-mono">
        MODO {modeLabel.toUpperCase()} · JUGANDO COMO «{alias || 'Anónimo'}»
      </p>

      <div className="mt-8 flex flex-col items-center gap-4">
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

        {step === 'intro' ? (
          <p className="font-pixel text-[clamp(1.6rem,4vw,2.6rem)] uppercase text-text">La campana de Boyd suena...</p>
        ) : step === 'go' ? (
          <p className="mt-2 font-pixel text-[clamp(3.5rem,12vw,9rem)] uppercase text-yellow-bright drop-shadow-[0_0_30px_rgba(244,201,67,0.5)]">
            ¡A JUGAR!
          </p>
        ) : (
          <p
            key={step}
            className={clsx(
              'mt-2 font-pixel text-[clamp(5rem,16vw,12rem)] leading-none',
              step <= 2 ? 'text-rust-hot' : 'text-yellow',
            )}
          >
            {step}
          </p>
        )}
      </div>

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
