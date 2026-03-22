import { create } from "zustand";
import type { PlayerTrack } from "@/store/usePlayerStore";

type UIState = {
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
  homeSearch: string;
  setHomeSearch: (s: string) => void;
  /** Каталог главной (для выпадающего поиска в TopBar) */
  homeCatalog: PlayerTrack[];
  setHomeCatalog: (tracks: PlayerTrack[]) => void;
  nowPlayingOpen: boolean;
  setNowPlayingOpen: (v: boolean) => void;
  /** Модалка «в плейлист» из нижнего плеера */
  playlistModalTrack: PlayerTrack | null;
  setPlaylistModalTrack: (track: PlayerTrack | null) => void;
  /** Короткое сообщение над плеером (добавлено в плейлист и т.п.) */
  playerToast: string | null;
  setPlayerToast: (msg: string | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
  authOpen: false,
  setAuthOpen: (authOpen) => set({ authOpen }),
  homeSearch: "",
  setHomeSearch: (homeSearch) => set({ homeSearch }),
  homeCatalog: [],
  setHomeCatalog: (homeCatalog) => set({ homeCatalog }),
  nowPlayingOpen: false,
  setNowPlayingOpen: (nowPlayingOpen) => set({ nowPlayingOpen }),
  playlistModalTrack: null,
  setPlaylistModalTrack: (playlistModalTrack) => set({ playlistModalTrack }),
  playerToast: null,
  setPlayerToast: (playerToast) => set({ playerToast }),
}));
