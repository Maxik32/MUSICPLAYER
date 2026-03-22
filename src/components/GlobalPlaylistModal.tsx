import { useCallback, useEffect, useState } from "react";
import { PlaylistAddModal } from "@/components/PlaylistAddModal";
import { useI18n } from "@/hooks/useI18n";
import {
  addTrackToPlaylist,
  createPlaylist,
  fetchPlaylists,
  type PlaylistRow,
} from "@/lib/trackApi";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";

export function GlobalPlaylistModal() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const track = useUIStore((s) => s.playlistModalTrack);
  const setTrack = useUIStore((s) => s.setPlaylistModalTrack);
  const setPlayerToast = useUIStore((s) => s.setPlayerToast);

  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);

  const refreshPlaylists = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      return;
    }
    setPlaylists(await fetchPlaylists(user.id));
  }, [user]);

  useEffect(() => {
    if (track && user) void refreshPlaylists();
  }, [track, user, refreshPlaylists]);

  const onClose = () => setTrack(null);

  const onAdd = async (playlistId: string) => {
    if (!track || !user) return;
    const ok = await addTrackToPlaylist(playlistId, track.id);
    if (ok) {
      setPlayerToast(t("player.toastAddedPlaylist"));
      onClose();
    } else {
      setPlayerToast(t("player.toastPlaylistFail"));
    }
  };

  const onCreateAndAdd = async (name: string) => {
    if (!track || !user) return;
    const pl = await createPlaylist(user.id, name);
    if (!pl) {
      setPlayerToast(t("player.toastPlaylistCreateFail"));
      return;
    }
    await addTrackToPlaylist(pl.id, track.id);
    setPlayerToast(t("player.toastPlaylistCreated"));
    void refreshPlaylists();
    onClose();
  };

  return (
    <PlaylistAddModal
      open={track != null}
      track={track}
      playlists={playlists}
      onClose={onClose}
      onAdd={(id) => void onAdd(id)}
      onCreateAndAdd={(name) => void onCreateAndAdd(name)}
    />
  );
}
