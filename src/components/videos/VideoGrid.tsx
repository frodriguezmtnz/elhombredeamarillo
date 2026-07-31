import clsx from 'clsx';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { VideoData } from '@lib/types';
import { VIDEOS } from '@data/videos';
import { normalizeText, episodeScore } from '@lib/utils';
import VideoCard from './VideoCard';
import CreatorDirectory from './CreatorDirectory';
import Pagination from '../ui/Pagination';

interface Props {
  videos: VideoData[];
  initialCategory?: string;
}

type Filter = 'all' | 'analysis' | 'debate';
type Sort = 'recent' | 'episode' | 'title';
type Layout = 'grid' | 'list';
type View = 'videos' | 'creators';

const PAGE_SIZE = 12;

function searchHaystack(item: VideoData): string {
  return normalizeText(
    [
      item.title,
      item.code,
      item.label,
      item.description,
      item.category === 'analysis' ? 'análisis' : 'debate',
      ...(item.guests ?? []),
      ...(item.references ?? []).flatMap((r) => [r.label, r.title, r.description, r.creator, r.handle]),
    ].join(' '),
  );
}

function sortVideos(items: VideoData[], sort: Sort): VideoData[] {
  return [...items].sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    if (sort === 'episode') return episodeScore(b.code) - episodeScore(a.code) || b.order - a.order;
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime || b.order - a.order;
  });
}

function readStateFromUrl(): { filter: Filter; sort: Sort; layout: Layout; view: View; query: string; page: number } {
  if (typeof window === 'undefined') return { filter: 'all', sort: 'recent', layout: 'grid', view: 'videos', query: '', page: 1 };
  const params = new URLSearchParams(window.location.search);
  return {
    filter: (params.get('filter') as Filter) || 'all',
    sort: (params.get('sort') as Sort) || 'recent',
    layout: (params.get('layout') as Layout) || 'grid',
    view: (params.get('view') as View) || 'videos',
    query: params.get('q') || '',
    page: Number(params.get('page')) || 1,
  };
}

function writeStateToUrl(state: { filter: Filter; sort: Sort; layout: Layout; view: View; query: string; page: number }) {
  const params = new URLSearchParams();
  if (state.filter !== 'all') params.set('filter', state.filter);
  if (state.sort !== 'recent') params.set('sort', state.sort);
  if (state.layout !== 'list') params.set('layout', state.layout);
  if (state.view !== 'videos') params.set('view', state.view);
  if (state.query) params.set('q', state.query);
  if (state.page > 1) params.set('page', String(state.page));
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}

export default function VideoGrid({ videos, initialCategory }: Props) {
  const urlState = readStateFromUrl();
  const [filter, setFilter] = useState<Filter>(initialCategory === 'debate' ? 'debate' : urlState.filter);
  const [sort, setSort] = useState<Sort>(urlState.sort);
  const [layout, setLayout] = useState<Layout>(urlState.layout);
  const [view, setView] = useState<View>(urlState.view);
  const [query, setQuery] = useState(urlState.query);
  const [page, setPage] = useState(urlState.page);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const filtered = videos.filter((item) => {
    const catMatch = filter === 'all' || item.category === filter;
    const q = normalizeText(query);
    const queryMatch = !q || searchHaystack(item).includes(q);
    return catMatch && queryMatch;
  });

  const sorted = sortVideos(filtered, sort);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = sorted.slice(start, start + PAGE_SIZE);

  const syncUrl = useCallback(
    (overrides: Partial<{ filter: Filter; sort: Sort; layout: Layout; view: View; query: string; page: number }> = {}) => {
      writeStateToUrl({ filter, sort, layout, view, query, page: safePage, ...overrides });
    },
    [filter, sort, layout, view, query, safePage],
  );

  useEffect(() => {
    syncUrl();
  }, [filter, sort, layout, view, query, safePage, syncUrl]);

  useEffect(() => {
    const onPopState = () => {
      const s = readStateFromUrl();
      setFilter(initialCategory === 'debate' ? 'debate' : s.filter);
      setSort(s.sort);
      setLayout(s.layout);
      setView(s.view);
      setQuery(s.query);
      setPage(s.page);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [initialCategory]);

  const handleSearch = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setQuery(value.trim());
      setPage(1);
    }, 180);
  };

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    setView('videos');
    setPage(1);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 space-y-3">
        {/* Row 1: Search + Sort + Layout */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="search"
              defaultValue={query}
              onChange={(e) => handleSearch(e.currentTarget.value)}
              placeholder="Buscar por título, código o creador..."
              className="w-full min-h-[42px] px-4 pr-10 border border-border bg-surface text-text text-xs font-body rounded-lg outline-none focus:border-yellow transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/40 text-xs">🔍</span>
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.currentTarget.value as Sort); setPage(1); }}
            className="min-h-[42px] px-3 border border-border bg-surface text-text text-[10px] font-bold tracking-[.06em] uppercase font-mono rounded-lg outline-none focus:border-yellow transition-colors cursor-pointer"
          >
            <option value="recent">MÁS RECIENTES</option>
            <option value="episode">EPISODIO</option>
            <option value="title">A → Z</option>
          </select>

          {/* Layout toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setLayout('grid')}
              aria-label="Vista cuadrícula"
              className={clsx(
                'w-10 h-10 grid place-items-center transition-colors',
                layout === 'grid' ? 'bg-yellow text-bg' : 'bg-surface text-text-muted hover:text-yellow',
              )}
            >
              ⊞
            </button>
            <button
              type="button"
              onClick={() => setLayout('list')}
              aria-label="Vista lista"
              className={clsx(
                'w-10 h-10 grid place-items-center transition-colors',
                layout === 'list' ? 'bg-yellow text-bg' : 'bg-surface text-text-muted hover:text-yellow',
              )}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Row 2: Filter chips */}
        <div className="flex flex-wrap gap-2">
          {([
            { value: 'all', label: 'TODOS' },
            { value: 'analysis', label: 'ANÁLISIS' },
            { value: 'debate', label: 'DEBATE' },
          ] as const).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFilterChange(f.value)}
              className={clsx(
                'px-3 py-1.5 text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg transition-colors',
                filter === f.value
                  ? 'bg-yellow text-bg'
                  : 'border border-border text-text-muted hover:border-yellow hover:text-yellow',
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] font-bold tracking-[.12em] text-yellow uppercase font-mono self-center">
            {view === 'creators' ? `${VIDEOS.filter((v) => v.category === 'debate').length} VÍDEOS DEBATE` : `${sorted.length} RESULTADO${sorted.length === 1 ? '' : 'S'}`}
          </span>
        </div>

        {/* Row 3: View toggle (only when debate filter active) */}
        {filter === 'debate' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setView('videos'); setPage(1); }}
              className={clsx(
                'px-3 py-1.5 text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg transition-colors',
                view === 'videos'
                  ? 'bg-yellow text-bg'
                  : 'border border-border text-text-muted hover:border-yellow hover:text-yellow',
              )}
            >
              VÍDEOS
            </button>
            <button
              type="button"
              onClick={() => setView('creators')}
              className={clsx(
                'px-3 py-1.5 text-[9px] font-bold tracking-[.1em] uppercase font-mono rounded-lg transition-colors',
                view === 'creators'
                  ? 'bg-yellow text-bg'
                  : 'border border-border text-text-muted hover:border-yellow hover:text-yellow',
              )}
            >
              CREADORES
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {view === 'creators' ? (
        <CreatorDirectory layout={layout} />
      ) : visible.length === 0 ? (
        <div className="py-10 text-center text-text-muted text-sm">No se encontraron vídeos con esos criterios.</div>
      ) : (
        <div
          className={clsx(
            'gap-4',
            layout === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'flex flex-col',
          )}
        >
          {visible.map((video, i) => (
            <VideoCard key={video.id} video={video} layout={layout} index={start + i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {view === 'videos' && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalResults={sorted.length}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
}
