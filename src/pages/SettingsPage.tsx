import { NavLink } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import {
  type AppLanguage,
  type BackgroundId,
  useSettingsStore,
} from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";

export function SettingsPage() {
  const { t } = useI18n();
  const backgroundId = useSettingsStore((s) => s.backgroundId);
  const language = useSettingsStore((s) => s.language);
  const setBackgroundId = useSettingsStore((s) => s.setBackgroundId);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const user = useAuthStore((s) => s.user);
  // Nickname is chosen only during registration. No profile edits here to keep auth stable.

  return (
    <main className="mx-auto max-w-4xl px-3 py-6">
      <div className="ios-list overflow-hidden rounded-xl dark:bg-neutral-900">
        <div className="ios-list-header">{t("settings.title")}</div>
        <div className="space-y-5 bg-white p-4 dark:bg-neutral-900">
          <div className="rounded-lg border border-neutral-200/90 bg-neutral-50/80 p-3 dark:border-neutral-600 dark:bg-neutral-800/50">
            <p className="mb-2 text-[12px] font-bold text-neutral-700 dark:text-neutral-200">
              {t("settings.theme")}
            </p>
            <button
              type="button"
              className="glossy-btn glossy-btn--primary !text-[12px] ring-2 ring-[#2477d1] ring-offset-2 ring-offset-white disabled:cursor-default disabled:opacity-100"
              disabled
            >
              {t("settings.themeStandard")}
            </button>
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

          {user ? (
            <div className="space-y-2 text-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              {t("settings.nickLocked")}
            </div>
          ) : null}

          <NavLink to="/" className="glossy-btn inline-block !no-underline">
            {t("settings.back")}
          </NavLink>
        </div>
      </div>
    </main>
  );
}
