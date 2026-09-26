import { getFeaturedVideo, getRecentVideos } from '@data/videos';
import type { VideoData } from '@lib/types';
import { describe, expect, it } from 'vitest';

// IDs ficticios construidos con repeat() para que el escáner de miniaturas
// (scripts/fetch-thumbnails.mjs) no los confunda con vídeos reales.
const fakeVideoId = (seed: string) => seed.repeat(11);

const list: VideoData[] = [
  {
    id: 'a',
    code: 'X',
    category: 'analysis',
    title: 'A',
    description: '',
    videoId: fakeVideoId('a'),
    order: 1,
  },
  {
    id: 'b',
    code: 'X',
    category: 'debate',
    title: 'B',
    description: '',
    videoId: fakeVideoId('b'),
    order: 5,
    publishedAt: '2026-01-01T00:00:00+01:00',
  },
  {
    id: 'c',
    code: 'X',
    category: 'analysis',
    title: 'C',
    description: '',
    videoId: fakeVideoId('c'),
    order: 3,
  },
];

describe('getRecentVideos', () => {
  it('ordena por order descendente y corta al número pedido', () => {
    expect(getRecentVideos(2, list).map((v) => v.id)).toEqual(['b', 'c']);
  });

  it('devuelve toda la lista si se piden más de los que hay', () => {
    expect(getRecentVideos(10, list)).toHaveLength(3);
  });
});

describe('getFeaturedVideo', () => {
  it('devuelve el primero con fecha de publicación de la lista recibida', () => {
    expect(getFeaturedVideo(list)?.id).toBe('b');
  });

  it('devuelve undefined si ninguno tiene fecha', () => {
    const sinFecha = list.filter((v) => !v.publishedAt);
    expect(getFeaturedVideo(sinFecha)).toBeUndefined();
  });
});
