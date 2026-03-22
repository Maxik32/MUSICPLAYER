import { useCallback, useEffect, useMemo, useState } from "react";
import { BottomPlayer } from "@/components/BottomPlayer";
import { AuthModal } from "@/components/AuthModal";
import { PlaylistAddModal } from "@/components/PlaylistAddModal";
import { PlaylistViewModal } from "@/components/PlaylistViewModal";
import { TopBar } from "@/components/TopBar";
import { TrackRow } from "@/components/TrackRow";
import { loadAllTracks } from "@/lib/loadTracks";
import {
  addFavorite,
  addTrackToPlaylist,
  createPlaylist,
  fetchChartTracks,
  fetchFavoriteIds,
  fetchFavoriteTracks,
  fetchPlaylistTracks,
  fetchPlaylists,
  removeFavorite,
  type PlaylistRow,
} from "@/lib/trackApi";
import { useAuthStore } from "@/store/useAuthStore";
import type { PlayerTrack } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";

export function HomePage() {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [chart, setChart] = useState<PlayerTrack[]>([]);
  const [catalog, setCatalog] = useState<PlayerTrack[]>([]);
  const [favorites, setFavorites] = useState<PlayerTrack[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);

  const [playlistPickTrack, setPlaylistPickTrack] = useState<PlayerTrack | null>(
    null
  );
  const [viewPlaylist, setViewPlaylist] = useState<{
    name: string;
    tracks: PlayerTrack[];
  } | null>(null);

  const refreshCatalog = useCallback(async () => {
    const { tracks } = await loadAllTracks();
    setCatalog(tracks);
  }, []);

  const refreshChart = useCallback(async () => {
    setChart(await fetchChartTracks(30));
  }, []);

  const refreshUserLibrary = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavIds(new Set());
      setPlaylists([]);
      return;
    }
    const [favTracks, ids, pls] = await Promise.all([
      fetchFavoriteTracks(user.id),
      fetchFavoriteIds(user.id),
      fetchPlaylists(user.id),
    ]);
    setFavorites(favTracks);
    setFavIds(ids);
    setPlaylists(pls);
  }, [user]);

  useEffect(() => {
    const unsub = useAuthStore.getState().init();
    return unsub;
  }, []);

  useEffect(() => {
    void refreshCatalog();
    void refreshChart();
  }, [refreshCatalog, refreshChart]);

  useEffect(() => {
    void refreshUserLibrary();
  }, [refreshUserLibrary]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q)
    );
  }, [catalog, search]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3200);
  };

  const handleToggleFavorite = async (track: PlayerTrack) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const on = favIds.has(track.id);
    if (on) {
      const ok = await removeFavorite(user.id, track.id);
      if (ok) {
        setFavIds((prev) => {
          const n = new Set(prev);
          n.delete(track.id);
          return n;
        });
        setFavorites((prev) => prev.filter((t) => t.id !== track.id));
        showNotice("Убрано из избранного");
      }
    } else {
      const ok = await addFavorite(user.id, track.id);
      if (ok) {
        setFavIds((prev) => new Set(prev).add(track.id));
        setFavorites((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
        showNotice("В избранном");
      }
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!playlistPickTrack || !user) return;
    const ok = await addTrackToPlaylist(playlistId, playlistPickTrack.id);
    if (ok) {
      showNotice("Добавлено в плейлист");
      void refreshUserLibrary();
    } else {
      showNotice("Не удалось добавить (уже в списке?)");
    }
    setPlaylistPickTrack(null);
  };

  const handleCreatePlaylistAndAdd = async (name: string) => {
    if (!playlistPickTrack || !user) return;
    const pl = await createPlaylist(user.id, name);
    if (!pl) {
      showNotice("Ошибка создания плейлиста");
      return;
    }
    await addTrackToPlaylist(pl.id, playlistPickTrack.id);
    showNotice("Плейлист создан");
    void refreshUserLibrary();
    setPlaylistPickTrack(null);
  };

  const openPlaylist = async (p: PlaylistRow) => {
    const tracks = await fetchPlaylistTracks(p.id);
    setViewPlaylist({ name: p.name, tracks });
  };

  return (
    <div className="min-h-screen pb-40 dark-linen-bg font-ios">
      <TopBar
        search={search}
        onSearch={setSearch}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {notice ? (
        <div className="fixed bottom-28 left-1/2 z-[95] max-w-sm -translate-x-1/2 rounded-lg border border-neutral-500 bg-gradient-to-b from-[#ffffcc] to-[#f5e6a8] px-4 py-2 text-center text-[12px] font-bold text-neutral-900 shadow-lg">
          {notice}
        </div>
      ) : null}

      <main className="mx-auto max-w-4xl space-y-5 px-3 py-4">
        {/* Чарт */}
        <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg">
          <div className="metallic-bg--compact px-3 py-2">
            <h2 className="text-center text-[13px] font-bold inset-text--on-metal">
              Чарт · топ-30 по прослушиваниям
            </h2>
          </div>
          <div className="bg-white">
            {chart.length === 0 ? (
              <p className="p-4 text-center text-[12px] font-semibold text-neutral-600">
                Чарт пуст. Добавьте треки в Supabase и включите миграцию{" "}
                <code className="rounded bg-neutral-100 px-1 text-[10px]">
                  002_listen_chart_favorites.sql
                </code>
                — тогда счётчик начнёт расти при каждом запуске трека (UUID).
              </p>
            ) : (
              chart.map((t, i) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  index={i + 1}
                  variant="chart"
                  isFavorite={favIds.has(t.id)}
                  canFavorite={Boolean(user)}
                  onPlay={() => void playTrack(t, chart)}
                  onToggleFavorite={() => void handleToggleFavorite(t)}
                  onOpenPlaylistMenu={() => setPlaylistPickTrack(t)}
                />
              ))
            )}
          </div>
        </section>

        {/* Избранное */}
        {user ? (
          <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg">
            <div className="ios-list-header">Избранное</div>
            <div className="bg-white">
              {favorites.length === 0 ? (
                <p className="p-4 text-center text-[12px] font-semibold text-neutral-600">
                  Нажмите ♥ у трека из каталога или чарта.
                </p>
              ) : (
                favorites.map((t) => (
                  <TrackRow
                    key={t.id}
                    track={t}
                    variant="compact"
                    isFavorite
                    canFavorite
                    onPlay={() => void playTrack(t, favorites)}
                    onToggleFavorite={() => void handleToggleFavorite(t)}
                    onOpenPlaylistMenu={() => setPlaylistPickTrack(t)}
                  />
                ))
              )}
            </div>
          </section>
        ) : null}

        {/* Плейлисты */}
        {user ? (
          <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg">
            <div className="ios-list-header">Мои плейлисты</div>
            <div className="polished-floor-bg px-3 py-3">
              {playlists.length === 0 ? (
                <p className="text-center text-[12px] font-semibold text-neutral-600">
                  Создайте плейлист через кнопку «В плейлист» у любого трека.
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1 pt-1 [scrollbar-width:thin]">
                  {playlists.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => void openPlaylist(p)}
                      className="shrink-0 w-36 rounded-xl border border-neutral-400 bg-gradient-to-b from-white via-[#f8f8f8] to-[#dcdcdc] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.15)] active:translate-y-px"
                    >
                      <p className="line-clamp-2 text-[12px] font-bold inset-text">
                        {p.name}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-neutral-600">
                        {p.trackCount ?? 0} треков
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* Каталог */}
        <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg">
          <div className="ios-list-header">
            Каталог · Supabase + user-tracks.json + демо
          </div>
          <div className="bg-white">
            {filteredCatalog.map((t) => (
              <TrackRow
                key={t.id}
                track={t}
                variant="compact"
                isFavorite={favIds.has(t.id)}
                canFavorite={Boolean(user)}
                onPlay={() => void playTrack(t, filteredCatalog)}
                onToggleFavorite={() => void handleToggleFavorite(t)}
                onOpenPlaylistMenu={() => setPlaylistPickTrack(t)}
              />
            ))}
          </div>
        </section>
      </main>

      <BottomPlayer />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <PlaylistAddModal
        open={playlistPickTrack != null}
        track={playlistPickTrack}
        playlists={playlists}
        onClose={() => setPlaylistPickTrack(null)}
        onAdd={(id) => void handleAddToPlaylist(id)}
        onCreateAndAdd={(name) => void handleCreatePlaylistAndAdd(name)}
      />

      <PlaylistViewModal
        open={viewPlaylist != null}
        name={viewPlaylist?.name ?? ""}
        tracks={viewPlaylist?.tracks ?? []}
        onClose={() => setViewPlaylist(null)}
        onPlayTrack={(t) => {
          const list = viewPlaylist?.tracks ?? [];
          void playTrack(t, list);
          setViewPlaylist(null);
        }}
      />
    </div>
  );
}
