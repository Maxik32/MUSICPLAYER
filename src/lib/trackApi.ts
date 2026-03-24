import { getSupabase } from "@/lib/supabaseClient";
import { normalizeTrackRow, TRACKS_SELECT } from "@/lib/loadTracks";
import type { PlayerTrack } from "@/store/usePlayerStore";

function rowToTrack(row: Record<string, unknown>): PlayerTrack | null {
  return normalizeTrackRow(row);
}

const CHART_CACHE_TTL_MS = 20_000;
let chartCache: { value: PlayerTrack[]; at: number; limit: number } | null = null;
let chartInFlight: Promise<PlayerTrack[]> | null = null;

export async function fetchChartTracks(limit = 30): Promise<PlayerTrack[]> {
  const now = Date.now();
  if (
    chartCache &&
    chartCache.limit === limit &&
    now - chartCache.at < CHART_CACHE_TTL_MS
  ) {
    return chartCache.value;
  }
  if (chartInFlight) return chartInFlight;

  const sb = getSupabase();
  if (!sb) return [];

  chartInFlight = (async () => {
    const { data, error } = await sb
      .from("tracks")
      .select(TRACKS_SELECT)
      .order("play_count", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("[chart]", error.message);
      return [];
    }
    const parsed = (data ?? [])
      .map((row) => rowToTrack(row as Record<string, unknown>))
      .filter((t): t is PlayerTrack => t != null);
    chartCache = { value: parsed, at: Date.now(), limit };
    return parsed;
  })();

  try {
    return await chartInFlight;
  } finally {
    chartInFlight = null;
  }
}

export async function fetchFavoriteTracks(
  userId: string
): Promise<PlayerTrack[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: favs, error: e1 } = await sb
    .from("user_favorites")
    .select("track_id,created_at")
    .eq("user_id", userId);
  if (e1) {
    console.warn("[favorites]", e1.message);
    return [];
  }

  const sortedFavs = (favs ?? []) as { track_id: string; created_at: string }[];
  // Last added first (by created_at)
  sortedFavs.sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return tb - ta;
  });

  const ids = sortedFavs.map((r) => r.track_id);
  if (!ids.length) return [];
  const { data: tracks, error: e2 } = await sb
    .from("tracks")
    .select(TRACKS_SELECT)
    .in("id", ids);
  if (e2) {
    console.warn("[favorites tracks]", e2.message);
    return [];
  }
  const map = new Map<string, PlayerTrack>();
  for (const row of tracks ?? []) {
    const tr = rowToTrack(row as Record<string, unknown>);
    if (tr) map.set(tr.id, tr);
  }

  // Preserve favorite order (by ids)
  return ids.map((id) => map.get(id)).filter((t): t is PlayerTrack => Boolean(t));
}

export async function fetchFavoriteIds(userId: string): Promise<Set<string>> {
  const sb = getSupabase();
  if (!sb) return new Set();
  const { data, error } = await sb
    .from("user_favorites")
    .select("track_id")
    .eq("user_id", userId);
  if (error) return new Set();
  return new Set((data ?? []).map((r) => String((r as { track_id: string }).track_id)));
}

export async function addFavorite(
  userId: string,
  trackId: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from("user_favorites").insert({
    user_id: userId,
    track_id: trackId,
  });
  if (error) {
    console.warn("[addFavorite]", error.message);
    return false;
  }
  return true;
}

export async function removeFavorite(
  userId: string,
  trackId: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("track_id", trackId);
  if (error) {
    console.warn("[removeFavorite]", error.message);
    return false;
  }
  return true;
}

export type PlaylistRow = {
  id: string;
  name: string;
  created_at: string;
  trackCount?: number;
};

export async function fetchPlaylists(userId: string): Promise<PlaylistRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("playlists")
    .select("id,name,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[playlists]", error.message);
    return [];
  }
  const rows = (data ?? []) as PlaylistRow[];
  const withCounts = await Promise.all(
    rows.map(async (p) => {
      const { count } = await sb
        .from("playlist_tracks")
        .select("track_id", { count: "exact", head: true })
        .eq("playlist_id", p.id);
      return { ...p, trackCount: count ?? 0 };
    })
  );
  return withCounts;
}

export async function createPlaylist(
  userId: string,
  name: string
): Promise<PlaylistRow | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("playlists")
    .insert({ user_id: userId, name: name.trim() })
    .select("id,name,created_at")
    .single();
  if (error) {
    console.warn("[createPlaylist]", error.message);
    return null;
  }
  return { ...(data as PlaylistRow), trackCount: 0 };
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from("playlist_tracks").insert({
    playlist_id: playlistId,
    track_id: trackId,
  });
  if (error) {
    console.warn("[addTrackToPlaylist]", error.message);
    return false;
  }
  return true;
}

export async function fetchPlaylistTracks(
  playlistId: string
): Promise<PlayerTrack[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data: pts, error: e1 } = await sb
    .from("playlist_tracks")
    .select("track_id")
    .eq("playlist_id", playlistId);
  if (e1) {
    console.warn("[playlist tracks]", e1.message);
    return [];
  }
  const ids = (pts ?? []).map((r) => (r as { track_id: string }).track_id);
  if (!ids.length) return [];
  const { data: tracks, error: e2 } = await sb
    .from("tracks")
    .select(TRACKS_SELECT)
    .in("id", ids);
  if (e2) return [];
  return (tracks ?? [])
    .map((row) => rowToTrack(row as Record<string, unknown>))
    .filter((t): t is PlayerTrack => t != null);
}
