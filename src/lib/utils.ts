/**
 * Escapa caracteres HTML peligrosos para prevenir XSS.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char,
  );
}

/**
 * Normaliza texto para búsquedas: elimina acentos, minúsculas, trim.
 */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

/**
 * Formatea un número de suscriptores: 18300 → "18.3 K"
 */
export function formatChannelNumber(count: string | null): string {
  if (!count) return '18.3 K';
  const n = Number(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K`;
  return String(n);
}

/**
 * Calcula un "score" para ordenar vídeos: episodios > tráileres > teorías > otros.
 * A mayor order y más reciente, mayor score.
 */
export function episodeScore(video: { code: string; order: number }): number {
  let base = video.order;
  if (/^T\dE\d{2}$/.test(video.code)) base += 10;
  else if (/^TRÁILER/i.test(video.code)) base += 5;
  else if (/^TEORÍA/i.test(video.code)) base += 3;
  else if (/^TEMPORADA/i.test(video.code)) base += 1;
  return base;
}

/**
 * Convierte ISO date a formato legible: "14 jul 2026"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Tiempo relativo en español: "hace 3 días", "hace 2 semanas"
 */
export function relativeTime(publishedAt: string | null): string {
  if (!publishedAt) return '';
  const diff = Date.now() - new Date(publishedAt).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days} día${days > 1 ? 's' : ''}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? 'es' : ''}`;
}

/**
 * Iniciales de un nombre: "PiroxenoReviews" → "PR", "Café Con Series" → "CC"
 */
export function creatorInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
