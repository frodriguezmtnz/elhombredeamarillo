import type { MysteryData } from '@lib/types';
import { normalizeText } from '@lib/utils';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';

type Category = 'all' | MysteryData['category'];
type Sort = 'mentions' | 'votes' | 'recent';

interface Props {
  mysteries: MysteryData[];
  onFilterChange: (filtered: MysteryData[]) => void;
  onOpenStream: () => void;
  myVotesActive: boolean;
  onMyVotesToggle: () => void;
  votedHypIds: Set<string>;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'TODOS' },
  { value: 'entity', label: 'ENTIDADES' },
  { value: 'origin', label: 'ORIGEN' },
  { value: 'character', label: 'PERSONAJES' },
  { value: 'mechanic', label: 'REGLAS' },
];

function searchHaystack(m: MysteryData): string {
  return normalizeText(
    [m.title, m.shortTitle, m.context, m.category, ...m.hypotheses.map((h) => `${h.title} ${h.description}`)].join(' '),
  );
}

function sortMysteries(items: MysteryData[], sort: Sort): MysteryData[] {
  return [...items].sort((a, b) => {
    if (sort === 'mentions') return b.mentions - a.mentions;
    if (sort === 'votes') {
      const aVotes = a.hypotheses.reduce((s, h) => s + h.votes, 0);
      const bVotes = b.hypotheses.reduce((s, h) => s + h.votes, 0);
      return bVotes - aVotes;
    }
    return b.mentions - a.mentions;
  });
}

export default function MysteryToolbar({
  mysteries,
  onFilterChange,
  onOpenStream,
  myVotesActive,
  onMyVotesToggle,
  votedHypIds,
}: Props) {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category>('all');
  const [sort, setSort] = useState<Sort>('mentions');
  const [query, setQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const applyFilters = useCallback(
    (cat: Category, q: string, s: Sort, myVotes: boolean, votedIds: Set<string>) => {
      const normalized = normalizeText(q);
      const result = mysteries.filter((m) => {
        const catMatch = cat === 'all' || m.category === cat;
        const queryMatch = !normalized || searchHaystack(m).includes(normalized);
        const votesMatch = !myVotes || m.hypotheses.some((h) => votedIds.has(h.id));
        return catMatch && queryMatch && votesMatch;
      });
      onFilterChange(sortMysteries(result, s));
    },
    [mysteries, onFilterChange],
  );

  useEffect(() => {
    applyFilters(category, query, sort, myVotesActive, votedHypIds);
  }, [category, query, sort, myVotesActive, votedHypIds, applyFilters]);

  const handleSearch = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setQuery(value.trim());
    }, 150);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="search"
            onChange={(e) => handleSearch(e.currentTarget.value)}
            placeholder="Buscar misterio, hipótesis..."
            className="w-full min-h-[42px] px-4 pr-10 border border-border bg-surface text-text text-xs font-body rounded-lg outline-none focus:border-yellow transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/40 text-xs">🔍</span>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.currentTarget.value as Sort)}
          className="min-h-[42px] px-3 border border-border bg-surface text-text text-[10px] font-bold tracking-[.06em] uppercase font-mono rounded-lg outline-none focus:border-yellow transition-colors cursor-pointer"
        >
          <option value="mentions">MÁS PARTICIPACIÓN</option>
          <option value="votes">MÁS VOTADOS</option>
          <option value="recent">MÁS RECIENTES</option>
        </select>

        {user && (
          <button
            type="button"
            onClick={onMyVotesToggle}
            className={clsx(
              'min-h-[42px] px-4 text-[10px] font-bold tracking-[.1em] uppercase font-mono rounded-lg transition-colors',
              myVotesActive
                ? 'bg-yellow text-bg border border-yellow'
                : 'border border-border text-text-muted hover:border-yellow hover:text-yellow',
            )}
          >
            ★ MIS VOTOS
          </button>
        )}

        <button
          type="button"
          onClick={onOpenStream}
          className="min-h-[42px] px-4 border border-yellow/30 bg-yellow/10 text-yellow text-[10px] font-bold tracking-[.1em] uppercase font-mono rounded-lg hover:bg-yellow hover:text-bg transition-colors"
        >
          ▶ MODO STREAM
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
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
