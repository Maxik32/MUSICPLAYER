import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BottomPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const currentTimeSec = usePlayerStore((s) => s.currentTimeSec);
  const durationSec = usePlayerStore((s) => s.durationSec);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const seek = usePlayerStore((s) => s.seek);
  const playbackError = usePlayerStore((s) => s.playbackError);
  const clearPlaybackError = usePlayerStore((s) => s.clearPlaybackError);

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const ratioFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
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

  const remaining = durationSec > 0 ? durationSec - currentTimeSec : 0;
  const canControl = Boolean(currentTrack?.audioUrl);
  const pct = `${Math.round(progress * 100)}%`;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-500 bg-gradient-to-b from-[#ececec] to-[#c8c8c8] shadow-[0_-2px_8px_rgba(0,0,0,0.2)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-3 py-2">
        {playbackError ? (
          <div className="flex items-start gap-2 rounded border border-red-400/80 bg-red-100/90 px-2 py-1.5 text-[11px] font-bold text-red-900 shadow-inner">
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
          ref={trackRef}
          className="ios-progress cursor-pointer select-none"
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
          <div className="ios-progress__fill relative" style={{ width: pct }}>
            {canControl ? (
              <div
                className="ios-progress__thumb"
                style={{ left: "100%" }}
                aria-hidden
              />
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold text-neutral-800 inset-text">
          <span>{formatTime(currentTimeSec)}</span>
          <span>
            {durationSec > 0 && remaining >= 0
              ? `-${formatTime(remaining)}`
              : "—:—"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-neutral-400 bg-neutral-300 shadow-inner">
            {currentTrack?.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-neutral-500">
                ♪
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold inset-text">
              {currentTrack?.title ?? "Nothing playing"}
            </p>
            <p className="truncate text-xs font-semibold text-neutral-600">
              {currentTrack?.artist ?? "Pick a track"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="glossy-btn !px-2 !py-2"
              aria-label="Previous"
              disabled={!canControl}
              onClick={() => prevTrack()}
            >
              <SkipBack className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="glossy-btn glossy-btn--primary !px-3 !py-2"
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={!canControl}
              onClick={() => void togglePlay()}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <Play className="h-5 w-5 pl-0.5" strokeWidth={2.5} />
              )}
            </button>
            <button
              type="button"
              className="glossy-btn !px-2 !py-2"
              aria-label="Next"
              disabled={!canControl}
              onClick={() => nextTrack()}
            >
              <SkipForward className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
