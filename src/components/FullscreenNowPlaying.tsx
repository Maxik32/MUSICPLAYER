import {
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FullscreenNowPlaying() {
  const { t } = useI18n();
  const open = useUIStore((s) => s.nowPlayingOpen);
  const setOpen = useUIStore((s) => s.setNowPlayingOpen);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const currentTimeSec = usePlayerStore((s) => s.currentTimeSec);
  const durationSec = usePlayerStore((s) => s.durationSec);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const prevTrack = usePlayerStore((s) => s.prevTrack);
  const seek = usePlayerStore((s) => s.seek);

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
    const onMove = (e: PointerEvent) => seek(ratioFromClientX(e.clientX));
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const can = Boolean(currentTrack?.audioUrl);
  const remaining = durationSec > 0 ? durationSec - currentTimeSec : 0;
  const pct = `${Math.round(progress * 100)}%`;
  const albumLabel =
    currentTrack?.album?.trim() ||
    currentTrack?.description?.trim() ||
    "—";

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-neutral-950"
      role="dialog"
      aria-modal="true"
      aria-label={t("now.title")}
    >
      <header className="metallic-bg flex items-center justify-between px-3 py-2">
        <span className="text-sm font-bold inset-text--on-metal">
          {t("now.title")}
        </span>
        <button
          type="button"
          className="glossy-btn !px-2 !py-1 !text-[11px]"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("now.close")}</span>
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 sm:flex-row sm:items-center sm:justify-center sm:gap-10 sm:p-8">
        <div className="mx-auto flex shrink-0 flex-col items-center sm:mx-0">
          <div
            className="cover-reflect overflow-hidden rounded-lg border-2 border-neutral-400 bg-gradient-to-br from-[#6eb6ff] to-[#1159b3] shadow-xl dark:border-neutral-600"
            style={{ width: 220, height: 220 }}
          >
            {currentTrack?.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 max-w-md flex-1 flex-col justify-center text-center sm:text-left">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            {currentTrack?.title ?? t("player.nothing")}
          </h2>
          <p className="mt-1 text-lg font-semibold text-neutral-500 dark:text-neutral-400">
            {currentTrack?.artist ?? t("player.pick")}
          </p>
          <p className="mt-2 text-sm font-semibold text-neutral-500 dark:text-neutral-500">
            {t("now.album")}: {albumLabel}
          </p>
        </div>
      </div>

      <div className="border-t border-neutral-400 bg-gradient-to-b from-[#fafafa] to-[#e4e4e4] px-4 py-4 dark:border-neutral-700 dark:from-neutral-900 dark:to-neutral-950">
        <div className="mx-auto max-w-2xl space-y-3">
          <div
            ref={trackRef}
            className="fs-progress cursor-pointer select-none"
            role="slider"
            aria-valuenow={Math.round(progress * 100)}
            onPointerDown={(e) => {
              if (!can) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              setDragging(true);
              seek(ratioFromClientX(e.clientX));
            }}
          >
            <div className="fs-progress__fill relative" style={{ width: pct }}>
              {can ? (
                <div
                  className="fs-progress__thumb"
                  style={{ left: "100%" }}
                  aria-hidden
                />
              ) : null}
            </div>
          </div>
          <div className="flex justify-between text-sm font-bold text-neutral-800 dark:text-neutral-200">
            <span>{formatTime(currentTimeSec)}</span>
            <span>
              {durationSec > 0 && remaining >= 0
                ? `-${formatTime(remaining)}`
                : "—:—"}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className={`glossy-btn !px-3 !py-2 ${shuffle ? "glossy-btn--primary" : ""}`}
              disabled={!can}
              onClick={() => toggleShuffle()}
              aria-pressed={shuffle}
              title={t("player.shuffle")}
            >
              <Shuffle className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="glossy-btn !px-3 !py-2"
              disabled={!can}
              onClick={() => prevTrack()}
            >
              <SkipBack className="h-6 w-6" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="glossy-btn glossy-btn--primary !px-5 !py-3"
              disabled={!can}
              onClick={() => void togglePlay()}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" strokeWidth={2.5} />
              ) : (
                <Play className="h-8 w-8 pl-1" strokeWidth={2.5} />
              )}
            </button>
            <button
              type="button"
              className="glossy-btn !px-3 !py-2"
              disabled={!can}
              onClick={() => nextTrack()}
            >
              <SkipForward className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
