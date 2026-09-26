import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

function flag(name) {
  const prefix = `--${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function readEnv() {
  if (existsSync(resolve('.env'))) {
    process.loadEnvFile(resolve('.env'));
  }
}

/** Cliente con service role (solo scripts locales). */
function getClient() {
  const url = process.env.PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env\n' +
        '(Dashboard > Settings > API > service_role key — solo para scripts locales).',
    );
  }

  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Metadatos públicos del vídeo (título y autor) sin API key. */
async function fetchOEmbed(id) {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${id}`,
  )}&format=json`;
  const response = await fetch(endpoint, { redirect: 'follow' });
  if (!response.ok) return null;
  return response.json();
}

async function main() {
  const videoId = args.find((arg) => !arg.startsWith('--'));

  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    console.error(
      'Uso: node scripts/add-video.mjs <videoId> [--id=] [--code=] [--category=] [--description=] [...flags]',
    );
    console.error('El videoId debe ser un ID de YouTube válido (11 caracteres).');
    return 1;
  }

  readEnv();

  const meta = await fetchOEmbed(videoId);
  if (!meta) {
    console.error(`No se pudo obtener metadatos del vídeo ${videoId} (¿existe y es público?).`);
    return 1;
  }

  const category = flag('category') ?? 'analysis';
  if (category !== 'analysis' && category !== 'debate') {
    console.error("--category debe ser 'analysis' o 'debate'.");
    return 1;
  }

  const code = flag('code');
  const description = flag('description');

  if (!code || !description) {
    console.error('Faltan campos editoriales: --code y --description son obligatorios.');
    console.error(`Título sugerido desde YouTube: ${meta.title}`);
    return 1;
  }

  // Orden: el indicado, el último + 10, o null si no hay credenciales (solo dry-run).
  let nextOrder = flag('order') ? Number(flag('order')) : null;
  if (nextOrder === null && !(dryRun && !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    const { data: last, error } = await getClient()
      .from('videos')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    if (error) {
      console.error(`No se pudo leer la tabla videos: ${error.message}`);
      console.error('¿Ejecutaste supabase/005_videos.sql en el SQL Editor?');
      return 1;
    }

    nextOrder = (last?.[0]?.sort_order ?? 0) + 10;
  }

  const row = {
    id: flag('id') ?? videoId,
    code,
    category,
    title: flag('title') ?? meta.title,
    description,
    video_id: videoId,
    published_at: flag('published-at') ?? null,
    sort_order: nextOrder,
    featured: false,
    label: flag('label') ?? null,
    guests: flag('guests')
      ? flag('guests')
          .split(',')
          .map((guest) => guest.trim())
      : [],
    references: [],
  };

  console.log(`Vídeo: ${meta.title}`);
  console.log(`Canal: ${meta.author_name}`);
  console.log(JSON.stringify(row, null, 2));

  if (dryRun) return 0;

  const { error } = await getClient().from('videos').upsert(row, { onConflict: 'id' });

  if (error) {
    console.error(`Error al insertar: ${error.message}`);
    return 1;
  }

  console.log(`\nListo. Vídeo ${row.id} publicado en https://www.youtube.com/watch?v=${videoId}`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
