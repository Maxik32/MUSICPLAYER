import { useEffect, useState } from "react";
import { Album } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { splitArtists } from "@/lib/artists";
import { useI18n } from "@/hooks/useI18n";
import { getSupabase } from "@/lib/supabaseClient";
import { TRACKS_SELECT, normalizeTrackRow } from "@/lib/loadTracks";
import type { PlayerTrack } from "@/store/usePlayerStore";

export function TrackPage() {
  const { t } = useI18n();
  const { trackId } = useParams();
  const navigate = useNavigate();

  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackId) {
      setError("Track id is missing");
      setLoading(false);
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      setError("Supabase is not configured");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      const { data, error: sbError } = await sb
        .from("tracks")
        .select(TRACKS_SELECT)
        .eq("id", trackId)
        .single();

      if (cancelled) return;

      if (sbError) {
        setError(sbError.message);
        setLoading(false);
        return;
      }

      const normalized = data ? normalizeTrackRow(data) : null;
      setTrack(normalized);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [trackId]);

  return (
    <main className="mx-auto max-w-4xl px-3 py-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative w-[min(22rem,92vw)] aspect-square overflow-hidden rounded-2xl border border-neutral-300 bg-gradient-to-b from-[#91aac7] via-[#6b8fb3] to-[#3e5c82] shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
          {track?.coverUrl ? (
            <img
              src={track.coverUrl}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : loading ? (
            <div className="flex h-full w-full items-center justify-center text-neutral-600">
              {t("player.nothing")}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-600">
              <Album className="h-20 w-20" strokeWidth={1.4} aria-hidden />
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-4 text-[13px] font-semibold text-red-600">
            {error}
          </p>
        ) : null}

        {track ? (
          <>
            <h1 className="mt-5 text-[18px] font-bold leading-snug text-neutral-900">
              {track.title}
            </h1>
            <p className="mt-1 text-[13px] font-semibold text-neutral-600">
              {splitArtists(track.artist).map((artist, idx, arr) => (
                <span key={`${track.id}-${artist}`}>
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-neutral-600 underline-offset-2 hover:underline"
                    onClick={() => navigate(`/artist/${encodeURIComponent(artist)}`)}
                  >
                    {artist}
                  </button>
                  {idx < arr.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}

