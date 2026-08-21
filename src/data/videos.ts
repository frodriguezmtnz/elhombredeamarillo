import type { ChannelData, CreatorData, VideoData } from '@lib/types';

export const CHANNEL: ChannelData = {
  name: 'El Hombre de Amarillo',
  handle: '@KOIBOY_OG',
  url: 'https://www.youtube.com/@koiboy_OG',
  videosUrl: 'https://www.youtube.com/@koiboy_OG/videos',
  subscribersFallback: 19000,
  latestFallbackId: '63yacyj-o-A',
  summary: 'Análisis, explicaciones, teorías y debates sobre FROM.',
  instagram: 'https://www.instagram.com/el_hombre_de_amarillo',
  email: 'koiboyttv@gmail.com'
};

export const CREATORS: Record<string, CreatorData> = {
  host: { name: 'El Hombre de Amarillo', handle: '@koiboy_OG', url: 'https://www.youtube.com/@koiboy_OG', image: '/assets/channel-avatar-premium.jpg' },
  piroxeno: { name: 'PiroxenoReviews', handle: '@Piroxeno', url: 'https://www.youtube.com/@Piroxeno', image: '/assets/creators/piroxeno-reviews.png', featured: true },
  cafe: { name: 'Café Con Series', handle: '@cafeconseries', url: 'https://www.youtube.com/@cafeconseries', image: '/assets/creators/cafe-con-series.png', featured: true },
  andrea: { name: 'Andrea Mantilla', handle: '@AndreaMantilla', url: 'https://www.youtube.com/@AndreaMantilla', image: '/assets/creators/andrea-mantilla.png' },
  reinos: { name: 'Reinos Ocultos', handle: '@ReinosOcultosPodcast', url: 'https://www.youtube.com/@ReinosOcultosPodcast', image: '/assets/creators/reinos-ocultos.png' },
  burri: { name: 'Burri Harp', handle: '@BurriHarp', url: 'https://www.youtube.com/@BurriHarp', image: '/assets/creators/burri-harp.png' },
  cine: { name: 'CineMagia', handle: '@cinemagia.psicologia', url: 'https://www.tiktok.com/@cinemagia.psicologia', image: '/assets/creators/cine-magia.png' },
  charlemos: { name: 'Charlemos sobre Cine', handle: '@CharlemosSobreCine', url: 'https://www.youtube.com/@CharlemosSobreCine', image: '/assets/creators/charlemos-sobre-series.png' }
};

export const VIDEOS: VideoData[] = [
  {
    id: 'analysis-t5-known',
    code: 'T5 // ACTUALIDAD',
    category: 'analysis',
    title: 'TODO LO QUE SABEMOS TEMPORADA 5 | FROM Serie T5',
    description: 'Recopilación de novedades, declaraciones y material relacionado con la temporada 5 de FROM.',
    videoId: '63yacyj-o-A',
    publishedAt: '2026-07-14T00:00:00+02:00',
    order: 230,
    references: [
      {
        type: 'fanart',
        label: 'CRÉDITO DE MINIATURA',
        title: 'Fanart de FROM — Temporada 5',
        creator: 'Bosslogic',
        handle: '@bosslogic',
        url: 'https://www.instagram.com/p/DaQX8tZjyT8/?utm_source=ig_web_button_share_sheet&igsh=MzRlODBiNWFlZA%3D%3D',
        profileUrl: 'https://www.instagram.com/bosslogic/',
        image: '/assets/references/bosslogic-from-t5-fanart.webp',
        imageAlt: 'Fanart de FROM para la temporada 5 creado por Bosslogic',
        action: 'VER PUBLICACIÓN',
        description: 'La imagen de la miniatura y la utilizada en el vídeo pertenece a Bosslogic. Tremendo fanart de la temporada 5.'
      },
      {
        type: 'interview',
        label: 'ENTREVISTA MENCIONADA',
        title: 'Elizabeth Saunders se ENFRENTA a unas DURAS PREGUNTAS sobre el FINAL de Donna en FROM',
        creator: 'PiroxenoReviews',
        handle: '@Piroxeno',
        url: 'https://www.youtube.com/watch?v=cTl2rqw5v7E',
        profileUrl: 'https://www.youtube.com/@Piroxeno',
        image: 'https://i.ytimg.com/vi/cTl2rqw5v7E/maxresdefault.jpg',
        imageFallback: 'https://i.ytimg.com/vi/cTl2rqw5v7E/hqdefault.jpg',
        imageAlt: 'Miniatura de la entrevista de Piroxeno a Elizabeth Saunders',
        action: 'VER ENTREVISTA',
        description: 'Entrevista de Piroxeno a Elizabeth Saunders, la actriz que interpreta a Donna, citada dentro del vídeo.'
      }
    ]
  },
  { id: 'analysis-t4e10', code: 'T4E10', category: 'analysis', title: 'TODO lo que DESVELÓ el final | Ep 10: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis completo del final de temporada: revelaciones, conexiones, preguntas abiertas y teorías.', videoId: 'n89wAW_gT3Q', order: 220 },
  { id: 'analysis-trailer-t4e10', code: 'TRÁILER E10', category: 'analysis', title: '¿El Final del Ciclo? 🤯 Análisis y teorías del tráiler del Episodio 10 | FROM Serie T4', description: '', videoId: 'GrEb6aYwKCs', order: 215 },
  { id: 'analysis-t4e09', code: 'T4E09', category: 'analysis', title: 'El inicio del FIN | Ep 9: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis, explicación y teorías del episodio 9 de FROM Serie T4.', videoId: 'y_B9GSUE-qY', order: 210 },
  { id: 'analysis-t4e08', code: 'T4E08', category: 'analysis', title: 'Esto NO terminará bien | Ep 8: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis, explicación y teorías del episodio 8 de FROM Serie T4.', videoId: 'q2VZyQzEjnQ', order: 200 },
  { id: 'analysis-t4e07', code: 'T4E07', category: 'analysis', title: 'Una GRAN REVELACIÓN | Ep 7: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis, explicación y teorías del episodio 7 de FROM Serie T4.', videoId: '7Mup_iY22jA', order: 190 },
  { id: 'analysis-t4e06', code: 'T4E06', category: 'analysis', title: '¿Qué fue lo que pasó? | Ep 6: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis, explicación y teorías del episodio 6 de FROM Serie T4.', videoId: 'LM8kTKAOMbA', order: 180 },
  { id: 'analysis-t4e05', code: 'T4E05', category: 'analysis', title: 'Los recuerdos de Jade son... | Ep 5: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis, explicación y teorías del episodio 5 de FROM Serie T4.', videoId: '-SfJBJpnh14', order: 170 },
  { id: 'analysis-t4e04', code: 'T4E04', category: 'analysis', title: 'EL PASADO MÁS CRUEL | Ep 4: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis, explicación y teorías del episodio 4 de FROM Serie T4.', videoId: 'CyiX-ojPC0w', order: 160 },
  { id: 'analysis-t4e03', code: 'T4E03', category: 'analysis', title: 'Muchas conexiones con el pasado | Ep 3: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis, explicación y teorías del episodio 3 de FROM Serie T4.', videoId: 'nwn-nT-Qt8A', order: 150 },
  { id: 'analysis-t4e02', code: 'T4E02', category: 'analysis', title: 'Las pruebas estaban delante nuestra | Ep 2: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis, explicación y teorías del episodio 2 de FROM Serie T4.', videoId: 'hRUTnIaeBy4', order: 140 },
  { id: 'analysis-t4e01', code: 'T4E01', category: 'analysis', title: 'Se revela el PLAN del hombre de amarillo | Ep 1: análisis, explicación y teorías | FROM Serie T4', description: 'Análisis, explicación y teorías del episodio 1 de FROM Serie T4.', videoId: 'MJmjczF-TPI', order: 130 },

  { id: 'debate-t4e10', code: 'T4E10', category: 'debate', label: 'EPISODIO 10', title: 'Debate con creadores #10 El FINAL | Episodio 10 | FROM Serie Temporada 4', description: 'Debate del final junto a invitados.', videoId: 'Kc0SnZH6KPY', guests: ['burri', 'charlemos'], order: 120 },
  { id: 'debate-t4e09', code: 'T4E09', category: 'debate', label: 'EPISODIO 9', title: 'Debate con creadores #9 | Episodio 9 | FROM Serie Temporada 4', description: 'El tramo final de la temporada entra en juego.', videoId: 'LJLFCB1CWhk', guests: ['piroxeno', 'cafe'], order: 110 },
  { id: 'debate-t4e08', code: 'T4E08', category: 'debate', label: 'EPISODIO 8', title: 'Debate con creadores #8 | Episodio 8 | FROM Serie Temporada 4', description: 'Seguimiento de las teorías clave.', videoId: 'MPglqmvkLBo', guests: ['piroxeno', 'cafe'], order: 100 },
  { id: 'debate-t4e07', code: 'T4E07', category: 'debate', label: 'EPISODIO 7', title: 'Debate con creadores #7 | Episodio 7 | FROM Serie Temporada 4', description: 'Burri Harp se incorpora al panel.', videoId: 'Ng2jBbpCTEI', guests: ['piroxeno', 'cafe', 'burri'], order: 90 },
  { id: 'debate-t4e06', code: 'T4E06', category: 'debate', label: 'EPISODIO 6', title: 'Debate con creadores #6 | Episodio 6 | FROM Serie Temporada 4', description: 'Revisión de conexiones y revelaciones.', videoId: 'e7TrGl4gbA4', guests: ['piroxeno', 'cafe'], order: 80 },
  { id: 'debate-pre-e06', code: 'PRE-E06', category: 'debate', label: 'CHARLA PREVIA', title: 'Debate con creadores #6 | Lo que se viene | FROM Serie Temporada 4', description: 'Previsiones antes del episodio 6.', videoId: 'ZbZ_NvK-J08', guests: ['piroxeno', 'cafe'], order: 75 },
  { id: 'debate-t4e05', code: 'T4E05', category: 'debate', label: 'EPISODIO 5', title: 'Debate con creadores #5 | Episodio 5 | FROM Serie Temporada 4', description: 'Repaso de pistas y teorías dominantes.', videoId: '67CWs2kIMoU', guests: ['piroxeno', 'cafe'], order: 70 },
  { id: 'debate-t4e04', code: 'T4E04', category: 'debate', label: 'EPISODIO 4', title: 'Debate con creadores #4 | Episodio 4 | FROM Serie Temporada 4', description: 'Panel ampliado con invitados especiales.', videoId: 'EylWaF-QtHE', guests: ['piroxeno', 'andrea', 'reinos', 'burri', 'cine'], order: 60 },
  { id: 'debate-t4e03', code: 'T4E03', category: 'debate', label: 'EPISODIO 3', title: 'Debate con creadores #3 | Especial 10k suscriptores | FROM Serie Temporada 4', description: 'Especial del canal y debate del episodio 3.', videoId: 'fk3g9fTTGYg', guests: ['piroxeno', 'cafe'], order: 50 },
  { id: 'debate-t4e02', code: 'T4E02', category: 'debate', label: 'EPISODIO 2', title: 'Debate con creadores #2 | "Fray" | FROM Serie Temporada 4', description: 'Debate y primeras teorías posteriores al episodio 2.', videoId: 'GAHT3sIEw6Q', guests: ['piroxeno', 'cafe'], order: 40 },
  { id: 'debate-t4e01', code: 'T4E01', category: 'debate', label: 'EPISODIO 1', title: 'Debate con creadores #1 | La llegada - Sorteo de un talismán! | FROM Serie Temporada 4', description: 'Primer debate de la temporada tras el episodio 1.', videoId: 'FzpdINQMKQU', guests: ['piroxeno', 'cafe'], order: 30 },
  { id: 'debate-pre-t4', code: 'PRE-T4', category: 'debate', label: 'CHARLA PREVIA', title: 'Charla Previa al estreno ¿Qué esperas de la temporada 4? | FROM Serie', description: 'Teorías y expectativas antes del estreno.', videoId: 'N6aQCZaeDbI', guests: ['piroxeno'], order: 20 }
];

export function getFeaturedVideo(): VideoData | undefined {
  return VIDEOS.find((v) => v.publishedAt);
}

export function getVideosByCategory(category: VideoData['category']): VideoData[] {
  return VIDEOS.filter((v) => v.category === category);
}

export function getRecentVideos(count: number): VideoData[] {
  return [...VIDEOS].sort((a, b) => b.order - a.order).slice(0, count);
}

export function getVideoById(id: string): VideoData | undefined {
  return VIDEOS.find((v) => v.id === id);
}
