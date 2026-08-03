import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

/**
 * Devuelve el cliente Supabase singleton (async, lazy init).
 * Usa dynamic import para que @supabase/supabase-js NO se pre-bundlee
 * a nivel de módulo — esto evita que Vite corrompa el JSX runtime de React.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (client) return Promise.resolve(client);
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const url = import.meta.env.PUBLIC_SUPABASE_URL as string;
    const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

    if (!url || !key) {
      throw new Error('Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY en .env');
    }

    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(url, key);
    return client;
  })();

  return initPromise;
}
