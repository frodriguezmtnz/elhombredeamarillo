-- =============================================================
-- Trivial del Pueblo — Fase 2.6: tablón solo para marcas verificadas
-- Mismo sitio que 003: Dashboard > SQL Editor > New query
--
-- Motivo: evitar bots/spam en el leaderboard. Jugar sigue siendo
-- libre; para PUBLICAR una marca hay que tener cuenta (auth.uid()).
-- =============================================================

-- Quitamos la política antigua (permitía inserts anónimos con user_id NULL)
DROP POLICY IF EXISTS "Can insert trivia scores" ON trivia_scores;

-- Nueva: solo usuarios autenticados, y solo a su propio user_id
CREATE POLICY "Authenticated users can insert own trivia scores" ON trivia_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Nota: las filas anónimas ya existentes (pruebas) se pueden borrar a mano
-- desde el Table Editor del dashboard (allí se es service role, sin RLS).
