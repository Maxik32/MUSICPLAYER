import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { TrackRow } from "@/components/TrackRow";
import { PlaylistAddModal } from "@/components/PlaylistAddModal";
import {
  addFavorite,
  addTrackToPlaylist,
  createPlaylist,
  fetchFavoriteTracks,
  fetchPlaylists,
  removeFavorite,
  type PlaylistRow,
} from "@/lib/trackApi";
import { useAuthStore } from "@/store/useAuthStore";
import type { PlayerTrack } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";

const PREVIEW_COUNT = 6;

export function CollectionPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const [favorites, setFavorites] = useState<PlayerTrack[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [playlistPickTrack, setPlaylistPickTrack] =
    useState<PlayerTrack | null>(null);

  const [createPlOpen, setCreatePlOpen] = useState(false);
  const [createPlName, setCreatePlName] = useState("");

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setPlaylists([]);
      return;
    }
    const [fav, pls] = await Promise.all([
      fetchFavoriteTracks(user.id),
      fetchPlaylists(user.id),
    ]);
    setFavorites(fav);
    setPlaylists(pls);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const shownLikes = favorites.slice(0, PREVIEW_COUNT);

  const favIdSet = new Set(favorites.map((x) => x.id));

  const handleToggleFavorite = async (track: PlayerTrack) => {
    if (!user) return;
    if (favIdSet.has(track.id)) {
      await removeFavorite(user.id, track.id);
    } else {
      await addFavorite(user.id, track.id);
    }
    void refresh();
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!playlistPickTrack || !user) return;
    await addTrackToPlaylist(playlistId, playlistPickTrack.id);
    setPlaylistPickTrack(null);
    void refresh();
  };

  const handleCreatePlaylistAndAdd = async (name: string) => {
    if (!playlistPickTrack || !user) return;
    const pl = await createPlaylist(user.id, name);
    if (pl) await addTrackToPlaylist(pl.id, playlistPickTrack.id);
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
          <section className="mb-5 overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg dark:border-neutral-600">
            <div className="ios-list-header">{t("collection.likes")}</div>
            <div className="bg-white dark:bg-neutral-900">
              {favorites.length === 0 ? (
                <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
                  {t("collection.emptyLikes")}
                </p>
              ) : (
                shownLikes.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    variant="compact"
                    isFavorite={favIdSet.has(track.id)}
                    canFavorite
                    onPlay={() => void playTrack(track, favorites)}
                    onToggleFavorite={() => void handleToggleFavorite(track)}
                    onOpenPlaylistMenu={() => setPlaylistPickTrack(track)}
                  />
                ))
              )}
              {favorites.length > PREVIEW_COUNT ? (
                <div className="border-t border-[#e0e0e0] p-3 dark:border-neutral-700">
                  <NavLink
                    to="/favorites"
                    className="glossy-btn glossy-btn--primary w-full !text-[13px] !no-underline inline-flex items-center justify-center"
                  >
                    {t("collection.showAll")}
                  </NavLink>
                </div>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg dark:border-neutral-600">
            <div className="ios-list-header">{t("collection.playlists")}</div>
            <div className="polished-floor-bg px-3 py-3 dark:bg-neutral-800/80">
              <div className="mb-3">
                <button
                  type="button"
                  className="glossy-btn glossy-btn--primary w-full !text-[13px]"
                  onClick={() => {
                    setCreatePlName("");
                    setCreatePlOpen(true);
                  }}
                >
                  {t("collection.createPlaylist")}
                </button>
              </div>
              {playlists.length === 0 ? (
                <p className="text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
                  {t("collection.emptyPl")}
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {playlists.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        window.open(
                          `/playlist/${p.id}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                      className="shrink-0 w-36 rounded-xl border border-neutral-400 bg-gradient-to-b from-white via-[#f8f8f8] to-[#dcdcdc] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] active:translate-y-px dark:border-neutral-600 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900"
                    >
                      <p className="line-clamp-2 text-[12px] font-bold inset-text dark:text-neutral-100">
                        {p.name}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">
                        {p.trackCount ?? 0}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <div className="mt-6">
        <NavLink
          to="/"
          className="glossy-btn inline-block !no-underline"
        >
          {t("collection.back")}
        </NavLink>
      </div>

      {createPlOpen ? (
        <div className="fixed inset-0 z-[86] flex items-center justify-center bg-black/40 p-4">
          <div className="ios-list w-full max-w-md overflow-hidden shadow-2xl dark:bg-neutral-900">
            <div className="ios-list-header flex items-center justify-between gap-2">
              <span className="truncate pr-2">{t("collection.createPlaylist")}</span>
              <button
                type="button"
                className="shrink-0 text-[10px] font-bold"
                onClick={() => setCreatePlOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 bg-white p-4 dark:bg-neutral-900">
              <input
                value={createPlName}
                onChange={(e) => setCreatePlName(e.target.value)}
                className="inset-field"
                placeholder={t("collection.playlistNamePlaceholder")}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="glossy-btn glossy-btn--primary flex-1"
                  onClick={async () => {
                    if (!user) return;
                    const name = createPlName.trim();
                    if (!name) return;
                    const pl = await createPlaylist(user.id, name);
                    if (!pl) return;
                    setCreatePlOpen(false);
                    setCreatePlName("");
                    void refresh();
                  }}
                >
                  {t("collection.create")}
                </button>
                <button
                  type="button"
                  className="glossy-btn flex-1"
                  onClick={() => setCreatePlOpen(false)}
                >
                  {t("collection.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
