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
 * - `season: 0` = la pregunta no revela trama (reglas generales, producción, canal).
 * - `season: N` = requiere haber visto hasta la temporada N (spoilers).
 * - Revisar/actualizar preguntas de `temporadas` y `produccion` cuando estrene la T4.
 */

export const TRIVIA_CATEGORY_LABELS: Record<TriviaCategory, string> = {
  reglas: 'REGLAS DEL PUEBLO',
  criaturas: 'CRIATURAS Y ENTIDADES',
  personajes: 'PERSONAJES',
  temporadas: 'TRAMA POR TEMPORADAS',
  produccion: 'PRODUCCIÓN',
  canal: 'EL CANAL',
};

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
    if (item.season !== 0 && item.season !== 1 && item.season !== 2 && item.season !== 3)
      throw new Error(`${at} (${item.id}): season debe ser 0, 1, 2 o 3`);
    if (!Array.isArray(item.options) || item.options.length !== 4)
      throw new Error(`${at} (${item.id}): debe tener exactamente 4 opciones`);
    if (item.options.some((o) => typeof o !== 'string' || o.trim().length === 0))
      throw new Error(`${at} (${item.id}): alguna opción está vacía`);
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
  season?: 1 | 2 | 3;
  minDifficulty?: 1 | 2 | 3;
  /** Si es true, solo preguntas sin spoilers de trama (season === 0) */
  safeOnly?: boolean;
}

/**
 * Construye un mazo barajado y prepara las opciones desordenadas
 * (`options` y `answer` reindexados) para cada pregunta.
 */
export function buildDeck(config: DeckConfig): TriviaQuestion[] {
  let pool = TRIVIA_QUESTIONS;

  if (config.safeOnly) {
    pool = pool.filter((q) => q.season === 0);
  }
  if (config.categories && config.categories.length > 0) {
    const cats = config.categories;
    pool = pool.filter((q) => cats.includes(q.category));
  }
  if (config.season !== undefined) {
    const s = config.season;
    pool = pool.filter((q) => q.season === s || q.season === 0);
  }
  const minDifficulty = config.minDifficulty;
  if (minDifficulty !== undefined) {
    pool = pool.filter((q) => q.difficulty >= minDifficulty);
  }

  return shuffle(pool)
    .slice(0, config.count)
    .map((q) => {
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

/** Nº de preguntas disponibles para un modo de temporada */
export function countForSeason(season: 1 | 2 | 3): number {
  return TRIVIA_QUESTIONS.filter((q) => q.season === season || q.season === 0).length;
}
