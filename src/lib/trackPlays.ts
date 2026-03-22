import { getSupabase } from "@/lib/supabaseClient";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidTrackId(trackId: string): boolean {
  return UUID_RE.test(trackId);
}

/** Увеличивает play_count в Supabase (только для UUID из таблицы tracks). */
export async function recordTrackPlay(trackId: string): Promise<void> {
  if (!isUuidTrackId(trackId)) return;
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.rpc("increment_track_play", {
    p_track_id: trackId,
  });
  if (error) console.warn("[trackPlays]", error.message);
}
