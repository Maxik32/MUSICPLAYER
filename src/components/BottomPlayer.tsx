import {
  Album,
  Heart,
  ListPlus,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import {
  addFavorite,
  fetchFavoriteIds,
  removeFavorite,
} from "@/lib/trackApi";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const BLUE_GRADIENT_TOP = "#91aac7";
const BLUE_GRADIENT_BOTTOM = "#3e5c82";
const WHEEL_ICON =
  "text-[#3c3c3c] hover:text-[#1a1a1a] disabled:opacity-35";

/** Обложка, «колесо» и вертикальная громкость — одна высота; «экран» не ниже этого блока. */
const BLOCK_H =
  "h-16 w-16 min-h-16 min-w-16 min-[381px]:h-[4.5rem] min-[381px]:w-[4.5rem] min-[381px]:min-h-[4.5rem] min-[381px]:min-w-[4.5rem] sm:h-24 sm:w-24 sm:min-h-[6rem] sm:min-w-[6rem] md:h-[7.25rem] md:w-[7.25rem] md:min-h-[7.25rem] md:min-w-[7.25rem]";
const VOL_TRACK_H =
  "h-16 min-[381px]:h-[4.5rem] sm:h-24 md:h-[7.25rem]";
const SCREEN_MIN_H =
  "min-h-16 min-[381px]:min-h-[4.5rem] sm:min-h-24 md:min-h-[7.25rem]";

function VerticalVolume({
  value,
  onChange,
  label,
  trackHeightClass,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  trackHeightClass: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientY = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = 1 - (clientY - rect.top) / rect.height;
      onChange(Math.max(0, Math.min(1, ratio)));
    },
    [onChange]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      setFromClientY(e.clientY);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setFromClientY]);

  const pct = Math.round(value * 100);

  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center"
      role="group"
      aria-label={label}
    >
      <div
        ref={trackRef}
        className={`relative w-[9px] cursor-pointer touch-none rounded-full border border-[#b0b5bd] bg-[#e4e6ea] shadow-[inset_0_2px_5px_rgba(0,0,0,0.12)] sm:w-[10px] ${trackHeightClass}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          setFromClientY(e.clientY);
        }}
      >
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 rounded-b-full shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(0deg, ${BLUE_GRADIENT_BOTTOM} 0%, #6b8fb3 50%, ${BLUE_GRADIENT_TOP} 100%)`,
            borderBottomLeftRadius: 9999,
            borderBottomRightRadius: 9999,
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 h-[11px] w-[11px] -translate-x-1/2 rounded-full border border-[#9a9a9a] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] sm:h-3 sm:w-3"
          style={{
            bottom: `max(0px, min(calc(100% - 6px), calc(${pct}% - 5.5px)))`,
          }}
        />
      </div>
    </div>
  );
}

export function BottomPlayer() {
  const { t } = useI18n();
  const setNowPlayingOpen = useUIStore((s) => s.setNowPlayingOpen);
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);
  const setPlaylistModalTrack = useUIStore((s) => s.setPlaylistModalTrack);
  const setPlayerToast = useUIStore((s) => s.setPlayerToast);

  const user = useAuthStore((s) => s.user);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const currentTimeSec = usePlayerStore((s) => s.currentTimeSec);
  const durationSec = usePlayerStore((s) => s.durationSec);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const volume = usePlayerStore((s) => s.volume);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleRepeat = usePlayerStore((s) => s.toggleRepeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const playbackError = usePlayerStore((s) => s.playbackError);
  const clearPlaybackError = usePlayerStore((s) => s.clearPlaybackError);

  const screenBarRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavIds(new Set());
      return;
    }
    void fetchFavoriteIds(user.id).then(setFavIds);
  }, [user, currentTrack?.id]);

  const ratioFromClientX = useCallback((clientX: number) => {
    const el = screenBarRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      seek(ratioFromClientX(e.clientX));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, ratioFromClientX, seek]);

  const canControl = Boolean(currentTrack?.audioUrl);
  const pct = `${Math.round(progress * 100)}%`;
  const remaining = durationSec > 0 ? durationSec - currentTimeSec : 0;
  const isFav = currentTrack ? favIds.has(currentTrack.id) : false;

  const openPlaylist = () => {
    if (!currentTrack) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setPlaylistModalTrack(currentTrack);
  };

  const toggleFavorite = async () => {
    if (!currentTrack) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const on = favIds.has(currentTrack.id);
    if (on) {
      const ok = await removeFavorite(user.id, currentTrack.id);
      if (ok) {
        setFavIds((prev) => {
          const n = new Set(prev);
          n.delete(currentTrack.id);
          return n;
        });
        setPlayerToast(t("player.toastFavOff"));
      }
    } else {
      const ok = await addFavorite(user.id, currentTrack.id);
      if (ok) {
        setFavIds((prev) => new Set(prev).add(currentTrack.id));
        setPlayerToast(t("player.toastFavOn"));
      }
    }
  };

  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#9ca3af] text-neutral-900 shadow-[0_-3px_14px_rgba(0,0,0,0.12)] max-sm:rounded-t-2xl max-sm:border-x max-sm:border-b-0"
      style={{
        colorScheme: "light",
        background: "linear-gradient(180deg, #d8dce3 0%, #c4c9d2 45%, #b6bcc6 100%)",
        paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mx-auto max-w-4xl px-2 pb-1.5 pt-1 sm:px-3 sm:pb-2 sm:pt-1.5">
        {playbackError ? (
          <div className="mb-1.5 flex items-start gap-2 rounded-lg border border-red-400/80 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-900 shadow-inner sm:mb-2 sm:py-1.5 sm:text-[11px]">
            <span className="min-w-0 flex-1 leading-snug">{playbackError}</span>
            <button
              type="button"
              className="shrink-0 rounded border border-red-400 bg-gradient-to-b from-white to-red-50 px-2 py-0.5 text-[10px] font-bold text-red-900"
              onClick={() => clearPlaybackError()}
            >
              OK
            </button>
          </div>
        ) : null}

        <div
          className="flex items-stretch gap-1.5 rounded-2xl border border-[#a8adb6] p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] max-sm:gap-1 max-sm:p-1 sm:gap-2 sm:p-2 md:gap-2.5 md:p-2.5"
          style={{
            background:
              "linear-gradient(180deg, #eef0f4 0%, #e2e5eb 35%, #d5d9e1 70%, #cdd2db 100%)",
          }}
        >
          {/* Обложка */}
          <div
            className={`hidden sm:block relative box-border shrink-0 overflow-hidden rounded-xl border border-[#a8adb6] bg-gradient-to-b from-[#f4f5f7] to-[#dce0e8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)] ${BLOCK_H}`}
          >
            {currentTrack?.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                <Album
                  className="h-[32%] w-[32%] max-h-7 max-w-7 sm:max-h-8 sm:max-w-8"
                  strokeWidth={1.4}
                  aria-hidden
                />
              </div>
            )}
          </div>

          {/* Click wheel */}
          <div
            className={`relative mx-auto box-border shrink-0 overflow-hidden rounded-full border-2 border-[#c5c9d1] bg-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.05),0_2px_6px_rgba(0,0,0,0.06)] ${BLOCK_H}`}
          >
            <div
              className="absolute left-1/2 top-1/2 h-[30%] w-[30%] min-h-[1.5rem] min-w-[1.5rem] max-h-[2.1rem] max-w-[2.1rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d8dce3] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] sm:max-h-[2.35rem] sm:max-w-[2.35rem] md:max-h-[2.5rem] md:max-w-[2.5rem]"
              style={{
                background: "linear-gradient(180deg, #f7f8fa 0%, #e8eaef 100%)",
              }}
              aria-hidden
            />
            <button
              type="button"
              className={`absolute left-1/2 top-0.5 z-10 flex h-6 w-10 -translate-x-1/2 items-center justify-center rounded-full border-0 bg-transparent max-[380px]:h-5 max-[380px]:w-9 ${WHEEL_ICON} ${shuffle ? "!text-[#3e5c82]" : ""}`}
              aria-label={t("player.shuffle")}
              aria-pressed={shuffle}
              disabled={!canControl}
              onClick={() => toggleShuffle()}
            >
              <Shuffle className="h-3.5 w-3.5" strokeWidth={2.1} />
            </button>
            <button
              type="button"
              className={`absolute bottom-0.5 left-1/2 z-10 flex h-6 w-11 -translate-x-1/2 items-center justify-center rounded-full border-0 bg-transparent max-[380px]:h-5 max-[380px]:w-10 ${WHEEL_ICON}`}
              aria-label={isPlaying ? t("player.pause") : t("player.play")}
              disabled={!canControl}
              onClick={() => void togglePlay()}
            >
              {isPlaying ? (
                <Pause
                  className="h-[15px] w-[15px]"
                  fill="currentColor"
                  strokeWidth={2}
                />
              ) : (
                <Play
                  className="h-[15px] w-[15px] translate-x-px"
                  fill="currentColor"
                  strokeWidth={2}
                />
              )}
            </button>
            <button
              type="button"
              className={`absolute left-0.5 top-1/2 z-10 flex h-11 w-7 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent max-[380px]:h-10 max-[380px]:w-6 ${WHEEL_ICON}`}
              aria-label={t("player.prev")}
              disabled={!canControl}
              onClick={() => prevTrack()}
            >
              <SkipBack className="h-[15px] w-[15px]" strokeWidth={2.1} />
            </button>
            <button
              type="button"
              className={`absolute right-0.5 top-1/2 z-10 flex h-11 w-7 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent max-[380px]:h-10 max-[380px]:w-6 ${WHEEL_ICON}`}
              aria-label={t("player.next")}
              disabled={!canControl}
              onClick={() => nextTrack()}
            >
              <SkipForward className="h-[15px] w-[15px]" strokeWidth={2.1} />
            </button>
          </div>

          {/* Экран */}
          <div
            className={`flex min-w-0 flex-1 flex-col justify-center self-stretch ${SCREEN_MIN_H}`}
          >
            <div
              className="flex h-full min-h-0 flex-col rounded-xl border border-[#c8ccd4] px-2 pb-1.5 pt-1 shadow-[inset_0_3px_10px_rgba(0,0,0,0.08)] sm:px-2.5 sm:pb-2 sm:pt-1.5 md:px-3 md:pt-2"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f4f5f7 100%)",
              }}
            >
              <div className="mb-0.5 flex items-center justify-between gap-1.5 sm:mb-1 sm:gap-2">
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#d0d4dc] bg-gradient-to-b from-white to-[#eceef2] text-[#3c3c3c] shadow-sm transition hover:brightness-[1.02] active:translate-y-px disabled:opacity-35 max-[380px]:h-6 max-[380px]:w-6 sm:h-8 sm:w-8"
                  aria-label={t("player.addToPlaylist")}
                  disabled={!currentTrack}
                  onClick={openPlaylist}
                >
                  <ListPlus className="h-3.5 w-3.5 max-[380px]:h-3 max-[380px]:w-3 sm:h-4 sm:w-4" strokeWidth={2.1} />
                </button>
                <button
                  type="button"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#d0d4dc] bg-gradient-to-b from-white to-[#eceef2] shadow-sm transition hover:brightness-[1.02] active:translate-y-px disabled:opacity-35 max-[380px]:h-6 max-[380px]:w-6 sm:h-8 sm:w-8 ${repeat ? "text-[#3e5c82]" : "text-[#3c3c3c]"}`}
                  aria-label={t("player.repeat")}
                  aria-pressed={repeat}
                  disabled={!canControl}
                  onClick={() => toggleRepeat()}
                >
                  <Repeat className="h-3.5 w-3.5 max-[380px]:h-3 max-[380px]:w-3 sm:h-4 sm:w-4" strokeWidth={2.1} />
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#d0d4dc] bg-gradient-to-b from-white to-[#eceef2] shadow-sm transition hover:brightness-[1.02] active:translate-y-px disabled:opacity-35 max-[380px]:h-6 max-[380px]:w-6 sm:h-8 sm:w-8"
                  aria-label={
                    isFav ? t("player.unfavorite") : t("player.favorite")
                  }
                  disabled={!currentTrack}
                  onClick={() => void toggleFavorite()}
                >
                  <Heart
                    className="h-3.5 w-3.5 max-[380px]:h-3 max-[380px]:w-3 sm:h-4 sm:w-4"
                    strokeWidth={2.1}
                    fill={isFav ? "#ff3b30" : "none"}
                    stroke={isFav ? "#ff3b30" : "#3c3c3c"}
                  />
                </button>
              </div>
              <button
                type="button"
                className="min-h-0 w-full flex-1 text-center disabled:cursor-default"
                disabled={!canControl}
                onClick={() => canControl && setNowPlayingOpen(true)}
              >
                <p className="truncate text-[11px] font-bold leading-tight text-neutral-900 sm:text-[13px] md:text-[14px]">
                  {currentTrack?.title ?? t("player.nothing")}
                </p>
                <p className="mt-0.5 truncate text-[10px] font-medium text-neutral-600 sm:text-[11px]">
                  {currentTrack?.artist ?? t("player.pick")}
                </p>
              </button>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-[9px] font-semibold tabular-nums text-neutral-500 sm:mt-1 sm:text-[10px]">
                <span>{formatTime(currentTimeSec)}</span>
                <span>
                  {durationSec > 0 && remaining >= 0
                    ? `-${formatTime(remaining)}`
                    : "—:—"}
                </span>
              </div>
              <div
                ref={screenBarRef}
                className="relative mt-0.5 h-1.5 cursor-pointer select-none rounded-full border border-[#c5c9d1] bg-[#e8eaee] sm:mt-1 sm:h-2"
                style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)" }}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                aria-label="Playback position"
                onPointerDown={(e) => {
                  if (!canControl) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragging(true);
                  seek(ratioFromClientX(e.clientX));
                }}
              >
                <div
                  className="pointer-events-none absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: pct,
                    background: `linear-gradient(180deg, ${BLUE_GRADIENT_TOP} 0%, #6b8fb3 50%, ${BLUE_GRADIENT_BOTTOM} 100%)`,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                  }}
                />
                <div
                  className="pointer-events-none absolute top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#b0b5bc] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] sm:h-3 sm:w-3"
                  style={{ left: pct }}
                />
              </div>
            </div>
          </div>

          <VerticalVolume
            value={volume}
            onChange={setVolume}
            label={t("player.volume")}
            trackHeightClass={VOL_TRACK_H}
          />
        </div>
      </div>
    </footer>
  );
}
