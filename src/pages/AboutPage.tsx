import { NavLink } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";

export function AboutPage() {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-4xl px-3 py-6">
      <div className="ios-list overflow-hidden rounded-xl dark:bg-neutral-900">
        <div className="ios-list-header">{t("about.title")}</div>
        <div className="space-y-3 bg-white p-4 text-[13px] font-semibold leading-relaxed text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          <p>{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
          <NavLink to="/" className="glossy-btn inline-block !no-underline">
            {t("about.back")}
          </NavLink>
        </div>
      </div>
    </main>
  );
}
