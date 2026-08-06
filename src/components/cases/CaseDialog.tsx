import type { DossierData, SourceData } from '@lib/types';
import { youtubeUrl } from '@lib/youtube';
import clsx from 'clsx';
import { useCallback, useEffect, useRef } from 'react';

interface Props {
  dossier: DossierData | null;
  sources: SourceData[];
  allDossiers: DossierData[];
  onClose: () => void;
}

export default function CaseDialog({ dossier, sources, allDossiers, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = useCallback(() => {
    dialogRef.current?.close();
    onClose();
    window.history.replaceState(null, '', window.location.pathname);
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (dossier && !dialog.open) {
      dialog.showModal();
      window.history.replaceState(null, '', `#${dossier.id}`);
    } else if (!dossier && dialog.open) {
      dialog.close();
    }
  }, [dossier]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialog.open) {
        close();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    dialog.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      dialog.removeEventListener('click', handleClick);
    };
  }, [close]);

  useEffect(() => {
    if (dossier && dialogRef.current) {
      dialogRef.current.scrollTop = 0;
    }
  }, [dossier]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const found = allDossiers.find((d) => d.id === hash);
      if (found) {
        window.dispatchEvent(new CustomEvent('open-case', { detail: { id: hash } }));
      }
    }
  }, [allDossiers]);

  if (!dossier) return null;

  const relatedDossiers = dossier.related
    .map((id) => allDossiers.find((d) => d.id === id))
    .filter(Boolean) as DossierData[];

  const linkedSources = sources.filter((s) => dossier.sourceIds.includes(s.id));

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 w-full max-w-3xl mx-auto my-auto bg-bg border border-border rounded-2xl shadow-2xl overflow-hidden backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      aria-labelledby="dialog-title"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 justify-between p-3 sm:p-5 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-2xl text-yellow">{dossier.number}</span>
          <span
            className={clsx(
              'px-2 py-1 text-[8px] font-bold tracking-[.1em] uppercase font-mono rounded border',
              dossier.statusTone === 'core' && 'text-amber border-amber/30 bg-amber/10',
              dossier.statusTone === 'open' && 'text-text-muted border-border',
              dossier.statusTone === 'warning' && 'text-rust-hot border-rust/30 bg-rust/10',
            )}
          >
            {dossier.status}
          </span>
          <span className="text-[8px] font-bold tracking-[.1em] text-text-muted uppercase font-mono">
            {dossier.categoryLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={close}
          className="w-8 h-8 grid place-items-center text-text-muted hover:text-yellow transition-colors"
          aria-label="Cerrar expediente"
        >
          ✕
        </button>
      </header>

      {/* Content */}
      <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Title + Summary */}
        <div>
          <h2 id="dialog-title" className="font-pixel text-xl uppercase leading-tight mb-3">
            {dossier.title}
          </h2>
          <p className="text-text-muted text-sm leading-relaxed">{dossier.summary}</p>
        </div>

        {/* Thesis */}
        <section>
          <h3 className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-3">
            TESIS CENTRAL
          </h3>
          <p className="text-text text-sm leading-relaxed bg-surface p-4 rounded-xl border border-border">
            {dossier.thesis}
          </p>
        </section>

        {/* Evidence */}
        <section>
          <h3 className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-3">
            PRUEBAS Y CONEXIONES
          </h3>
          <div className="space-y-3">
            {dossier.evidence.map((ev, i) => (
              <div key={ev.title} className="flex gap-3 p-3 bg-surface rounded-xl border border-border">
                <span className="font-pixel text-lg text-yellow/40 flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4 className="text-[9px] font-bold tracking-[.1em] text-yellow uppercase font-mono mb-1">
                    {ev.title}
                  </h4>
                  <p className="text-text-muted text-xs leading-relaxed">{ev.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Doubts */}
        <section>
          <h3 className="text-[10px] font-bold tracking-[.14em] text-rust-hot/80 uppercase font-mono mb-3">
            DUDAS Y LÍMITES
          </h3>
          <ul className="space-y-2">
            {dossier.doubts.map((doubt) => (
              <li key={doubt} className="flex gap-2 text-text-muted text-xs leading-relaxed">
                <span className="text-rust-hot/60 flex-shrink-0">▸</span>
                {doubt}
              </li>
            ))}
          </ul>
        </section>

        {/* Sources / Evolution */}
        {linkedSources.length > 0 && (
          <section>
            <h3 className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-3">
              EVOLUCIÓN EN VÍDEOS
            </h3>
            <div className="space-y-2">
              {linkedSources.map((src) => (
                <div key={src.id} className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border">
                  <span className="text-[8px] font-bold tracking-[.1em] text-yellow/60 uppercase font-mono flex-shrink-0 mt-0.5">
                    {src.phase}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-xs leading-relaxed">{src.title}</p>
                    <p className="text-text-muted text-[10px] mt-1">{src.summary}</p>
                  </div>
                  {src.videoId && (
                    <a
                      href={youtubeUrl(src.videoId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 px-2 py-1 text-[8px] font-bold tracking-[.1em] text-yellow border border-yellow/30 rounded hover:bg-yellow hover:text-bg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ▶ YOUTUBE
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related dossiers */}
        {relatedDossiers.length > 0 && (
          <section>
            <h3 className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-3">
              EXPEDIENTES RELACIONADOS
            </h3>
            <div className="flex flex-wrap gap-2">
              {relatedDossiers.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-case', { detail: { id: rel.id } }));
                    }, 100);
                  }}
                  className="px-3 py-1.5 text-[9px] font-bold tracking-[.1em] uppercase font-mono border border-border text-text-muted rounded-lg hover:border-yellow hover:text-yellow transition-colors"
                >
                  {rel.number} {rel.shortTitle}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        <section>
          <h3 className="text-[10px] font-bold tracking-[.14em] text-yellow/80 uppercase font-mono mb-3">ETIQUETAS</h3>
          <div className="flex flex-wrap gap-1.5">
            {dossier.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-[8px] font-bold tracking-[.08em] uppercase font-mono text-text-muted/60 border border-border rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 flex items-center justify-between p-4 border-t border-border bg-bg/95 backdrop-blur-sm">
        <span className="text-[9px] font-bold tracking-[.1em] text-text-muted/60 uppercase font-mono">
          {linkedSources.length} FUENTES · {dossier.related.length} CONEXIONES
        </span>
        <button
          type="button"
          onClick={close}
          className="px-4 py-2 text-[9px] font-bold tracking-[.1em] uppercase font-mono border border-border text-text-muted rounded-lg hover:border-yellow hover:text-yellow transition-colors"
        >
          CERRAR EXPEDIENTE
        </button>
      </footer>
    </dialog>
  );
}
