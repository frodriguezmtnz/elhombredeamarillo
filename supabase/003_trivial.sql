-- =============================================================
-- Trivial del Pueblo — Fase 2: leaderboard
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- =============================================================

-- Marcadores del trivial
CREATE TABLE trivia_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  player TEXT NOT NULL DEFAULT 'Anónimo',
  mode TEXT NOT NULL,
  score INT NOT NULL,
  correct INT NOT NULL,
  total INT NOT NULL,
  best_streak INT NOT NULL DEFAULT 0,
  rank TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Cortafuegos básico: valores dentro de lo jugable
  CONSTRAINT trivia_player_len CHECK (char_length(player) BETWEEN 1 AND 24),
  CONSTRAINT trivia_mode_len CHECK (char_length(mode) BETWEEN 1 AND 40),
  CONSTRAINT trivia_score_cap CHECK (score BETWEEN 0 AND 30000),
  CONSTRAINT trivia_counts CHECK (total BETWEEN 1 AND 50 AND correct BETWEEN 0 AND total),
  CONSTRAINT trivia_streak_cap CHECK (best_streak BETWEEN 0 AND 50),
  CONSTRAINT trivia_rank_len CHECK (char_length(rank) BETWEEN 1 AND 40)
);

-- Índices
CREATE INDEX idx_trivia_scores_score ON trivia_scores(score DESC);
CREATE INDEX idx_trivia_scores_created ON trivia_scores(created_at DESC);
CREATE INDEX idx_trivia_scores_user ON trivia_scores(user_id);

-- =============================================================
-- Row Level Security
-- =============================================================

ALTER TABLE trivia_scores ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el tablón es público)
CREATE POLICY "Public can read trivia scores" ON trivia_scores FOR SELECT USING (true);

-- Inserto: anónimos (sin user_id) o autenticados solo a su propio user_id.
-- Los CHECK de la tabla acotan puntuaciones y alias.
CREATE POLICY "Can insert trivia scores" ON trivia_scores
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Cada cual puede borrar sus propias marcas verificadas
CREATE POLICY "Users can delete own trivia scores" ON trivia_scores
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================
-- Realtime (tablón en vivo)
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE trivia_scores;
