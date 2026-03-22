import { demoTracks } from "@/data/mockData";
import { getSupabase } from "@/lib/supabaseClient";
import type { PlayerTrack } from "@/store/usePlayerStore";

function pickStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return "";
}

/** Accepts DB rows or JSON objects (camelCase or snake_case). */
export function normalizeTrackRow(row: Record<string, unknown>): PlayerTrack | null {
  const id = pickStr(row, "id");
  const title = pickStr(row, "title");
  const artist = pickStr(row, "artist") || "Неизвестный исполнитель";
  const audioUrl = pickStr(row, "audioUrl", "audio_url");
  if (!id || !title || !audioUrl) return null;

  const coverUrl = pickStr(row, "coverUrl", "cover_url");
  const description = pickStr(row, "description");
  const pc = row.play_count ?? row.playCount;
  const playCount =
    typeof pc === "number" && Number.isFinite(pc) ? pc : undefined;

  return {
    id,
    title,
    artist,
    audioUrl,
    ...(coverUrl ? { coverUrl } : {}),
    ...(description ? { description } : {}),
    ...(playCount !== undefined ? { playCount } : {}),
  };
}

export async function fetchTracksFromSupabase(): Promise<PlayerTrack[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from("tracks")
    .select("id,title,artist,description,audio_url,cover_url,play_count,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[tracks] Supabase:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => normalizeTrackRow(row as Record<string, unknown>))
    .filter((t): t is PlayerTrack => t != null);
}

/** Optional `public/user-tracks.json` — см. `user-tracks.example.json`. */
export async function fetchUserTracksFile(): Promise<PlayerTrack[]> {
  try {
    const res = await fetch("/user-tracks.json", { cache: "no-store" });
    if (!res.ok) return [];
    const raw: unknown = await res.json();
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => normalizeTrackRow(item as Record<string, unknown>))
      .filter((t): t is PlayerTrack => t != null);
  } catch {
    return [];
  }
}

export type LoadedTracksMeta = {
  tracks: PlayerTrack[];
  supabaseCount: number;
  fileCount: number;
};

export async function loadAllTracks(): Promise<LoadedTracksMeta> {
  const [fromDb, fromFile] = await Promise.all([
    fetchTracksFromSupabase(),
    fetchUserTracksFile(),
  ]);

  return {
    tracks: [...fromDb, ...fromFile, ...demoTracks],
    supabaseCount: fromDb.length,
    fileCount: fromFile.length,
  };
}
