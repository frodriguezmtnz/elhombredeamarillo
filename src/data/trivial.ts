import type { TriviaCategory, TriviaQuestion } from '@lib/types';
import rawQuestions from './trivial.json';

/**
 * Banco de preguntas del Trivial del Pueblo.
 *
 * Los DATOS viven en `trivial.json` (preguntas puras, sin lógica); aquí se
 * importan y se VALIDAN en build: una pregunta malformada rompe `pnpm build`
 * con un mensaje claro en vez de romper el juego en producción.
 *
 * Convenciones del JSON:
 * - `answer` es el índice de la opción correcta SOBRE EL ARRAY TAL CUAL ESTÁ
 *   escrito ahí; el mazo se baraja en cliente (opciones incluidas).
 * - `spoilersUpTo: 0` = no revela trama (reglas, producción, reparto accesible
 *   en prensa). `spoilersUpTo: N` = requiere haber visto hasta la temporada N.
 * - `reach` es una pista temática para la píldora en pantalla (opcional).
 * - `tags` son palabras clave internas (no se muestran en juego).
 * - Revisar/actualizar preguntas de `temporadas` y `produccion` cuando estrene la T5.
 */

export const TRIVIA_CATEGORY_LABELS: Record<TriviaCategory, string> = {
  reglas: 'REGLAS DEL PUEBLO',
  criaturas: 'CRIATURAS Y ENTIDADES',
  personajes: 'PERSONAJES',
  temporadas: 'TRAMA POR TEMPORADAS',
  misterios: 'MISTERIOS Y OBJETOS',
  lugares: 'LUGARES Y FROMVILLE',
  musica: 'MÚSICA Y GRAMOLA',
  produccion: 'PRODUCCIÓN',
  canal: 'EL CANAL',
};

const KNOWN_REACH = ['T1', 'T2', 'T3', 'T4', 'Global', 'Pre-serie', 'Producción', 'Promoción'];

export interface TriviaRank {
  key: string;
  name: string;
  /** % mínimo de aciertos para obtener el rango */
  minAccuracy: number;
  description: string;
}

export const TRIVIA_RANKS: TriviaRank[] = [
  {
    key: 'cautivo',
    name: 'CAUTIVO',
    minAccuracy: 0,
    description: 'Llevas poco en el pueblo y todavía no te has leído las reglas. Quédate dentro y observa.',
  },
  {
    key: 'llegado',
    name: 'LLEGADO',
    minAccuracy: 40,
    description: 'Ya sabes dónde estás… y dónde no debes estar cuando cae el sol.',
  },
  {
    key: 'vigia',
    name: 'VIGÍA',
    minAccuracy: 60,
    description: 'Conoces el talismán, la campana y las voces del bosque. Empiezas a escuchar de verdad.',
  },
  {
    key: 'sheriff',
    name: 'SHERIFF',
    minAccuracy: 80,
    description: 'Podrías repartir talismanes y dar el discurso de las buenas noches.',
  },
  {
    key: 'hombre-amarillo',
    name: 'EL HOMBRE DE AMARILLO',
    minAccuracy: 95,
    description: 'Sabes demasiado. Da la sensación de que el pueblo te ha dejado marchar… por algo.',
  },
];

const KNOWN_CATEGORIES = Object.keys(TRIVIA_CATEGORY_LABELS);

function validateQuestions(questions: unknown): TriviaQuestion[] {
  if (!Array.isArray(questions)) {
    throw new Error('trivial.json: la raíz debe ser un array de preguntas');
  }
  const seen = new Set<string>();
  questions.forEach((q, i) => {
    const item = q as Partial<TriviaQuestion>;
    const at = `trivial.json[${i}]`;
    if (typeof item.id !== 'string' || item.id.length === 0) throw new Error(`${at}: id ausente`);
    if (seen.has(item.id)) throw new Error(`${at} (${item.id}): id duplicado`);
    seen.add(item.id);
    if (typeof item.category !== 'string' || !KNOWN_CATEGORIES.includes(item.category))
      throw new Error(`${at} (${item.id}): categoría desconocida`);
    if (item.difficulty !== 1 && item.difficulty !== 2 && item.difficulty !== 3)
      throw new Error(`${at} (${item.id}): difficulty debe ser 1, 2 o 3`);
    if (
      item.spoilersUpTo !== 0 &&
      item.spoilersUpTo !== 1 &&
      item.spoilersUpTo !== 2 &&
      item.spoilersUpTo !== 3 &&
      item.spoilersUpTo !== 4
    )
      throw new Error(`${at} (${item.id}): spoilersUpTo debe ser 0, 1, 2, 3 o 4`);
    if (item.reach !== undefined && !KNOWN_REACH.includes(item.reach))
      throw new Error(`${at} (${item.id}): reach desconocido (${item.reach})`);
    if (item.tags !== undefined && (!Array.isArray(item.tags) || item.tags.some((t) => typeof t !== 'string')))
      throw new Error(`${at} (${item.id}): tags debe ser un array de strings`);
    if (!Array.isArray(item.options) || item.options.length !== 4)
      throw new Error(`${at} (${item.id}): debe tener exactamente 4 opciones`);
    if (item.options.some((o) => typeof o !== 'string' || o.trim().length === 0))
      throw new Error(`${at} (${item.id}): alguna opción está vacía`);
    if (new Set(item.options).size !== item.options.length)
      throw new Error(`${at} (${item.id}): hay opciones duplicadas`);
    if (
      typeof item.answer !== 'number' ||
      !Number.isInteger(item.answer) ||
      item.answer < 0 ||
      item.answer >= item.options.length
    )
      throw new Error(`${at} (${item.id}): answer fuera de rango`);
    if (typeof item.question !== 'string' || item.question.trim().length === 0)
      throw new Error(`${at} (${item.id}): question vacía`);
    if (typeof item.explanation !== 'string' || item.explanation.trim().length === 0)
      throw new Error(`${at} (${item.id}): explanation vacía`);
  });
  return questions as TriviaQuestion[];
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = validateQuestions(rawQuestions);

// ── Utilidades de mazo ─────────────────────────────────────────────────

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface DeckConfig {
  count: number;
  categories?: TriviaCategory[];
  /** Modo "hasta la temporada N": incluye spoilersUpTo <= N (en todas las categorías) */
  upTo?: 1 | 2 | 3 | 4;
  minDifficulty?: 1 | 2 | 3;
  /** Si es true, solo preguntas sin spoilers de trama (spoilersUpTo === 0) */
  safeOnly?: boolean;
  /** Si es true, pondera el muestreo hacia preguntas fáciles/medias (modo Rápido) */
  balance?: boolean;
  /** Ids ya jugados en la sesión; se excluyen para «continuar racha» */
  excludeIds?: string[];
}

// Peso de muestreo por dificultad: favorece fácil(1)/media(2) sobre difícil(3).
const BALANCE_WEIGHT: Record<1 | 2 | 3, number> = { 1: 3, 2: 2, 3: 1 };

/** Muestreo sin reemplazo ponderado (Efraimidis–Spirakis) sobre un pool barajable. */
function weightedSample(pool: TriviaQuestion[], count: number): TriviaQuestion[] {
  return pool
    .map((q) => {
      const weight = BALANCE_WEIGHT[q.difficulty] ?? 1;
      return { q, key: Math.random() ** (1 / weight) };
    })
    .sort((a, b) => a.key - b.key)
    .slice(0, count)
    .map((x) => x.q);
}

/**
 * Construye un mazo barajado y prepara las opciones desordenadas
 * (`options` y `answer` reindexados) para cada pregunta.
 */
export function buildDeck(config: DeckConfig): TriviaQuestion[] {
  let pool = TRIVIA_QUESTIONS;

  if (config.safeOnly) {
    pool = pool.filter((q) => q.spoilersUpTo === 0);
  }
  if (config.categories && config.categories.length > 0) {
    const cats = config.categories;
    pool = pool.filter((q) => cats.includes(q.category));
  }
  if (config.upTo !== undefined) {
    const n = config.upTo;
    pool = pool.filter((q) => q.spoilersUpTo <= n);
  }
  const minDifficulty = config.minDifficulty;
  if (minDifficulty !== undefined) {
    pool = pool.filter((q) => q.difficulty >= minDifficulty);
  }
  if (config.excludeIds && config.excludeIds.length > 0) {
    const played = new Set(config.excludeIds);
    pool = pool.filter((q) => !played.has(q.id));
  }

  const picked = config.balance ? weightedSample(pool, config.count) : shuffle(pool).slice(0, config.count);

  return picked.map((q) => {
    const correctOption = q.options[q.answer];
    const mixed = shuffle(q.options);
    return { ...q, options: mixed, answer: mixed.indexOf(correctOption) };
  });
}

export function getRank(accuracyPercent: number): TriviaRank {
  return [...TRIVIA_RANKS].reverse().find((r) => accuracyPercent >= r.minAccuracy) ?? TRIVIA_RANKS[0];
}

/** Nº de preguntas disponibles por categoría (para la UI de selección) */
export function countByCategory(category: TriviaCategory): number {
  return TRIVIA_QUESTIONS.filter((q) => q.category === category).length;
}

/** Nº de preguntas disponibles con spoilers hasta la temporada N */
export function countUpTo(season: 1 | 2 | 3 | 4): number {
  return TRIVIA_QUESTIONS.filter((q) => q.spoilersUpTo <= season).length;
}
