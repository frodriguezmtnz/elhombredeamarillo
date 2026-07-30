/**
 * URL de miniatura de YouTube con fallback.
 */
export function thumbnailUrl(videoId: string, quality = 'hqdefault'): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg`;
}

/**
 * URL de máxima resolución con fallback automático.
 */
export function thumbnailUrlMax(videoId: string): string {
  return thumbnailUrl(videoId, 'maxresdefault');
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
