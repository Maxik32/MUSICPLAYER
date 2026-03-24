import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { TrackRow } from "@/components/TrackRow";
import { useAuthStore } from "@/store/useAuthStore";
import type { PlayerTrack } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getSupabase } from "@/lib/supabaseClient";
import { fetchPlaylistTracks } from "@/lib/trackApi";

export function PlaylistPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { playlistId } = useParams();
  const user = useAuthStore((s) => s.user);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const [name, setName] = useState<string>("");
  const [tracks, setTracks] = useState<PlayerTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const close = useCallback(() => {
    // If opened via window.open, try to close the tab. Otherwise go back.
    try {
      window.close();
    } catch {
      // ignore
    }
    navigate("/collection");
  }, [navigate]);

  const fetchAll = useCallback(async () => {
    if (!playlistId) return;
    const sb = getSupabase();
    if (!sb) return;

    setLoading(true);
    const { data: pRow } = await sb
      .from("playlists")
      .select("id,name,created_at")
      .eq("id", playlistId)
      .single();

    if (pRow?.name) setName(pRow.name);

    const list = await fetchPlaylistTracks(playlistId);
    setTracks(list);
    setLoading(false);
  }, [playlistId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const canShow = Boolean(user);
  const displayTracks = useMemo(() => (tracks.length ? tracks : []), [tracks]);

  return (
    <div
      className="fixed inset-x-0 top-0 z-[90] bg-black/45 p-3 sm:p-6"
      style={{
        bottom: "calc(10.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl ios-list shadow-2xl">
        <div className="ios-list-header flex items-center justify-between gap-2">
          <span className="truncate pr-2">{name || t("player.drawerTitle")}</span>
          <button
            type="button"
            className="shrink-0 text-[10px] font-bold"
            onClick={close}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900">
          {!canShow ? (
            <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              {t("collection.login")}
            </p>
          ) : loading ? (
            <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              Loading...
            </p>
          ) : displayTracks.length === 0 ? (
            <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              {t("playlist.empty")}
            </p>
          ) : (
            <div>
              {displayTracks.map((tr) => (
                <TrackRow
                  key={tr.id}
                  track={tr}
                  variant="compact"
                  isFavorite={false}
                  canFavorite={false}
                  onPlay={() => void playTrack(tr, displayTracks)}
                  onToggleFavorite={() => {}}
                  onOpenPlaylistMenu={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

