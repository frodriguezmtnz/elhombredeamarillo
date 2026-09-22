import { computePoints, getTimeLimit } from '@lib/trivial-scoring';
import { describe, expect, it } from 'vitest';

describe('getTimeLimit', () => {
  it('asigna más tiempo cuanto más difícil', () => {
    expect(getTimeLimit(1)).toBe(15);
    expect(getTimeLimit(2)).toBe(20);
    expect(getTimeLimit(3)).toBe(30);
  });
});

describe('computePoints', () => {
  it('suma base + velocidad + racha', () => {
    // dificultad 1, tiempo completo, sin racha: 100 + 100 + 0
    expect(computePoints(1, 15, 15, 0)).toBe(200);
  });

  it('normaliza la velocidad por fracción de tiempo, no por segundos absolutos', () => {
    // misma fracción restante (50%) en fácil y difícil => mismo bonus de velocidad
    const easy = computePoints(1, 7.5, 15, 0);
    const hard = computePoints(3, 15, 30, 0);
    expect(easy - 100).toBe(50);
    expect(easy - 100).toBe(hard - 300);
  });

  it('sin tiempo restante solo suma la base', () => {
    expect(computePoints(2, 0, 20, 0)).toBe(200);
  });

  it('el bonus de racha sube 20 por acierto y se topa en 5', () => {
    expect(computePoints(1, 0, 15, 1)).toBe(120);
    expect(computePoints(1, 0, 15, 5)).toBe(200);
    expect(computePoints(1, 0, 15, 9)).toBe(200);
  });

  it('protege contra un límite de tiempo de 0', () => {
    expect(computePoints(1, 10, 0, 0)).toBe(100);
  });
});
