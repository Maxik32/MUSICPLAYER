import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";
export type BackgroundId = "white" | "pinstripe" | "linen" | "metal";
export type AppLanguage = "ru" | "en";

type SettingsState = {
  theme: ThemeMode;
  backgroundId: BackgroundId;
  language: AppLanguage;
  setTheme: (t: ThemeMode) => void;
  setBackgroundId: (b: BackgroundId) => void;
  setLanguage: (l: AppLanguage) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "light",
      backgroundId: "white",
      language: "ru",
      // Only light theme is allowed in the UI (no dark/light switching).
      setTheme: () => set({ theme: "light" }),
      setBackgroundId: (backgroundId) => set({ backgroundId }),
      setLanguage: (language) => set({ language }),
    }),
    { name: "imusic-settings-v1" }
  )
);

export function backgroundClass(id: BackgroundId, theme: ThemeMode): string {
  if (theme === "dark") {
    switch (id) {
      case "pinstripe":
        return "dark-pinstripe-bg text-neutral-100";
      case "linen":
        return "dark-linen-bg text-neutral-100";
      case "metal":
        return "dark-metal-bg text-neutral-100";
      default:
        return "bg-neutral-950 text-neutral-100";
    }
  }
  switch (id) {
    case "pinstripe":
      return "pinstripe-bg text-neutral-900";
    case "linen":
      return "dark-linen-bg text-neutral-100";
    case "metal":
      return "bg-gradient-to-b from-[#c8c8c8] via-[#dcdcdc] to-[#b0b0b0] text-neutral-900";
    default:
      return "bg-[#f2f2f2] text-neutral-900";
  }
}
