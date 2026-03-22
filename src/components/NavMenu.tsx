import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";

const linkClass =
  "block border-b border-[#e0e0e0] px-4 py-2.5 text-left text-[15px] font-bold text-black last:border-b-0 hover:bg-[#e8f2fc] active:bg-[#d4e6f7] dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-800";

const activeClass = "ios-list-item--selected !border-b-[#1159b3]/30";

export function NavMenu() {
  const { t } = useI18n();

  return (
    <div className="group relative z-50">
      <button
        type="button"
        className="glossy-btn flex items-center gap-1.5 !px-3 !py-1.5 !text-[12px]"
        aria-expanded={false}
        aria-haspopup="true"
      >
        <Menu className="h-4 w-4" strokeWidth={2.5} />
        {t("nav.menu")}
      </button>

      <div className="absolute left-0 top-full z-50 h-2 w-full min-w-[200px] opacity-0 group-hover:opacity-100" />

      <div
        className="pointer-events-none invisible absolute left-0 top-[calc(100%+4px)] z-50 w-56 origin-top scale-95 rounded-lg border border-neutral-500 bg-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:scale-100 group-hover:opacity-100 dark:border-neutral-600 dark:bg-neutral-900"
        role="menu"
      >
        <div className="ios-list-header !rounded-t-lg !rounded-b-none">
          {t("nav.section")}
        </div>
        <nav className="overflow-hidden rounded-b-lg bg-white dark:bg-neutral-900">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
            role="menuitem"
          >
            {t("nav.home")}
          </NavLink>
          <NavLink
            to="/collection"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
            role="menuitem"
          >
            {t("nav.collection")}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
            role="menuitem"
          >
            {t("nav.settings")}
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
            role="menuitem"
          >
            {t("nav.about")}
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
