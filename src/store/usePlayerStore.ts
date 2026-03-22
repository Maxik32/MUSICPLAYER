import { create } from "zustand";
import { isUuidTrackId, recordTrackPlay } from "@/lib/trackPlays";

/** Один засчитанный play_count за текущую загрузку трека (≥15 с воспроизведения). */
let playCountGateTrackId: string | null = null;
let playCountRecordedForLoad = false;

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  description?: string;
  coverUrl?: string;
  audioUrl?: string;
  durationSec?: number;
  /** из Supabase tracks.play_count */
  playCount?: number;
};

type PlayerState = {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  isPlaying: boolean;
  /** 0..1 from HTMLMediaElement.currentTime / duration */
  progress: number;
  currentTimeSec: number;
  durationSec: number;
  /** Set when decode/network fails (e.g. CORS, 404) */
  playbackError: string | null;
  play: () => Promise<boolean>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  seek: (ratio: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => Promise<void>;
  setQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  clearPlaybackError: () => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  /** 0..1, mirrored on HTMLAudioElement.volume */
  volume: number;
  setVolume: (v: number) => void;
};

let audioEl: HTMLAudioElement | null = null;
let listenersBound = false;
let lastLoadedTrackId: string | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
    // Do NOT set crossOrigin unless the host sends CORS headers; otherwise the
    // browser may refuse to load or expose duration/currentTime (stuck at 0:00).
    try {
      audioEl.referrerPolicy = "no-referrer";
    } catch {
      /* older engines */
    }
    try {
      audioEl.volume = usePlayerStore.getState().volume;
    } catch {
      audioEl.volume = 1;
    }
  }
  return audioEl;
}

function waitUntilCanPlay(a: HTMLAudioElement): Promise<void> {
  if (a.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      a.removeEventListener("canplay", onCanPlay);
      a.removeEventListener("error", onError);
      window.clearTimeout(timeoutId);
    };
    const onCanPlay = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      const err = a.error;
      reject(
        new Error(
          err
            ? `Audio error ${err.code}: ${err.message || "failed to load"}`
            : "Audio failed to load"
        )
      );
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Audio load timed out"));
    }, 30_000);
    a.addEventListener("canplay", onCanPlay, { once: true });
    a.addEventListener("error", onError, { once: true });
  });
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const bindListeners = () => {
    if (listenersBound) return;
    const a = getAudio();
    if (!a) return;
    listenersBound = true;
    a.volume = Math.max(0, Math.min(1, get().volume));

    const syncTime = () => {
      const dur = a.duration;
      const durationSec =
        Number.isFinite(dur) && dur > 0 ? dur : get().durationSec;
      set({
        currentTimeSec: a.currentTime,
        durationSec,
        progress:
          durationSec > 0
            ? Math.min(1, Math.max(0, a.currentTime / durationSec))
            : 0,
      });

      const tr = get().currentTrack;
      if (
        !playCountRecordedForLoad &&
        playCountGateTrackId &&
        tr &&
        tr.id === playCountGateTrackId &&
        !a.paused &&
        isUuidTrackId(tr.id) &&
        a.currentTime >= 15
      ) {
        playCountRecordedForLoad = true;
        void recordTrackPlay(tr.id);
      }
    };

    a.addEventListener("timeupdate", syncTime);
    a.addEventListener("loadedmetadata", syncTime);
    a.addEventListener("durationchange", syncTime);
    a.addEventListener("ended", () => {
      get().nextTrack();
    });
    a.addEventListener("play", () => set({ isPlaying: true }));
    a.addEventListener("pause", () => set({ isPlaying: false }));
    a.addEventListener("error", () => {
      const err = a.error;
      set({
        isPlaying: false,
        playbackError: err
          ? `Не удалось загрузить аудио (${err.code}). Проверьте ссылку или CORS.`
          : "Ошибка воспроизведения",
      });
    });
  };

  const loadAudioSource = (track: PlayerTrack) => {
    bindListeners();
    const a = getAudio();
    if (!a) return;

    if (!track.audioUrl) {
      getAudio()?.pause();
      lastLoadedTrackId = null;
      playCountGateTrackId = null;
      playCountRecordedForLoad = false;
      set({ currentTrack: track });
      return;
    }

    if (lastLoadedTrackId === track.id && a.src) {
      set({ currentTrack: track });
      return;
    }

    lastLoadedTrackId = track.id;
    playCountGateTrackId = track.id;
    playCountRecordedForLoad = false;
    a.src = track.audioUrl;
    a.load();
    set({
      currentTrack: track,
      progress: 0,
      currentTimeSec: 0,
      durationSec: track.durationSec ?? 0,
      playbackError: null,
    });
  };

  return {
    currentTrack: null,
    queue: [],
    queueIndex: 0,
    isPlaying: false,
    progress: 0,
    currentTimeSec: 0,
    durationSec: 0,
    playbackError: null,
    shuffle: false,
    volume: 1,

    toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

    setVolume: (v) => {
      const nv = Math.max(0, Math.min(1, v));
      const a = getAudio();
      if (a) a.volume = nv;
      set({ volume: nv });
    },

    clearPlaybackError: () => set({ playbackError: null }),

    play: async (): Promise<boolean> => {
      bindListeners();
      const a = getAudio();
      if (!a?.src) return false;
      try {
        set({ playbackError: null });
        if (a.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
          await waitUntilCanPlay(a);
        }
        await a.play();
        return true;
      } catch (e) {
        console.error("[player] play failed", e);
        const message =
          e instanceof Error ? e.message : "Не удалось начать воспроизведение";
        set({ isPlaying: false, playbackError: message });
        return false;
      }
    },

    pause: () => {
      getAudio()?.pause();
    },

    togglePlay: async () => {
      if (get().isPlaying) {
        get().pause();
      } else {
        void get().play();
      }
    },

    seek: (ratio) => {
      const a = getAudio();
      if (!a) return;
      const dur = a.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      const r = Math.max(0, Math.min(1, ratio));
      a.currentTime = r * dur;
      set({
        progress: r,
        currentTimeSec: a.currentTime,
        durationSec: dur,
      });
    },

    nextTrack: () => {
      const { queue, queueIndex, shuffle } = get();
      if (!queue.length) return;

      if (shuffle && queue.length > 1) {
        let nextIdx = queueIndex;
        for (let i = 0; i < 48 && nextIdx === queueIndex; i++) {
          nextIdx = Math.floor(Math.random() * queue.length);
        }
        const next = queue[nextIdx];
        set({ queueIndex: nextIdx });
        loadAudioSource(next);
        void get().play();
        return;
      }

      if (queueIndex < queue.length - 1) {
        const nextIdx = queueIndex + 1;
        const next = queue[nextIdx];
        set({ queueIndex: nextIdx });
        loadAudioSource(next);
        void get().play();
      } else {
        if (shuffle && queue.length > 0) {
          let nextIdx = queueIndex;
          if (queue.length > 1) {
            let guard = 0;
            while (nextIdx === queueIndex && guard++ < 48) {
              nextIdx = Math.floor(Math.random() * queue.length);
            }
          }
          const next = queue[nextIdx];
          set({ queueIndex: nextIdx });
          loadAudioSource(next);
          void get().play();
          return;
        }
        get().pause();
        const a = getAudio();
        if (a) a.currentTime = 0;
        set({
          progress: 0,
          currentTimeSec: 0,
          isPlaying: false,
        });
      }
    },

    prevTrack: () => {
      const { queue, queueIndex, currentTimeSec } = get();
      const a = getAudio();

      if (currentTimeSec > 3 && a) {
        a.currentTime = 0;
        set({ progress: 0, currentTimeSec: 0 });
        return;
      }

      if (queueIndex > 0) {
        const prevIdx = queueIndex - 1;
        const prev = queue[prevIdx];
        set({ queueIndex: prevIdx });
        loadAudioSource(prev);
        void get().play();
      } else if (a) {
        a.currentTime = 0;
        set({ progress: 0, currentTimeSec: 0 });
      }
    },

    playTrack: async (track, queue) => {
      const q =
        queue !== undefined
          ? queue
          : get().queue.length > 0
            ? get().queue
            : [track];
      const idx = Math.max(0, q.findIndex((t) => t.id === track.id));
      set({ queue: q, queueIndex: idx });
      loadAudioSource(track);
      await get().play();
    },

    setQueue: (tracks, startIndex = 0) => {
      const idx = Math.min(
        Math.max(0, startIndex),
        Math.max(0, tracks.length - 1)
      );
      set({ queue: tracks, queueIndex: tracks.length ? idx : 0 });
      const t = tracks[idx];
      if (t) loadAudioSource(t);
    },
  };
});
