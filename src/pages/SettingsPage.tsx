import { NavLink } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import {
  type AppLanguage,
  type BackgroundId,
  type ThemeMode,
  useSettingsStore,
} from "@/store/useSettingsStore";

export function SettingsPage() {
  const { t } = useI18n();
  const theme = useSettingsStore((s) => s.theme);
  const backgroundId = useSettingsStore((s) => s.backgroundId);
  const language = useSettingsStore((s) => s.language);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setBackgroundId = useSettingsStore((s) => s.setBackgroundId);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <main className="mx-auto max-w-4xl px-3 py-6">
      <div className="ios-list overflow-hidden rounded-xl dark:bg-neutral-900">
        <div className="ios-list-header">{t("settings.title")}</div>
        <div className="space-y-5 bg-white p-4 dark:bg-neutral-900">
          <div className="rounded-lg border border-neutral-200/90 bg-neutral-50/80 p-3 dark:border-neutral-600 dark:bg-neutral-800/50">
            <p className="mb-2 text-[12px] font-bold text-neutral-700 dark:text-neutral-200">
              {t("settings.theme")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`glossy-btn !text-[12px] transition-shadow dark:border-neutral-500 dark:text-neutral-100 ${
                  theme === "light"
                    ? "glossy-btn--primary ring-2 ring-[#2477d1] ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
                    : ""
                }`}
                onClick={() => setTheme("light" as ThemeMode)}
              >
                {t("settings.themeStandard")}
              </button>
              <button
                type="button"
                className={`glossy-btn !text-[12px] transition-shadow dark:border-neutral-500 dark:text-neutral-100 ${
                  theme === "dark"
                    ? "glossy-btn--primary ring-2 ring-sky-400 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
                    : ""
                }`}
                onClick={() => setTheme("dark" as ThemeMode)}
              >
                {t("settings.themeDark")}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200/90 bg-neutral-50/80 p-3 dark:border-neutral-600 dark:bg-neutral-800/50">
            <p className="mb-2 text-[12px] font-bold text-neutral-700 dark:text-neutral-200">
              {t("settings.bg")}
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["white", "settings.bgWhite"],
                  ["pinstripe", "settings.bgPinstripe"],
                  ["linen", "settings.bgLinen"],
                  ["metal", "settings.bgMetal"],
                ] as const
              ).map(([id, key]) => (
                <button
                  key={id}
                  type="button"
                  className={`glossy-btn !text-[11px] dark:border-neutral-500 dark:text-neutral-100 ${
                    backgroundId === id
                      ? "glossy-btn--primary ring-2 ring-[#2477d1] ring-offset-2 ring-offset-white dark:ring-sky-400 dark:ring-offset-neutral-900"
                      : ""
                  }`}
                  onClick={() => setBackgroundId(id as BackgroundId)}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              {t("settings.bgNote")}
            </p>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-bold text-neutral-700 dark:text-neutral-300">
              {t("settings.lang")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`glossy-btn !text-[12px] ${language === "ru" ? "glossy-btn--primary" : ""}`}
                onClick={() => setLanguage("ru" as AppLanguage)}
              >
                {t("settings.langRu")}
              </button>
              <button
                type="button"
                className={`glossy-btn !text-[12px] ${language === "en" ? "glossy-btn--primary" : ""}`}
                onClick={() => setLanguage("en" as AppLanguage)}
              >
                {t("settings.langEn")}
              </button>
            </div>
          </div>

          <NavLink to="/" className="glossy-btn inline-block !no-underline">
            {t("settings.back")}
          </NavLink>
        </div>
      </div>
    </main>
  );
}
