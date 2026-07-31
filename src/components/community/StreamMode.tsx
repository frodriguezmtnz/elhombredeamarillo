import type { MysteryData } from '@lib/types';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  mysteries: MysteryData[];
  isOpen: boolean;
  onClose: () => void;
}

export default function StreamMode({ mysteries, isOpen, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = mysteries[index];
  const total = mysteries.length;

  const goNext = useCallback(() => {
    if (index < total - 1) {
      setIndex((i) => i + 1);
      setRevealed(false);
    }
  }, [index, total]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setRevealed(false);
    }
  }, [index]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setIndex(0);
      setRevealed(false);
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setRevealed((r) => !r);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, goNext, goPrev, onClose]);

  if (!current) return null;

  const sorted = [...current.hypotheses].sort((a, b) => b.votes - a.votes);
  const top3 = sorted.slice(0, 3);
  const totalVotes = current.hypotheses.reduce((s, h) => s + h.votes, 0);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[60] w-full h-full max-w-none mx-0 my-0 bg-bg border-0 rounded-0 shadow-none overflow-hidden backdrop:bg-black"
      aria-label="Modo Stream"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-10">
        <span className="font-pixel text-lg text-yellow">{current.code}</span>
        <span className="text-[10px] font-bold tracking-[.12em] text-text-muted uppercase font-mono">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 grid place-items-center text-text-muted hover:text-yellow transition-colors"
          aria-label="Cerrar modo stream"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <h2 className="font-pixel text-[clamp(1.5rem,5vw,3rem)] uppercase leading-tight mb-6 max-w-[80ch]">
          {current.title}
        </h2>
        <p className="text-text-muted text-sm leading-relaxed max-w-[60ch] mb-8">{current.context}</p>

        {/* Top 3 hypotheses */}
        <div className="w-full max-w-lg space-y-3 mb-8">
          {top3.map((hyp, i) => {
            const pct = totalVotes > 0 ? Math.round((hyp.votes / totalVotes) * 100) : 0;
            return (
              <div key={hyp.id} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-surface/80">
                <span
                  className={clsx(
                    'font-pixel text-xl w-8 text-center flex-shrink-0',
                    i === 0 ? 'text-yellow' : 'text-text-muted/40',
                  )}
                >
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-text text-xs font-bold truncate">{hyp.title}</h4>
                  <p className="text-text-muted text-[10px] mt-0.5">{hyp.author}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[9px] font-bold font-mono text-yellow">{hyp.votes} VOTOS</span>
                  {revealed && <span className="text-[9px] font-bold font-mono text-text-muted">{pct}%</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="px-4 py-2 border border-border text-text-muted text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:border-yellow hover:text-yellow disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← ANTERIOR
          </button>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="px-5 py-2 border border-yellow bg-yellow/10 text-yellow text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:bg-yellow hover:text-bg transition-colors"
          >
            {revealed ? 'OCULTAR RESULTADOS' : 'REVELAR RESULTADOS'}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index === total - 1}
            className="px-4 py-2 border border-border text-text-muted text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:border-yellow hover:text-yellow disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            SIGUIENTE →
          </button>
        </div>
      </div>
    </dialog>
  );
}
