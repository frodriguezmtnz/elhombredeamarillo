import type { VideoData } from '@lib/types';
import { mapVideoRow, pickVideos } from '@lib/videos-service';
import { describe, expect, it } from 'vitest';

const fallback: VideoData[] = [
  {
    id: 'estatico',
    code: 'X',
    category: 'analysis',
    title: 'Vídeo estático',
    description: 'Respaldo',
    videoId: 'aaaaaaaaaaa',
    order: 1,
  },
];

describe('mapVideoRow', () => {
  it('mapea snake_case a camelCase y conserva los campos', () => {
    const video = mapVideoRow({
      id: 'theory-ghosts',
      code: 'T5 // TEORÍA',
      category: 'analysis',
      title: 'Título',
      description: 'Descripción',
      video_id: '0rnszazr2NI',
      published_at: '2026-07-14T00:00:00+02:00',
      sort_order: 240,
      label: 'CHARLA',
      guests: ['piroxeno'],
      references: [],
    });

    expect(video).toMatchObject({
      id: 'theory-ghosts',
      code: 'T5 // TEORÍA',
      category: 'analysis',
      videoId: '0rnszazr2NI',
      publishedAt: '2026-07-14T00:00:00+02:00',
      order: 240,
      label: 'CHARLA',
      guests: ['piroxeno'],
      references: [],
    });
  });

  it('deja undefined los campos opcionales nulos', () => {
    const video = mapVideoRow({
      id: 'debate-x',
      code: 'DEBATE',
      category: 'debate',
      title: 'T',
      description: 'D',
      video_id: 'bbbbbbbbbbb',
      published_at: null,
      sort_order: 0,
      label: null,
      guests: null,
      references: null,
    });

    expect(video.category).toBe('debate');
    expect(video.publishedAt).toBeUndefined();
    expect(video.label).toBeUndefined();
    expect(video.guests).toBeUndefined();
    expect(video.references).toBeUndefined();
  });

  it('normaliza categorías desconocidas a analysis', () => {
    const video = mapVideoRow({
      id: 'raro',
      code: 'X',
      category: 'otra',
      title: 'T',
      description: 'D',
      video_id: 'ccccccccccc',
      published_at: null,
      sort_order: 0,
      label: null,
      guests: null,
      references: null,
    });

    expect(video.category).toBe('analysis');
  });
});

describe('pickVideos', () => {
  it('usa el catálogo remoto cuando trae vídeos', () => {
    const remote: VideoData[] = [{ ...fallback[0], id: 'remoto' }];

    expect(pickVideos(fallback, remote)).toBe(remote);
  });

  it('cae al estático si el remoto está vacío o no llega', () => {
    expect(pickVideos(fallback, [])).toBe(fallback);
    expect(pickVideos(fallback, undefined)).toBe(fallback);
  });
});
