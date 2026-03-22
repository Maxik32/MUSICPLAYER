import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client. Returns null if env vars are missing (app still runs; audio works).
 */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) {
    if (import.meta.env.DEV) {
      console.warn(
        "[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_*)."
      );
    }
    return null;
  }
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}
