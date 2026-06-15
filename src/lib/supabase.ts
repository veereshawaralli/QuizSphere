// Resilient Supabase client wrapper.
//
// Why this file exists:
// The auto-generated `@/integrations/supabase/client` reads its URL and
// publishable key from `import.meta.env.VITE_SUPABASE_*`. On Vercel those env
// vars must be configured manually — if they're missing or get cleared (which
// is what was causing "Failed to fetch" every few days on the hosted build),
// the client is instantiated with `undefined` and every network call dies.
//
// To make the hosted app self-healing we re-create the client here with
// hard-coded fallbacks to the project's publishable URL + anon key (both are
// safe to ship to the browser — they are the same values Lovable injects at
// build time and are protected by Row Level Security).

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Publishable, safe-to-commit fallbacks for the Lovable Cloud backend.
const FALLBACK_URL = 'https://egcahlohmpfkgdouxcdj.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnY2FobG9obXBma2dkb3V4Y2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTc3NTMsImV4cCI6MjA4ODUzMzc1M30.jnS6C7w9cQlZC5R_J295cVB-z3YAdlY3zRDQ56x7FdA';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL;
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  FALLBACK_ANON_KEY;

if (
  !import.meta.env.VITE_SUPABASE_URL ||
  !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) {
  // Helpful breadcrumb when running on Vercel without env vars set.
  console.warn(
    '[supabase] VITE_SUPABASE_* env vars missing — using built-in fallback. ' +
      'Set them in Vercel → Project → Settings → Environment Variables to silence this.',
  );
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
