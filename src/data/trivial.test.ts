import { TRIVIA_QUESTIONS, buildDeck, countByCategory, countUpTo, validateQuestions } from '@data/trivial';
import type { TriviaQuestion } from '@lib/types';
import { describe, expect, it } from 'vitest';

function makeQuestion(overrides: Partial<TriviaQuestion> = {}): TriviaQuestion {
  return {
    id: 'QTEST',
    category: 'reglas',
    difficulty: 1,
    spoilersUpTo: 0,
    question: '¿Pregunta de prueba?',
    options: ['A', 'B', 'C', 'D'],
    answer: 0,
    explanation: 'Explicación de prueba.',
    ...overrides,
  };
}

describe('buildDeck', () => {
  it('respeta el número de preguntas pedido', () => {
    expect(buildDeck({ count: 5 })).toHaveLength(5);
    expect(buildDeck({ count: 10 })).toHaveLength(10);
  });

  it('no devuelve más preguntas que el pool disponible', () => {
    expect(buildDeck({ count: TRIVIA_QUESTIONS.length + 100 })).toHaveLength(TRIVIA_QUESTIONS.length);
  });

  it('aplica minDifficulty', () => {
    const deck = buildDeck({ count: 100, minDifficulty: 3 });
    expect(deck.length).toBeGreaterThan(0);
    expect(deck.every((q) => q.difficulty === 3)).toBe(true);
  });

  it('aplica safeOnly (solo sin spoilers de trama)', () => {
    const deck = buildDeck({ count: 100, safeOnly: true });
    expect(deck.length).toBeGreaterThan(0);
    expect(deck.every((q) => q.spoilersUpTo === 0)).toBe(true);
  });

  it('filtra por categoría', () => {
    const deck = buildDeck({ count: 100, categories: ['reglas'] });
    expect(deck).toHaveLength(countByCategory('reglas'));
    expect(deck.every((q) => q.category === 'reglas')).toBe(true);
  });

  it('filtra por temporada (upTo)', () => {
    const deck = buildDeck({ count: 100, upTo: 2 });
    expect(deck).toHaveLength(countUpTo(2));
    expect(deck.every((q) => q.spoilersUpTo <= 2)).toBe(true);
  });

  it('excluye las preguntas ya jugadas (excludeIds)', () => {
    const pool = buildDeck({ count: 100, categories: ['reglas'] });
    const played = pool.slice(0, 3).map((q) => q.id);
    const deck = buildDeck({ count: 100, categories: ['reglas'], excludeIds: played });
    expect(deck).toHaveLength(pool.length - played.length);
    expect(deck.some((q) => played.includes(q.id))).toBe(false);
  });

  it('devuelve un mazo vacío cuando se excluye todo el pool (dispara el fallback del tablero)', () => {
    const pool = buildDeck({ count: 100, categories: ['reglas'] });
    const all = pool.map((q) => q.id);
    expect(buildDeck({ count: 100, categories: ['reglas'], excludeIds: all })).toHaveLength(0);
  });
});

describe('barajado de opciones', () => {
  it('mantiene las 4 opciones, sin duplicados, y reindexa la correcta', () => {
    for (const q of buildDeck({ count: 20 })) {
      const original = TRIVIA_QUESTIONS.find((o) => o.id === q.id);
      expect(original).toBeDefined();
      if (!original) continue;
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect([...q.options].sort()).toEqual([...original.options].sort());
      expect(q.options[q.answer]).toBe(original.options[original.answer]);
    }
  });

  it('cambia el orden de las opciones entre mazos', () => {
    const orders = new Set<string>();
    for (let i = 0; i < 30; i += 1) {
      orders.add(buildDeck({ count: 1 })[0].options.join('|'));
    }
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('validateQuestions', () => {
  it('acepta una pregunta válida', () => {
    expect(validateQuestions([makeQuestion()])).toHaveLength(1);
  });

  it('acepta image/imageAlt/links válidos', () => {
    const q = makeQuestion({
      image: '/assets/trivial/x.webp',
      imageAlt: 'texto alternativo',
      links: [{ label: 'Web', href: 'https://example.com/music' }],
    });
    expect(validateQuestions([q])).toHaveLength(1);
  });

  it('rechaza una raíz que no es array', () => {
    expect(() => validateQuestions({})).toThrow(/array/);
  });

  it('rechaza ids duplicados', () => {
    expect(() => validateQuestions([makeQuestion(), makeQuestion()])).toThrow(/duplicado/);
  });

  it('rechaza un número de opciones distinto de 4', () => {
    expect(() => validateQuestions([makeQuestion({ options: ['A', 'B'] })])).toThrow(/4 opciones/);
  });

  it('rechaza opciones duplicadas', () => {
    expect(() => validateQuestions([makeQuestion({ options: ['A', 'A', 'C', 'D'] })])).toThrow(/duplicadas/);
  });

  it('rechaza answer fuera de rango', () => {
    expect(() => validateQuestions([makeQuestion({ answer: 9 })])).toThrow(/answer/);
  });

  it('rechaza una imagen vacía', () => {
    expect(() => validateQuestions([makeQuestion({ image: '   ' })])).toThrow(/image/);
  });

  it('rechaza links con href no http(s)', () => {
    expect(() => validateQuestions([makeQuestion({ links: [{ label: 'x', href: 'ftp://x.com' }] })])).toThrow(/href/);
  });

  it('rechaza links con label vacío', () => {
    expect(() => validateQuestions([makeQuestion({ links: [{ label: '', href: 'https://x.com' }] })])).toThrow(/label/);
  });
});
