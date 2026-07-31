import clsx from 'clsx';
import { VIDEOS, CREATORS } from '@data/videos';

interface CreatorEntry {
  slug: string;
  name: string;
  handle: string;
  url: string;
  image: string;
  appearances: number;
  featured?: boolean;
}

function getCreatorDirectory(): CreatorEntry[] {
  const counts = new Map<string, number>();

  VIDEOS.filter((v) => v.category === 'debate').forEach((v) => {
    (v.guests ?? []).forEach((slug) => {
      if (slug !== 'host') counts.set(slug, (counts.get(slug) ?? 0) + 1);
    });
  });

  return Object.entries(CREATORS)
    .filter(([slug]) => slug !== 'host' && counts.has(slug))
    .map(([slug, creator]) => ({
      slug,
      ...creator,
      appearances: counts.get(slug) ?? 0,
    }))
    .sort(
      (a, b) =>
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        b.appearances - a.appearances ||
        a.name.localeCompare(b.name, 'es'),
    );
}

interface Props {
  layout?: 'grid' | 'list';
}

export default function CreatorDirectory({ layout = 'grid' }: Props) {
  const creators = getCreatorDirectory();

  if (creators.length === 0) return null;

  return (
    <div className={clsx(
      'gap-4',
      layout === 'grid'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'flex flex-col',
    )}>
      {creators.map((creator) => (
        <a
          key={creator.slug}
          href={creator.url}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'group relative flex items-center gap-4 p-4 min-h-[160px]',
            'border border-border-light bg-surface rounded-xl',
            'no-underline transition-all hover:-translate-y-0.5 hover:border-yellow',
          )}
        >
          {/* Avatar */}
          <img
            src={creator.image}
            alt={creator.name}
            width="128"
            height="128"
            loading="lazy"
            decoding="async"
            className="w-[104px] h-[104px] object-cover rounded-full border border-border-light bg-surface-raised flex-shrink-0"
          />

          {/* Info */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-[9px] font-bold tracking-[.11em] text-yellow uppercase font-mono">
              CREADOR INVITADO
            </span>
            <strong className="font-pixel text-lg leading-tight text-text">
              {creator.name}
            </strong>
            <span className="text-[10px] text-text-muted/60 font-mono">
              {creator.appearances} PARTICIPACIÓN{creator.appearances === 1 ? '' : 'ES'}
            </span>
          </div>

          {/* Featured badge */}
          {creator.featured && (
            <span className="absolute top-2.5 right-2.5 px-1.5 py-1 bg-yellow text-bg text-[8px] font-bold tracking-[.09em] uppercase font-mono">
              DESTACADO
            </span>
          )}

          {/* Channel link */}
          <span className="absolute right-3 bottom-2.5 text-[8px] font-bold tracking-[.09em] text-text-muted/40 uppercase font-mono group-hover:text-yellow transition-colors">
            ABRIR CANAL ↗
          </span>
        </a>
      ))}
    </div>
  );
}
