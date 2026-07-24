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

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? 'Unknown error');
}

export function isBackendConnectionError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('fetch failed')
  );
}

export function authErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (isBackendConnectionError(error)) {
    return 'The login service is waking up. I retried automatically, but the connection is still not ready. Please try again in a few seconds.';
  }

  const message = getErrorMessage(error);
  return message && message !== 'Unknown error' ? message : fallback;
}

async function resilientFetch(input: RequestInfo | URL, init?: RequestInit) {
  const delays = [0, 500, 1200, 2500, 5000];
  let lastError: unknown;

  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    const delay = delays[attempt];
    if (delay > 0) await wait(delay);

    try {
      const requestInput = input instanceof Request ? input.clone() : input;
      const response = await fetch(requestInput, init);

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === delays.length - 1) {
        return response;
      }

      lastError = new Error(`Temporary auth service response: ${response.status}`);
    } catch (error) {
      lastError = error;
      if (!isBackendConnectionError(error) || attempt === delays.length - 1) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

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
    global: {
      fetch: resilientFetch,
    },
  },
);
