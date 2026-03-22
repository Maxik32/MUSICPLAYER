import type { PlayerTrack } from "@/store/usePlayerStore";

/**
 * Локальные демо-файлы в `public/demo-audio/` (не зависят от SoundHelix / таймаутов).
 */
export const demoTracks: PlayerTrack[] = [
  {
    id: "demo-1",
    title: "T-Rex Roar",
    artist: "MDN (CC0), локально",
    audioUrl: "/demo-audio/t-rex-roar.mp3",
    coverUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
  },
  {
    id: "demo-2",
    title: "Тестовый MP3",
    artist: "Archive.org, локально",
    audioUrl: "/demo-audio/archive-test.mp3",
    coverUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop",
  },
  {
    id: "demo-3",
    title: "Снова T-Rex (очередь / Next)",
    artist: "Тот же файл — проверка переключения",
    audioUrl: "/demo-audio/t-rex-roar.mp3",
    coverUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
  },
];
