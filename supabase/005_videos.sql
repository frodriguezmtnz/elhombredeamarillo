-- =============================================================
-- Vídeos — catálogo gestionable desde Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- =============================================================

-- Catálogo de vídeos del canal. Espejo de `src/data/videos.ts`:
-- la web pinta los datos estáticos como respaldo y refresca en
-- runtime con lo que haya aquí (lectura pública, escritura solo
-- con la service role key desde scripts locales).
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_id TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  label TEXT,
  guests JSONB NOT NULL DEFAULT '[]'::jsonb,
  references JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Cortafuegos básico: valores dentro de lo que pinta la web
  CONSTRAINT videos_category_values CHECK (category IN ('analysis', 'debate')),
  CONSTRAINT videos_code_len CHECK (char_length(code) BETWEEN 1 AND 40),
  CONSTRAINT videos_video_id_len CHECK (char_length(video_id) BETWEEN 6 AND 20),
  CONSTRAINT videos_guests_is_array CHECK (jsonb_typeof(guests) = 'array'),
  CONSTRAINT videos_references_is_array CHECK (jsonb_typeof("references") = 'array')
);

-- Índices
CREATE INDEX idx_videos_sort_order ON videos(sort_order DESC);
CREATE INDEX idx_videos_category ON videos(category);

-- =============================================================
-- Row Level Security
-- =============================================================

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el catálogo es público). Sin políticas de
-- INSERT/UPDATE/DELETE: solo la service role key (que salta RLS)
-- puede escribir, vía scripts locales o el SQL Editor.
CREATE POLICY "Public can read videos" ON videos FOR SELECT USING (true);

-- =============================================================
-- Mantener updated_at sincronizado
-- =============================================================

CREATE OR REPLACE FUNCTION set_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_videos_update
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION set_videos_updated_at();
