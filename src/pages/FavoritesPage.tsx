import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { PlaylistAddModal } from "@/components/PlaylistAddModal";
import { TrackRow } from "@/components/TrackRow";
import { useAuthStore } from "@/store/useAuthStore";
import type { PlayerTrack } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";
import {
  createPlaylist,
  fetchFavoriteTracks,
  fetchPlaylists,
  removeFavorite,
  addTrackToPlaylist,
  type PlaylistRow,
} from "@/lib/trackApi";

export function FavoritesPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);

  const playTrack = usePlayerStore((s) => s.playTrack);

  const [favorites, setFavorites] = useState<PlayerTrack[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [playlistPickTrack, setPlaylistPickTrack] =
    useState<PlayerTrack | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setPlaylists([]);
      return;
    }

    const [favTracks, pls] = await Promise.all([
      fetchFavoriteTracks(user.id),
      fetchPlaylists(user.id),
    ]);
    setFavorites(favTracks);
    setPlaylists(pls);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleToggleFavorite = useCallback(
    async (track: PlayerTrack) => {
      if (!user) {
        setAuthOpen(true);
        return;
      }
      await removeFavorite(user.id, track.id);
      void refresh();
    },
    [refresh, setAuthOpen, user]
  );

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!playlistPickTrack || !user) return;
    await addTrackToPlaylist(playlistId, playlistPickTrack.id);
    setPlaylistPickTrack(null);
    void refresh();
  };

  const handleCreatePlaylistAndAdd = async (name: string) => {
    if (!playlistPickTrack || !user) return;
    const pl = await createPlaylist(user.id, name);
    if (!pl) return;
    await addTrackToPlaylist(pl.id, playlistPickTrack.id);
    setPlaylistPickTrack(null);
    void refresh();
  };

  return (
    <main className="mx-auto max-w-4xl px-3 py-6">
      {!user ? (
        <div className="ios-list overflow-hidden rounded-xl dark:bg-neutral-900">
          <div className="ios-list-header">{t("collection.title")}</div>
          <div className="space-y-3 bg-white p-4 dark:bg-neutral-900">
            <p className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
              {t("collection.login")}
            </p>
            <button
              type="button"
              className="glossy-btn glossy-btn--primary"
              onClick={() => setAuthOpen(true)}
            >
              {t("top.login")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg dark:border-neutral-600">
            <div className="ios-list-header">{t("collection.likes")}</div>
            <div className="bg-white dark:bg-neutral-900">
              {favorites.length === 0 ? (
                <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
                  {t("collection.emptyLikes")}
                </p>
              ) : (
                favorites.map((tr) => (
                  <TrackRow
                    key={tr.id}
                    track={tr}
                    variant="compact"
                    isFavorite
                    canFavorite
                    onPlay={() => void playTrack(tr, favorites)}
                    onToggleFavorite={() => void handleToggleFavorite(tr)}
                    onOpenPlaylistMenu={() => setPlaylistPickTrack(tr)}
                  />
                ))
              )}
            </div>
          </section>

          <div className="mt-6 flex items-center justify-between gap-3">
            <NavLink
              to="/collection"
              className="glossy-btn inline-block !no-underline"
            >
              {t("collection.back")}
            </NavLink>
          </div>
        </>
      )}

      <PlaylistAddModal
        open={playlistPickTrack != null}
        track={playlistPickTrack}
        playlists={playlists}
        onClose={() => setPlaylistPickTrack(null)}
        onAdd={(id) => void handleAddToPlaylist(id)}
        onCreateAndAdd={(name) => void handleCreatePlaylistAndAdd(name)}
      />
    </main>
  );
}

