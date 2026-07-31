import clsx from 'clsx';
import { thumbnailUrl, youtubeUrl } from '@lib/youtube';
import { relativeTime } from '@lib/utils';
import { CREATORS } from '@data/videos';
import type { VideoData } from '@lib/types';

interface Props {
  video: VideoData;
  layout?: 'grid' | 'list';
  index?: number;
}

export default function VideoCard({ video, layout = 'grid', index = 0 }: Props) {
  const url = youtubeUrl(video.videoId);
  const time = relativeTime(video.publishedAt ?? null);
  const isWide = layout === 'grid' && (index === 0 || index === 5);
  const description =
    video.description ||
    (video.category === 'debate'
      ? 'Debate y puesta en común de las teorías que deja el episodio.'
      : 'Análisis, explicación y teorías del canal sobre este capítulo de FROM.');

  const guests = (video.guests ?? [])
    .filter((slug) => slug !== 'host')
    .map((slug) => ({ slug, ...CREATORS[slug] }))
    .filter((c) => c.name);

  const categoryLabel = video.category === 'analysis' ? 'ANÁLISIS' : 'DEBATE';

  return (
    <article
      className={clsx(
        'group rounded-xl border border-border bg-surface overflow-hidden transition-all hover:border-yellow/30',
        layout === 'list' && 'flex',
        isWide && 'sm:col-span-2',
      )}
      data-category={video.category}
    >
      {/* Thumbnail */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir ${video.title} en YouTube`}
        className={clsx(
          'relative block overflow-hidden',
          layout === 'list' && 'w-48 flex-shrink-0',
        )}
      >
        <img
          src={thumbnailUrl(video.videoId, 'maxresdefault')}
          alt={`Miniatura de ${video.title}`}
          width="1280"
          height="720"
          loading="lazy"
          decoding="async"
          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = thumbnailUrl(video.videoId, 'hqdefault');
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="w-12 h-10 grid place-items-center border border-yellow rounded-lg bg-yellow text-bg text-base">
            ▶
          </span>
        </span>
      </a>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-3.5">
        {/* Meta */}
        <div className="flex items-center justify-between gap-3 text-[9px] tracking-[.1em] text-text-muted/60 uppercase font-mono">
          <span className="text-yellow font-bold">{categoryLabel}</span>
          <span>{video.code || 'YOUTUBE'}</span>
        </div>

        {/* Title */}
        <h3 className="font-pixel text-sm uppercase leading-tight min-h-[2.6em]">
          <a href={url} target="_blank" rel="noopener noreferrer" className="no-underline hover:text-yellow-bright transition-colors">
            {video.title}
          </a>
        </h3>

        {/* Description */}
        <p className="text-text-muted text-[11px] leading-relaxed line-clamp-2">{description}</p>

        {/* References badge */}
        {video.references && video.references.length > 0 && (
          <span className="w-fit px-2 py-1.5 border border-yellow/30 bg-yellow/5 text-yellow text-[8px] font-bold tracking-[.11em] uppercase font-mono hover:bg-yellow hover:text-bg transition-colors cursor-pointer">
            {video.references.length} CRÉDITOS / REFERENCIAS →
          </span>
        )}

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 pt-2.5 mt-auto border-t border-border min-h-[36px]">
          {time ? (
            <time dateTime={video.publishedAt ?? ''} className="text-[9px] text-text-muted/60 font-mono tracking-[.09em]">
              {time}
            </time>
          ) : (
            <span />
          )}

          {/* Guest avatars */}
          {guests.length > 0 && (
            <div className="flex items-center">
              {guests.slice(0, 4).map((guest, i) => (
                <a
                  key={guest.slug}
                  href={guest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    'relative w-8 h-8 rounded-full border-2 border-bg overflow-visible bg-surface-raised hover:border-yellow hover:z-10 transition-colors',
                    i > 0 && '-ml-1.5',
                  )}
                  title={guest.name}
                >
                  <img
                    src={guest.image}
                    alt={guest.name}
                    width="128"
                    height="128"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover rounded-full"
                  />
                </a>
              ))}
              {guests.length > 4 && (
                <span className="min-w-[28px] h-7 -ml-1.5 grid place-items-center rounded-full bg-yellow text-bg text-[9px] font-bold font-mono">
                  +{guests.length - 4}
                </span>
              )}
            </div>
          )}
        </footer>
      </div>
    </article>
  );
}
