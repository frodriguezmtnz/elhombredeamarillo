import type { MysteryData } from '@lib/types';
import clsx from 'clsx';
import { useState } from 'react';

interface Props {
  mysteries: MysteryData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const PAGE_SIZE = 6;

export default function MysteryList({ mysteries, selectedId, onSelect }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(mysteries.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = mysteries.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className="space-y-3">
        {visible.map((mystery) => {
          const totalVotes = mystery.hypotheses.reduce((s, h) => s + h.votes, 0);
          const isSelected = mystery.id === selectedId;

          return (
            <button
              key={mystery.id}
              type="button"
              onClick={() => onSelect(mystery.id)}
              className={clsx(
                'w-full text-left p-4 rounded-xl border transition-all',
                isSelected ? 'border-yellow bg-yellow/5' : 'border-border bg-surface hover:border-yellow/30',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-pixel text-lg text-yellow">{mystery.code}</span>
                <span className="text-[8px] font-bold tracking-[.1em] text-text-muted uppercase font-mono">
                  {mystery.category}
                </span>
              </div>
              <h3 className="font-pixel text-sm uppercase leading-tight mb-2">{mystery.title}</h3>
              <div className="flex items-center gap-4 text-[9px] font-bold tracking-[.1em] text-text-muted/60 uppercase font-mono">
                <span>{mystery.mentions} MENCIONES</span>
                <span>{mystery.hypotheses.length} HIPÓTESIS</span>
                <span>{totalVotes} VOTOS</span>
              </div>
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
            className="min-h-[32px] px-3 border border-border text-text-muted bg-surface text-[9px] font-bold tracking-[.1em] uppercase font-mono hover:border-yellow hover:text-yellow disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>
          <span className="text-[9px] font-bold text-text-muted/60 font-mono">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage(safePage + 1)}
            className="min-h-[32px] px-3 border border-border text-text-muted bg-surface text-[9px] font-bold tracking-[.1em] uppercase font-mono hover:border-yellow hover:text-yellow disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
