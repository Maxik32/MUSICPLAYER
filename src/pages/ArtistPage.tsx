import { useEffect, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { TrackRow } from "@/components/TrackRow";
import { useI18n } from "@/hooks/useI18n";
import { artistMatches } from "@/lib/artists";
import { fetchAllTracksFromSupabase } from "@/lib/loadTracks";
import type { PlayerTrack } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";

export function ArtistPage() {
  const { t } = useI18n();
  const { artistName } = useParams();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const [allTracks, setAllTracks] = useState<PlayerTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const decodedArtist = useMemo(() => {
    try {
      return decodeURIComponent(artistName ?? "").trim();
    } catch {
      return (artistName ?? "").trim();
    }
  }, [artistName]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const tracks = await fetchAllTracksFromSupabase();
      if (cancelled) return;
      setAllTracks(tracks);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tracks = useMemo(
    () => allTracks.filter((tr) => artistMatches(tr.artist, decodedArtist)),
    [allTracks, decodedArtist]
  );

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-3 py-6">
      <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg dark:border-neutral-600">
        <div className="ios-list-header">{t("artist.title")}</div>
        <div className="bg-white p-4 text-center dark:bg-neutral-900">
          <h1 className="text-[20px] font-bold text-neutral-900 dark:text-neutral-100">
            {decodedArtist || "—"}
          </h1>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-neutral-400/90 shadow-lg dark:border-neutral-600">
        <div className="ios-list-header">{t("artist.tracks")}</div>
        <div className="bg-white dark:bg-neutral-900">
          {loading ? (
            <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              …
            </p>
          ) : tracks.length === 0 ? (
            <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              {t("artist.empty")}
            </p>
          ) : (
            tracks.map((tr) => (
              <TrackRow
                key={tr.id}
                track={tr}
                variant="compact"
                isFavorite={false}
                canFavorite={false}
                onPlay={() => void playTrack(tr, tracks)}
                onToggleFavorite={() => {}}
                onOpenPlaylistMenu={() => {}}
              />
            ))
          )}
        </div>
      </section>

      <NavLink to="/" className="glossy-btn inline-block !no-underline">
        {t("artist.back")}
      </NavLink>
    </main>
  );
}
