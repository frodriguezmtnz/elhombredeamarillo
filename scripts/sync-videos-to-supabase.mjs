import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');

if (existsSync(resolve('.env'))) {
  process.loadEnvFile(resolve('.env'));
}

if (!process.features.typescript) {
  console.error('Este script necesita Node 22.18+ (o 24+) para leer src/data/videos.ts. Actualiza Node.');
  process.exit(1);
}

const { VIDEOS } = await import('../src/data/videos.ts');

/** Convierte un VideoData de `src/data/videos.ts` a una fila de la tabla `videos`. */
function toRow(video) {
  return {
    id: video.id,
    code: video.code,
    category: video.category,
    title: video.title,
    description: video.description,
    video_id: video.videoId,
    published_at: video.publishedAt ?? null,
    sort_order: video.order,
    featured: false,
    label: video.label ?? null,
    guests: video.guests ?? [],
    references: video.references ?? [],
  };
}

const rows = VIDEOS.map(toRow);

console.log(`${rows.length} vídeos leídos de src/data/videos.ts`);

if (dryRun) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

const url = process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env\n' +
      '(Dashboard > Settings > API > service_role key — solo para scripts locales).',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase.from('videos').upsert(rows, { onConflict: 'id' });

if (error) {
  console.error(`Error al sincronizar: ${error.message}`);
  process.exit(1);
}

console.log(`Sincronizados ${rows.length} vídeos en Supabase.`);
