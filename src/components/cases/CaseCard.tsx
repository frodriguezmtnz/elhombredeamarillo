import type { DossierData, SourceData } from '@lib/types';
import { thumbnailUrl } from '@lib/youtube';
import clsx from 'clsx';

interface Props {
  dossier: DossierData;
  sources: SourceData[];
  index?: number;
  onOpen: (id: string) => void;
}

export default function CaseCard({ dossier, sources, index = 0, onOpen }: Props) {
  const firstSource = sources.find((s) => dossier.sourceIds.includes(s.id));
  const imageId = firstSource?.videoId || '63yacyj-o-A';
  const rotation = ((index % 5) - 2) * 0.3;

  return (
    <div
      className="group relative flex flex-col p-5 rounded-2xl border border-border bg-surface hover:border-yellow/30 hover:-translate-y-1 transition-all cursor-pointer"
      data-case-id={dossier.id}
      style={{ '--tw-rotate': `${rotation}deg` } as React.CSSProperties}
      onClick={() => onOpen(dossier.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(dossier.id);
        }
      }}
      aria-label={`Abrir expediente ${dossier.number}: ${dossier.title}`}
    >
      {/* Image */}
      <div className="relative mb-4 rounded-xl overflow-hidden">
        <img
          src={thumbnailUrl(imageId)}
          alt={dossier.title}
          width="480"
          height="270"
          loading="lazy"
          decoding="async"
          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = thumbnailUrl(imageId, 'mqdefault');
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-pixel text-xl text-yellow">{dossier.number}</span>
        <span className="text-[8px] font-bold tracking-[.1em] text-text-muted uppercase font-mono text-right">
          {dossier.categoryLabel}
        </span>
      </div>

      {/* Status */}
      <span
        className={clsx(
          'w-fit px-2 py-1 text-[8px] font-bold tracking-[.1em] uppercase font-mono rounded border mb-3',
          dossier.statusTone === 'core' && 'text-amber border-amber/30 bg-amber/10',
          dossier.statusTone === 'open' && 'text-text-muted border-border',
          dossier.statusTone === 'warning' && 'text-rust-hot border-rust/30 bg-rust/10',
        )}
      >
        {dossier.status}
      </span>

      {/* Content */}
      <h3 className="font-pixel text-lg uppercase leading-tight mb-2">{dossier.title}</h3>
      <p className="text-text-muted text-[11px] leading-relaxed line-clamp-3 flex-1">{dossier.summary}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-[9px] font-bold tracking-[.1em] text-text-muted/60 uppercase font-mono">
          {dossier.sourceIds.length} FUENTES
        </span>
        <span className="text-[9px] font-bold tracking-[.1em] text-yellow uppercase font-mono">ABRIR CARPETA →</span>
      </div>
    </div>
  );
}
