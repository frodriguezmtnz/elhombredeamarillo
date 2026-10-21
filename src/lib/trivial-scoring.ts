/** Segundos por pregunta según dificultad (1 = fácil, 2 = media, 3 = difícil) */
export const TIME_LIMIT_BY_DIFFICULTY: Record<1 | 2 | 3, number> = { 1: 15, 2: 20, 3: 30 };

/** Tope de puntuación aceptado por la tabla `trivia_scores` (CHECK score <= 30000). */
export const MAX_STORED_SCORE = 30000;

/** Ajusta la marca de sesión al rango que acepta la BD antes de publicarla. */
export function clampScoreForLeaderboard(score: number): number {
  return Math.max(0, Math.min(Math.floor(score), MAX_STORED_SCORE));
}

export function getTimeLimit(difficulty: 1 | 2 | 3): number {
  return TIME_LIMIT_BY_DIFFICULTY[difficulty];
}

/**
 * Puntos de un acierto: base por dificultad + bonus de velocidad normalizado por
 * la fracción de tiempo restante (una difícil no puntúa más que una fácil solo por
 * tener más margen) + bonus por racha (tope de 5).
 */
export function computePoints(difficulty: number, timeLeft: number, timeLimit: number, streakAfter: number): number {
  const base = difficulty * 100;
  const ratio = timeLimit > 0 ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 0;
  const speed = Math.round(ratio * 100);
  const streakBonus = Math.min(streakAfter, 5) * 20;
  return base + speed + streakBonus;
}
