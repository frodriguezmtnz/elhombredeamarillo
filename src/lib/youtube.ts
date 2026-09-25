/**
 * Miniatura auto-hospedada del vídeo (evita bloqueos de i.ytimg.com).
 * Se generan con `pnpm thumbs`.
 */
export function thumbnailUrl(videoId: string): string {
  return `/assets/thumbs/${encodeURIComponent(videoId)}.jpg`;
}

/**
 * Miniatura remota de YouTube, usada como fallback si la local no existe.
 */
export function thumbnailRemoteUrl(videoId: string, quality = 'hqdefault'): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg`;
}

/**
 * URL de máxima resolución con fallback automático.
 */
export function thumbnailUrlMax(videoId: string): string {
  return thumbnailUrl(videoId);
}

/**
 * URL de un vídeo de YouTube.
 */
export function youtubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

/**
 * URL del canal de YouTube.
 */
export function channelUrl(handle: string): string {
  return `https://www.youtube.com/${encodeURIComponent(handle)}`;
}

/**
 * URL de búsqueda en el canal.
 */
export function channelSearchUrl(handle: string, query: string): string {
  return `https://www.youtube.com/${encodeURIComponent(handle)}/search?query=${encodeURIComponent(query)}`;
}
