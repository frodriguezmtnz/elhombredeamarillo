import type { MysteryData } from '@lib/types';
import clsx from 'clsx';
import VoteButton from './VoteButton';

interface Props {
  mystery: MysteryData | null;
}

export default function MysteryDetail({ mystery }: Props) {
  if (!mystery) {
    return (
      <div className="p-6 rounded-xl border border-border bg-surface text-center">
        <p className="text-text-muted text-sm">Selecciona un misterio para ver su detalle.</p>
      </div>
    );
  }

  const sorted = [...mystery.hypotheses].sort((a, b) => b.votes - a.votes);
  const maxVotes = sorted[0]?.votes ?? 1;

  return (
    <div className="p-5 rounded-xl border border-border bg-surface space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-pixel text-xl text-yellow">{mystery.code}</span>
          <span className="text-[8px] font-bold tracking-[.1em] text-text-muted uppercase font-mono">
            {mystery.category}
          </span>
        </div>
        <h3 className="font-pixel text-lg uppercase leading-tight mb-2">{mystery.title}</h3>
        <p className="text-text-muted text-xs leading-relaxed">{mystery.context}</p>
        <div className="flex items-center gap-4 mt-3 text-[9px] font-bold tracking-[.1em] text-text-muted/60 uppercase font-mono">
          <span>{mystery.contributors}</span>
          <span>{mystery.mentions} menciones</span>
        </div>
      </div>

      {/* Hypotheses */}
      <div>
        <h4 className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-3">
          HIPÓTESIS ({mystery.hypotheses.length})
        </h4>
        <div className="space-y-3">
          {sorted.map((hyp, i) => {
            const pct = Math.round((hyp.votes / maxVotes) * 100);
            return (
              <div key={hyp.id} className="p-3 rounded-lg border border-border bg-bg">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={clsx(
                      'px-2 py-0.5 text-[8px] font-bold tracking-[.1em] uppercase font-mono rounded',
                      i === 0 ? 'bg-yellow text-bg' : 'bg-surface text-text-muted border border-border',
                    )}
                  >
                    #{i + 1}
                  </span>
                  <VoteButton hypothesisId={hyp.id} initialVotes={hyp.votes} />
                </div>
                <h5 className="text-text text-xs font-bold mb-1">{hyp.title}</h5>
                <p className="text-text-muted text-[10px] leading-relaxed mb-2">{hyp.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-text-muted/50 font-mono">{hyp.author}</span>
                  <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-yellow rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        disabled
        className="w-full py-3 border border-border text-text-muted/40 text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg cursor-not-allowed"
      >
        + PROPONER EXPLICACIÓN (próximamente)
      </button>
    </div>
  );
}
