import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
let healthCache: { ok: boolean; at: number } | null = null;
const HEALTH_TTL_MS = 15_000;

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

export async function isSupabaseReachable(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && healthCache && now - healthCache.at < HEALTH_TTL_MS) {
    return healthCache.ok;
  }
  const sb = getSupabase();
  if (!sb) {
    healthCache = { ok: false, at: now };
    return false;
  }

  try {
    const { error } = await sb.from("tracks").select("id", { head: true, count: "exact" });
    const ok = !error;
    healthCache = { ok, at: Date.now() };
    return ok;
  } catch {
    healthCache = { ok: false, at: Date.now() };
    return false;
  }
}
