import type { DossierData } from '@lib/types';
import { normalizeText } from '@lib/utils';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';

type Category = 'all' | DossierData['category'];
type View = 'board' | 'timeline';

interface Props {
  dossiers: DossierData[];
  onFilterChange: (filtered: DossierData[]) => void;
  onViewChange: (view: View) => void;
  view: View;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'TODOS' },
  { value: 'origin', label: 'ORIGEN' },
  { value: 'entity', label: 'ENTIDADES' },
  { value: 'exit', label: 'SALIDA' },
  { value: 'ritual', label: 'OBJETOS' },
  { value: 'character', label: 'PERSONAJES' },
  { value: 'mechanic', label: 'REGLAS' },
];

function searchHaystack(d: DossierData): string {
  return normalizeText(
    [
      d.title,
      d.shortTitle,
      d.summary,
      d.thesis,
      d.categoryLabel,
      d.status,
      ...d.tags,
      ...d.evidence.map((e) => `${e.title} ${e.text}`),
      ...d.doubts,
    ].join(' '),
  );
}

export default function CaseFilters({ dossiers, onFilterChange, onViewChange, view }: Props) {
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const applyFilters = useCallback(
    (cat: Category, q: string) => {
      const normalized = normalizeText(q);
      const result = dossiers.filter((d) => {
        const catMatch = cat === 'all' || d.category === cat;
        const queryMatch = !normalized || searchHaystack(d).includes(normalized);
        return catMatch && queryMatch;
      });
      onFilterChange(result);
    },
    [dossiers, onFilterChange],
  );

  useEffect(() => {
    applyFilters(category, query);
  }, [category, query, applyFilters]);

  const handleSearch = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setQuery(value.trim());
    }, 150);
  };

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search + View toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="search"
            defaultValue={query}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            placeholder="Buscar por título, tesis, tags..."
            className="w-full min-h-[42px] px-4 pr-10 border border-border bg-surface text-text text-xs font-body rounded-lg outline-none focus:border-yellow transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/40 text-xs">🔍</span>
        </div>

        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => onViewChange('board')}
            aria-label="Vista muro"
            className={clsx(
              'px-3 min-h-[42px] text-[9px] font-bold tracking-[.1em] uppercase font-mono transition-colors',
              view === 'board' ? 'bg-yellow text-bg' : 'bg-surface text-text-muted hover:text-yellow',
            )}
          >
            MURO
          </button>
          <button
            type="button"
            onClick={() => onViewChange('timeline')}
            aria-label="Vista cronología"
            className={clsx(
              'px-3 min-h-[42px] text-[9px] font-bold tracking-[.1em] uppercase font-mono transition-colors',
              view === 'timeline' ? 'bg-yellow text-bg' : 'bg-surface text-text-muted hover:text-yellow',
            )}
          >
            CRONOLOGÍA
          </button>
        </div>
      </div>

      {/* Row 2: Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => handleCategoryChange(c.value)}
            className={clsx(
              'px-3 py-1.5 text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg transition-colors',
              category === c.value
                ? 'bg-yellow text-bg'
                : 'border border-border text-text-muted hover:border-yellow hover:text-yellow',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
