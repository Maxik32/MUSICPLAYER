import { LogIn, LogOut, Music2, Search } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function TopBar({
  search,
  onSearch,
  onOpenAuth,
}: {
  search: string;
  onSearch: (v: string) => void;
  onOpenAuth: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="metallic-bg sticky top-0 z-40 border-b border-neutral-600 shadow-md">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-500 bg-gradient-to-b from-[#5ba4e5] to-[#1159b3] shadow-inner">
            <Music2 className="h-5 w-5 text-white drop-shadow" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight inset-text--on-metal">
              iMusic
            </h1>
            <p className="text-[9px] font-semibold text-neutral-600 inset-text--on-metal">
              skeuo player
            </p>
          </div>
        </div>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Поиск по каталогу…"
            className="inset-field !py-1.5 !pl-8 !text-[13px]"
            aria-label="Поиск"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!ready ? (
            <span className="text-[10px] font-bold text-neutral-500">…</span>
          ) : user ? (
            <>
              <span className="hidden max-w-[120px] truncate text-[10px] font-bold text-neutral-800 inset-text sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                className="glossy-btn flex items-center gap-1 !px-2 !py-1.5 !text-[11px]"
                onClick={() => void signOut()}
              >
                <LogOut className="h-3.5 w-3.5" />
                Выйти
              </button>
            </>
          ) : (
            <button
              type="button"
              className="glossy-btn glossy-btn--primary flex items-center gap-1 !px-2 !py-1.5 !text-[11px]"
              onClick={onOpenAuth}
            >
              <LogIn className="h-3.5 w-3.5" />
              Войти
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
