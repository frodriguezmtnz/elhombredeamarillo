import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Cliente Supabase para el browser (React islands).
 * Usa las credenciales públicas (anon key).
 * La seguridad depende de las políticas RLS en Supabase.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
