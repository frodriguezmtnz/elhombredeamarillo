-- =============================================================
-- Hardening de hypotheses — auditoría de seguridad 2026-11
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
--
-- Motivo (auditoría OWASP):
-- 1. La política de INSERT solo exigía estar autenticado: permitía
--    fijar votes_count (inflar votos), status y display_order.
-- 2. Sin CHECKs de longitud en la tabla.
-- 3. El campo author guardaba emails de usuarios en una tabla de
--    lectura pública (fuga de PII).
-- =============================================================

-- -------------------------------------------------------------
-- 1. Cortafuegos: CHECKs para valores de lo que pinta la web
-- -------------------------------------------------------------
ALTER TABLE hypotheses
  ADD CONSTRAINT hypotheses_title_len CHECK (char_length(title) BETWEEN 15 AND 100),
  ADD CONSTRAINT hypotheses_desc_len CHECK (char_length(description) BETWEEN 1 AND 255),
  ADD CONSTRAINT hypotheses_author_len CHECK (char_length(author) BETWEEN 1 AND 100),
  ADD CONSTRAINT hypotheses_votes_count_min CHECK (votes_count >= 0),
  ADD CONSTRAINT hypotheses_display_order_min CHECK (display_order >= 0);

-- -------------------------------------------------------------
-- 2. INSERT restrictivo: solo autenticados, y solo filas "limpias".
--    Un usuario NO puede crear una hipótesis con votos previos,
--    status distinto de 'published' ni display_order arbitrario.
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Auth users can insert hypotheses" ON hypotheses;

CREATE POLICY "Auth users can insert clean hypotheses" ON hypotheses
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND status = 'published'
    AND votes_count = 0
    AND display_order = 0
  );

-- Nota: NO se crean políticas de UPDATE/DELETE — igual que en la
-- tabla videos, solo la service role key (que salta RLS) puede
-- moderar o borrar hipótesis.

-- -------------------------------------------------------------
-- 3. PII: anonimizar emails ya guardados en author.
--    (El frontend ya no envía el email desde este cambio.)
-- -------------------------------------------------------------
UPDATE hypotheses
  SET author = 'Anónimo'
  WHERE author LIKE '%_@_%._%';
