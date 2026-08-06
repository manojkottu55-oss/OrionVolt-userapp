import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Graceful failure on missing credentials ──
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL_HERE') {
  console.error(
    '[OrionVolt] VITE_SUPABASE_URL is missing or placeholder.\n' +
    'Create a .env file in user-app/ with:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.error(
    '[OrionVolt] VITE_SUPABASE_ANON_KEY is missing or placeholder.\n' +
    'Create a .env file in user-app/ with:\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

// Create client even with empty strings — components check isMissing before calling auth
export const isMissing = !supabaseUrl || !supabaseAnonKey;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
