import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { BottomPlayer } from "@/components/BottomPlayer";
import { FullscreenNowPlaying } from "@/components/FullscreenNowPlaying";
import { GlobalPlaylistModal } from "@/components/GlobalPlaylistModal";
import { TopBar } from "@/components/TopBar";
import { useAuthStore } from "@/store/useAuthStore";
import {
  backgroundClass,
  useSettingsStore,
} from "@/store/useSettingsStore";
import { useUIStore } from "@/store/useUIStore";

export function AppShell() {
  const authOpen = useUIStore((s) => s.authOpen);
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);
  const playerToast = useUIStore((s) => s.playerToast);
  const setPlayerToast = useUIStore((s) => s.setPlayerToast);
  // The app UI supports only light theme (no dark/light switching).
  const backgroundId = useSettingsStore((s) => s.backgroundId);

  useEffect(() => {
    const unsub = useAuthStore.getState().init();
    return unsub;
  }, []);

  useEffect(() => {
    if (!playerToast) return;
    const id = window.setTimeout(() => setPlayerToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [playerToast, setPlayerToast]);

  const shellBg = backgroundClass(backgroundId, "light");

  return (
    <div
      className={`min-h-dvh pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))] font-ios max-sm:pb-[calc(11.25rem+env(safe-area-inset-bottom,0px))] ${shellBg}`}
    >
      <TopBar />
      <Outlet />
      {playerToast ? (
        <div className="fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-[95] max-w-[min(20rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-lg border border-neutral-500 bg-gradient-to-b from-[#ffffcc] to-[#f5e6a8] px-3 py-2 text-center text-[11px] font-bold text-neutral-900 shadow-lg sm:bottom-[calc(9rem+env(safe-area-inset-bottom,0px))] sm:text-[12px]">
          {playerToast}
        </div>
      ) : null}
      <BottomPlayer />
      <GlobalPlaylistModal />
      <FullscreenNowPlaying />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
