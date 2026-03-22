import { getSupabase } from "@/lib/supabaseClient";
import type { PlayerTrack } from "@/store/usePlayerStore";

/**
 * Колонки для `tracks`. После миграции `003_tracks_album.sql` можно добавить: `album`.
 */
export const TRACKS_SELECT =
  "id,title,artist,description,audio_url,cover_url,play_count,created_at";

function pickStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return "";
}

export function normalizeTrackRow(row: Record<string, unknown>): PlayerTrack | null {
  const id = pickStr(row, "id");
  const title = pickStr(row, "title");
  const artist = pickStr(row, "artist") || "Неизвестный исполнитель";
  const audioUrl = pickStr(row, "audioUrl", "audio_url");
  if (!id || !title || !audioUrl) return null;

  const coverUrl = pickStr(row, "coverUrl", "cover_url");
  const description = pickStr(row, "description");
  const album = pickStr(row, "album");
  const pc = row.play_count ?? row.playCount;
  const playCount =
    typeof pc === "number" && Number.isFinite(pc) ? pc : undefined;

  return {
    id,
    title,
    artist,
    audioUrl,
    ...(album ? { album } : {}),
    ...(coverUrl ? { coverUrl } : {}),
    ...(description ? { description } : {}),
    ...(playCount !== undefined ? { playCount } : {}),
  };
}

/** Все треки только из Supabase (без mock / локальных JSON). */
export async function fetchAllTracksFromSupabase(): Promise<PlayerTrack[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("tracks")
    .select(TRACKS_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[tracks] Supabase:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => normalizeTrackRow(row as Record<string, unknown>))
    .filter((t): t is PlayerTrack => t != null);
}
