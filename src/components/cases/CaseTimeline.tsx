import type { DossierData, SourceData } from '@lib/types';
import { thumbnailUrl, youtubeUrl } from '@lib/youtube';

interface Props {
  dossiers: DossierData[];
  sources: SourceData[];
  onOpenCase: (id: string) => void;
}

export default function CaseTimeline({ dossiers, sources, onOpenCase }: Props) {
  const sorted = [...sources].sort((a, b) => a.order - b.order);

  return (
    <div className="relative pl-8 space-y-6">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

      {sorted.map((source, i) => {
        const linkedDossiers = source.dossiers
          .map((id) => dossiers.find((d) => d.id === id))
          .filter(Boolean) as DossierData[];

        return (
          <article key={source.id} className="relative">
            {/* Number dot */}
            <div className="absolute -left-5 top-5 w-6 h-6 rounded-full border-2 border-yellow bg-bg grid place-items-center z-10">
              <span className="font-pixel text-[10px] text-yellow">{i + 1}</span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface hover:border-yellow/30 transition-colors">
              {/* Phase + Code badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[8px] font-bold tracking-[.1em] text-yellow/60 uppercase font-mono">
                  {source.phase}
                </span>
                <span className="text-[8px] font-bold tracking-[.1em] text-text-muted uppercase font-mono">
                  {source.code}
                </span>
                <span className="text-[8px] font-bold tracking-[.1em] text-text-muted/40 uppercase font-mono">
                  {source.kind}
                </span>
              </div>

              {/* Title + Thumbnail row */}
              <div className="flex gap-3">
                {source.videoId && (
                  <a
                    href={youtubeUrl(source.videoId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 hidden sm:block w-24 rounded-lg overflow-hidden group/img"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={thumbnailUrl(source.videoId)}
                      alt={source.title}
                      width="96"
                      height="54"
                      loading="lazy"
                      className="w-full aspect-video object-cover group-hover/img:scale-105 transition-transform"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = thumbnailUrl(source.videoId!, 'mqdefault');
                      }}
                    />
                  </a>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-pixel text-sm uppercase leading-tight">{source.title}</h3>
                  <p className="text-text-muted text-[11px] leading-relaxed mt-1 line-clamp-2">{source.summary}</p>
                </div>
              </div>

              {/* Linked dossiers */}
              {linkedDossiers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                  <span className="text-[8px] font-bold tracking-[.1em] text-text-muted/40 uppercase font-mono self-center mr-1">
                    EXPEDIENTES:
                  </span>
                  {linkedDossiers.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCase(d.id);
                      }}
                      className="px-2 py-1 text-[8px] font-bold tracking-[.1em] uppercase font-mono border border-border text-text-muted rounded hover:border-yellow hover:text-yellow transition-colors"
                    >
                      {d.number} {d.shortTitle}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
