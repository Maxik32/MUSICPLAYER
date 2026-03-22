import { useState } from "react";
import type { PlaylistRow } from "@/lib/trackApi";
import type { PlayerTrack } from "@/store/usePlayerStore";

export function PlaylistAddModal({
  open,
  track,
  playlists,
  onClose,
  onAdd,
  onCreateAndAdd,
}: {
  open: boolean;
  track: PlayerTrack | null;
  playlists: PlaylistRow[];
  onClose: () => void;
  onAdd: (playlistId: string) => void;
  onCreateAndAdd: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  if (!open || !track) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="ios-list max-h-[70vh] w-full max-w-sm overflow-hidden overflow-y-auto shadow-2xl">
        <div className="ios-list-header flex justify-between">
          <span>В плейлист</span>
          <button
            type="button"
            className="text-[10px] font-bold text-white/90"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
        <div className="bg-white p-2">
          <p className="mb-2 truncate px-1 text-[12px] font-bold inset-text">
            {track.title}
          </p>
          {!creating ? (
            <>
              {playlists.length === 0 ? (
                <p className="px-2 py-3 text-[11px] font-semibold text-neutral-600">
                  Плейлистов пока нет — создайте первый ниже.
                </p>
              ) : (
                <ul className="space-y-1">
                  {playlists.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="ios-list-item w-full !min-h-[40px] !rounded-md !py-2 text-left"
                        onClick={() => onAdd(p.id)}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="text-[10px] text-neutral-500">
                          {p.trackCount ?? 0} тр.
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="glossy-btn glossy-btn--primary mt-2 w-full !text-[12px]"
                onClick={() => setCreating(true)}
              >
                + Новый плейлист
              </button>
            </>
          ) : (
            <div className="space-y-2 px-1 py-2">
              <label className="block text-[11px] font-bold text-neutral-700">
                Название
              </label>
              <input
                className="inset-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Мой микс"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="glossy-btn flex-1 !text-[12px]"
                  onClick={() => {
                    setCreating(false);
                    setName("");
                  }}
                >
                  Назад
                </button>
                <button
                  type="button"
                  className="glossy-btn glossy-btn--primary flex-1 !text-[12px]"
                  onClick={() => {
                    const n = name.trim();
                    if (!n) return;
                    onCreateAndAdd(n);
                    setName("");
                    setCreating(false);
                    onClose();
                  }}
                >
                  Создать и добавить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
