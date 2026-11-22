import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingVars = [];
if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = missingVars.length === 0;

if (!isSupabaseConfigured) {
  console.error(
    `[Supabase] Missing environment variable(s): ${missingVars.join(', ')}. ` +
      'Create a .env file in the project root (see .env.example) and restart the dev server.'
  );
}

// Client is only created when configured; createClient throws on empty URL/key.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
