-- =============================================================
-- Fase 3 — Grupo A: Schema de base de datos
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- =============================================================

-- Mysteries
CREATE TABLE mysteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_title TEXT NOT NULL,
  category TEXT NOT NULL,
  context TEXT NOT NULL,
  contributors TEXT,
  mentions_count INT DEFAULT 0,
  status TEXT DEFAULT 'open',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hypotheses
CREATE TABLE hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mystery_id UUID REFERENCES mysteries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT DEFAULT 'Anónimo',
  votes_count INT DEFAULT 0,
  status TEXT DEFAULT 'published',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hypothesis_id UUID REFERENCES hypotheses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hypothesis_id, user_id)
);

-- Indexes
CREATE INDEX idx_hypotheses_mystery_id ON hypotheses(mystery_id);
CREATE INDEX idx_votes_hypothesis_id ON votes(hypothesis_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- =============================================================
-- Row Level Security
-- =============================================================

ALTER TABLE mysteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Public can read mysteries" ON mysteries FOR SELECT USING (true);
CREATE POLICY "Public can read hypotheses" ON hypotheses FOR SELECT USING (true);
CREATE POLICY "Public can read votes" ON votes FOR SELECT USING (true);

-- Escritura solo autenticados
CREATE POLICY "Auth users can vote" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own vote" ON votes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Auth users can insert hypotheses" ON hypotheses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================
-- Función para mantener votes_count sincronizado
-- =============================================================

CREATE OR REPLACE FUNCTION update_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hypotheses SET votes_count = votes_count + 1 WHERE id = NEW.hypothesis_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hypotheses SET votes_count = votes_count - 1 WHERE id = OLD.hypothesis_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_votes_count();

-- =============================================================
-- Habilitar Realtime en tabla votes
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
