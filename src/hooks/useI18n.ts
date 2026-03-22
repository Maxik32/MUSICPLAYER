import { useCallback } from "react";
import { translate, type Lang } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";

export function useI18n() {
  const language = useSettingsStore((s) => s.language);
  const t = useCallback(
    (key: string) => translate(language, key),
    [language]
  );
  return { t, lang: language as Lang };
}
