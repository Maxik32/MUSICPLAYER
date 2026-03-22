import { LogIn, LogOut, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { NavMenu } from "@/components/NavMenu";
import { useI18n } from "@/hooks/useI18n";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";

const SEARCH_DROPDOWN_MAX = 14;

export function TopBar() {
  const { t } = useI18n();
  const location = useLocation();
  const showSearch = location.pathname === "/";
  const homeSearch = useUIStore((s) => s.homeSearch);
  const setHomeSearch = useUIStore((s) => s.setHomeSearch);
  const homeCatalog = useUIStore((s) => s.homeCatalog);
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const signOut = useAuthStore((s) => s.signOut);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchResults = useMemo(() => {
    const q = homeSearch.trim().toLowerCase();
    if (!q) return [];
    return homeCatalog.filter(
      (tr) =>
        tr.title.toLowerCase().includes(q) ||
        tr.artist.toLowerCase().includes(q)
    );
  }, [homeCatalog, homeSearch]);

  const showSearchDropdown =
    showSearch &&
    searchOpen &&
    homeSearch.trim().length > 0 &&
    searchResults.length > 0;
  const showSearchEmpty =
    showSearch &&
    searchOpen &&
    homeSearch.trim().length > 0 &&
    searchResults.length === 0 &&
    homeCatalog.length > 0;

  useEffect(() => {
    if (!searchOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = searchWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen]);

  return (
    <header className="metallic-bg sticky top-0 z-[55] border-b border-neutral-600 shadow-md dark:border-neutral-700">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-2 py-2 sm:gap-3 sm:px-3">
        <NavMenu />

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <img
              src="/imusic-logo.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-[20%] border border-[#5a5f66] shadow-[0_3px_8px_rgba(0,0,0,0.22)]"
              draggable={false}
            />
            <div className="hidden min-w-0 sm:block">
              <h1 className="text-sm font-bold leading-tight inset-text--on-metal">
                {t("top.brand")}
              </h1>
            </div>
          </div>

          {showSearch ? (
            <div ref={searchWrapRef} className="relative z-50 min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
              <input
                type="search"
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder={t("top.search")}
                className="inset-field relative z-[1] !py-1.5 !pl-8 !text-[13px] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                aria-label={t("top.search")}
                aria-expanded={showSearchDropdown || showSearchEmpty}
                aria-controls="home-search-dropdown"
                autoComplete="off"
              />
              {showSearchDropdown || showSearchEmpty ? (
                <div
                  id="home-search-dropdown"
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(22rem,70vh)] overflow-y-auto rounded-xl border border-white/20 bg-neutral-900/72 py-1.5 text-left shadow-xl backdrop-blur-md dark:border-white/15 dark:bg-black/60"
                >
                  {showSearchEmpty ? (
                    <p className="px-3 py-2 text-[12px] font-semibold text-white/85">
                      {t("top.searchNoResults")}
                    </p>
                  ) : (
                    searchResults.slice(0, SEARCH_DROPDOWN_MAX).map((tr) => (
                      <button
                        key={tr.id}
                        type="button"
                        role="option"
                        className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:bg-white/10 active:bg-white/15"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          void playTrack(
                            tr,
                            searchResults.length ? searchResults : [tr]
                          );
                          setHomeSearch("");
                          setSearchOpen(false);
                        }}
                      >
                        <span className="truncate text-[13px] font-bold text-white">
                          {tr.title}
                        </span>
                        <span className="truncate text-[11px] font-semibold text-white/65">
                          {tr.artist}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!ready ? (
            <span className="text-[10px] font-bold text-neutral-500">…</span>
          ) : user ? (
            <>
              <span className="hidden max-w-[100px] truncate text-[10px] font-bold text-neutral-800 inset-text lg:inline dark:text-neutral-200">
                {user.email}
              </span>
              <button
                type="button"
                className="glossy-btn flex items-center gap-1 !px-2 !py-1.5 !text-[11px]"
                onClick={() => void signOut()}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("top.logout")}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="glossy-btn glossy-btn--primary flex items-center gap-1 !px-2 !py-1.5 !text-[11px]"
              onClick={() => setAuthOpen(true)}
            >
              <LogIn className="h-3.5 w-3.5" />
              {t("top.login")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
