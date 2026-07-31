import clsx from 'clsx';

interface Props {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, totalResults, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const visiblePages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  let previous = 0;
  const pages = [...visiblePages]
    .filter((v) => v >= 1 && v <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<{ type: 'page' | 'ellipsis'; value?: number }> = [];
  for (const p of pages) {
    if (p - previous > 1) items.push({ type: 'ellipsis' });
    items.push({ type: 'page', value: p });
    previous = p;
  }

  return (
    <div className="mt-6 p-4 border border-border bg-bg text-center">
      <div className="flex justify-center items-center flex-wrap gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="min-w-[108px] min-h-[36px] px-3 border border-border-light text-text-muted bg-surface text-[9px] font-bold tracking-[.1em] uppercase font-mono hover:border-yellow hover:text-yellow disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        >
          ← ANTERIOR
        </button>

        {items.map((item, i) =>
          item.type === 'ellipsis' ? (
            <span key={`e${i}`} className="text-text-muted/40 text-xs">
              …
            </span>
          ) : (
            <button
              key={item.value}
              type="button"
              onClick={() => onPageChange(item.value!)}
              aria-current={item.value === currentPage ? 'page' : undefined}
              className={clsx(
                'min-w-[38px] min-h-[36px] px-2.5 border text-[9px] font-bold font-mono transition-colors',
                item.value === currentPage
                  ? 'border-yellow bg-yellow text-bg'
                  : 'border-border-light text-text-muted bg-surface hover:border-yellow hover:text-yellow',
              )}
            >
              {item.value}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="min-w-[108px] min-h-[36px] px-3 border border-border-light text-text-muted bg-surface text-[9px] font-bold tracking-[.1em] uppercase font-mono hover:border-yellow hover:text-yellow disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        >
          SIGUIENTE →
        </button>
      </div>

      <p className="mt-3 text-[9px] text-text-muted/60 font-mono">
        Página {currentPage} de {totalPages} · {totalResults} vídeo{totalResults === 1 ? '' : 's'}
      </p>
    </div>
  );
}
