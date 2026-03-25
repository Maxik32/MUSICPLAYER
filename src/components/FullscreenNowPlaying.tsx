import { X } from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";

export function FullscreenNowPlaying() {
  const { t } = useI18n();
  const open = useUIStore((s) => s.nowPlayingOpen);
  const setOpen = useUIStore((s) => s.setNowPlayingOpen);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[200] flex flex-col bg-white dark:bg-neutral-950"
      style={{
        // Keep the fixed BottomPlayer visible (it lives at bottom with z-50).
        bottom: "calc(10.5rem + env(safe-area-inset-bottom, 0px))",
      }}
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
            className="cover-reflect overflow-hidden rounded-lg border-2 border-neutral-400 shadow-xl dark:border-neutral-600"
            style={{
              width: 220,
              height: 220,
              background:
                "linear-gradient(135deg, #91aac7 0%, #7a9bb8 30%, #6b8fb3 55%, #4e6d92 80%, #3e5c82 100%)",
            }}
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
        </div>
      </div>
    </div>
  );
}
