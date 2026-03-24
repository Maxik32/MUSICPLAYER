import { Heart, ListMusic, Pause, Play } from "lucide-react";
import { splitArtists } from "@/lib/artists";
import type { PlayerTrack } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useNavigate } from "react-router-dom";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatListens(n: number | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function TrackRow({
  track,
  index,
  variant = "default",
  isFavorite,
  canFavorite,
  onPlay,
  onToggleFavorite,
  onOpenPlaylistMenu,
}: {
  track: PlayerTrack;
  index?: number;
  variant?: "default" | "chart" | "compact";
  isFavorite: boolean;
  canFavorite: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onOpenPlaylistMenu: () => void;
}) {
  const navigate = useNavigate();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isUuid = UUID_RE.test(track.id);
  const showHeart = canFavorite && isUuid;
  const isThisPlaying =
    Boolean(isPlaying && currentTrack?.id && currentTrack.id === track.id);
  const artistParts = splitArtists(track.artist);

  const openTrackPage = () => {
    onPlay();
    navigate(`/track/${track.id}`);
  };

  const playBtnClass =
    "bg-gradient-to-b from-white to-[#ddd] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.2)]";

  const playIconClass = "text-neutral-800";

  return (
    <div
      className={`flex items-center gap-2 border-b border-[#e0e0e0] bg-white px-2 py-2 last:border-b-0 dark:border-neutral-700 dark:bg-neutral-900 ${
        variant === "chart" ? "min-h-[52px]" : ""
      }`}
      data-track-row
      role="link"
      tabIndex={0}
      onClick={openTrackPage}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTrackPage();
        }
      }}
    >
      {index != null ? (
        <span className="w-6 shrink-0 text-center text-[11px] font-bold text-neutral-500 inset-text">
          {index}
        </span>
      ) : null}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-400 ${playBtnClass}`}
        aria-label={isThisPlaying ? "Пауза" : "Играть"}
      >
        {isThisPlaying ? (
          <Pause className={`h-4 w-4 ${playIconClass}`} fill="currentColor" />
        ) : (
          <Play className={`h-4 w-4 pl-0.5 ${playIconClass}`} fill="currentColor" />
        )}
      </button>

      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13px] font-bold leading-tight inset-text">
          {track.title}
        </p>
        <p className="truncate text-[11px] font-semibold text-neutral-600">
          {artistParts.map((artist, idx) => (
            <span key={`${track.id}-${artist}`}>
              <button
                type="button"
                className="max-w-[10rem] truncate align-bottom text-left text-[11px] font-semibold text-neutral-600 underline-offset-2 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/artist/${encodeURIComponent(artist)}`);
                }}
              >
                {artist}
              </button>
              {idx < artistParts.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      </div>

      {variant === "chart" ? (
        <span className="shrink-0 rounded border border-neutral-400 bg-gradient-to-b from-[#e8e8e8] via-[#e0e0e0] to-[#d0d0d0] px-1.5 py-0.5 text-[10px] font-bold text-neutral-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {formatListens(track.playCount)} ▶
        </span>
      ) : null}

      <div className="flex shrink-0 items-center gap-0.5">
        {showHeart ? (
          <button
            type="button"
            className={`rounded p-1.5 ${
              isFavorite
                ? "text-red-600 drop-shadow-sm"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
          >
            <Heart
              className="h-4 w-4"
              fill={isFavorite ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </button>
        ) : null}
        {canFavorite && isUuid ? (
          <button
            type="button"
            className="rounded p-1.5 text-neutral-500 hover:text-neutral-800"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPlaylistMenu();
            }}
            aria-label="В плейлист"
          >
            <ListMusic className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
