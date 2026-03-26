import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Heart } from "lucide-react";
import { CoverFlow } from "@/components/CoverFlow";
import { useI18n } from "@/hooks/useI18n";
import { PlaylistAddModal } from "@/components/PlaylistAddModal";
import { TrackRow } from "@/components/TrackRow";
import { fetchAllTracksFromSupabase } from "@/lib/loadTracks";
import {
  addFavorite,
  addTrackToPlaylist,
  createPlaylist,
  fetchChartTracks,
  fetchFavoriteIds,
  fetchFavoriteTracks,
  fetchPlaylists,
  removeFavorite,
  type PlaylistRow,
} from "@/lib/trackApi";
import { useAuthStore } from "@/store/useAuthStore";
import type { PlayerTrack } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";

export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const user = useAuthStore((s) => s.user);
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);
  const setHomeCatalog = useUIStore((s) => s.setHomeCatalog);

  const [notice, setNotice] = useState<string | null>(null);
  const [chart, setChart] = useState<PlayerTrack[]>([]);
  const [showAllChart, setShowAllChart] = useState(false);
  const [catalog, setCatalog] = useState<PlayerTrack[]>([]);
  const [favorites, setFavorites] = useState<PlayerTrack[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const noticeTimerRef = useRef<number | null>(null);

  const [playlistPickTrack, setPlaylistPickTrack] =
    useState<PlayerTrack | null>(null);
  const refreshCatalog = useCallback(async () => {
    const tracks = await fetchAllTracksFromSupabase();
    // Shuffle catalog order so it feels fresh on each visit.
    const shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCatalog(shuffled);
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
    void refreshCatalog();
    void refreshChart();
  }, [refreshCatalog, refreshChart]);

  useEffect(() => {
    void refreshUserLibrary();
  }, [refreshUserLibrary]);

  useEffect(() => {
    setHomeCatalog(catalog);
  }, [catalog, setHomeCatalog]);

  const previewForFlow = chart[0] ?? catalog[0] ?? null;
  const favPreview = favorites.slice(0, 5);
  const visibleChart = showAllChart ? chart : chart.slice(0, 10);

  const showNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 3200);
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

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
        setFavorites((prev) => [
          track,
          ...prev.filter((t) => t.id !== track.id),
        ]);
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

  return (
    <div>
      {notice ? (
        <div className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[95] max-w-[min(20rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-lg border border-neutral-500 bg-gradient-to-b from-[#ffffcc] to-[#f5e6a8] px-3 py-2 text-center text-[11px] font-bold text-neutral-900 shadow-lg sm:bottom-[calc(9rem+env(safe-area-inset-bottom,0px))] sm:text-[12px]">
          {notice}
        </div>
      ) : null}

      <main className="mx-auto max-w-4xl space-y-4 px-2 py-3 sm:space-y-5 sm:px-3 sm:py-4">
        <CoverFlow previewTrack={previewForFlow} />

        {/* Чарт */}
        <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg dark:border-neutral-600">
          <div className="bg-gradient-to-b from-[#91aac7] via-[#6b8fb3] to-[#3e5c82] px-3 py-2">
            <h2 className="text-center text-[13px] font-bold text-white drop-shadow-sm">
              {t("home.chartTitle")}
            </h2>
          </div>
          <div className="bg-white dark:bg-neutral-900">
            {chart.length === 0 ? (
              <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
                {t("home.chartEmpty")}
              </p>
            ) : (
              visibleChart.map((t, i) => (
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
            {chart.length > 10 ? (
              <div className="border-t border-neutral-200 p-2 text-center dark:border-neutral-700">
                <button
                  type="button"
                  className="glossy-btn !text-[11px]"
                  onClick={() => setShowAllChart((v) => !v)}
                >
                  {showAllChart ? t("home.chartLess") : t("home.chartMore")}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* Избранное → коллекция (клик по панели, не по кнопкам строки) */}
        <section
          className="cursor-pointer overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg transition hover:brightness-[1.02] focus-within:ring-2 focus-within:ring-[#2477d1] dark:border-neutral-600"
          role="link"
          tabIndex={0}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            if ((e.target as HTMLElement).closest("[data-track-row]")) return;
            void navigate("/collection");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if ((e.target as HTMLElement).closest("button")) return;
              if ((e.target as HTMLElement).closest("[data-track-row]")) return;
              void navigate("/collection");
            }
          }}
        >
          <div className="flex items-center justify-between bg-gradient-to-b from-[#91aac7] via-[#6b8fb3] to-[#3e5c82] px-3 py-2">
            <div className="flex items-center gap-2">
              <Heart
                className="h-4 w-4 text-white drop-shadow"
                fill="currentColor"
              />
              <h2 className="text-[13px] font-bold text-white drop-shadow-sm">
                {t("home.favTitle")}
              </h2>
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-white/95">
              {t("home.favGo")}
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <div className="bg-white dark:bg-neutral-900">
            {!user ? (
              <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
                {t("home.favGuest")}
              </p>
            ) : favorites.length === 0 ? (
              <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
                {t("home.favEmpty")}
              </p>
            ) : (
              favPreview.map((t) => (
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

        {/* Каталог */}
        <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg dark:border-neutral-600">
          <div className="ios-list-header">{t("home.catalogTitle")}</div>
          <div className="bg-white dark:bg-neutral-900">
            {catalog.length === 0 ? (
              <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
                {t("home.catalogEmpty")}
              </p>
            ) : (
              catalog.map((t) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  variant="compact"
                  isFavorite={favIds.has(t.id)}
                  canFavorite={Boolean(user)}
                  onPlay={() => void playTrack(t, catalog)}
                  onToggleFavorite={() => void handleToggleFavorite(t)}
                  onOpenPlaylistMenu={() => setPlaylistPickTrack(t)}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <PlaylistAddModal
        open={playlistPickTrack != null}
        track={playlistPickTrack}
        playlists={playlists}
        onClose={() => setPlaylistPickTrack(null)}
        onAdd={(id) => void handleAddToPlaylist(id)}
        onCreateAndAdd={(name) => void handleCreatePlaylistAndAdd(name)}
      />

    </div>
  );
}
