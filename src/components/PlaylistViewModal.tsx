import { Play } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { PlayerTrack } from "@/store/usePlayerStore";

export function PlaylistViewModal({
  open,
  name,
  tracks,
  onClose,
  onPlayTrack,
}: {
  open: boolean;
  name: string;
  tracks: PlayerTrack[];
  onClose: () => void;
  onPlayTrack: (track: PlayerTrack) => void;
}) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="ios-list flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden shadow-2xl dark:bg-neutral-900">
        <div className="ios-list-header flex justify-between">
          <span className="truncate pr-2">{name}</span>
          <button
            type="button"
            className="shrink-0 text-[10px] font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto bg-white dark:bg-neutral-900">
          {tracks.length === 0 ? (
            <p className="p-4 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              {t("playlist.empty")}
            </p>
          ) : (
            tracks.map((tr) => (
              <button
                key={tr.id}
                type="button"
                className="flex w-full items-center gap-2 border-b border-[#e0e0e0] px-3 py-2 text-left last:border-b-0 hover:bg-[#f0f7ff] dark:border-neutral-700 dark:hover:bg-neutral-800"
                onClick={() => onPlayTrack(tr)}
              >
                <Play className="h-4 w-4 shrink-0 text-[#2477d1]" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold inset-text dark:text-neutral-100">
                    {tr.title}
                  </p>
                  <p className="truncate text-[11px] text-neutral-600 dark:text-neutral-400">
                    {tr.artist}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
