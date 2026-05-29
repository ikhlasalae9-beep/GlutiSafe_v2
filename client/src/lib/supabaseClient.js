import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_PUBLISHABLE_KEY = supabaseKey || '';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error('Connexion indisponible pour le moment. Veuillez réessayer plus tard.');
  }

  return supabase;
}
