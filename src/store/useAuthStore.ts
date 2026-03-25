import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { getSupabase } from "@/lib/supabaseClient";

type AuthState = {
  session: Session | null;
  user: User | null;
  ready: boolean;
  init: () => () => void;
  signOut: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  ready: false,

  init: () => {
    const sb = getSupabase();
    if (!sb) {
      set({ ready: true });
      return () => {};
    }

    void sb.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user ?? null;
        set({
          session: data.session,
          user,
          ready: true,
        });
      })
      .catch((e: unknown) => {
        const err = e as { message?: string };
        console.warn("[auth init]", err.message ?? "unknown error");
        set({ ready: true });
      });

    const { data: sub } = sb.auth.onAuthStateChange(async (_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        ready: true,
      });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  },

  signOut: async () => {
    await getSupabase()?.auth.signOut();
    set({ session: null, user: null });
  },

  signInWithPassword: async (email, password) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase не настроен");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, nickname) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase не настроен");
    const cleanNick = nickname.trim().slice(0, 32);
    if (cleanNick.length < 2) throw new Error("Ник должен быть от 2 символов");
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: cleanNick,
          display_name: cleanNick,
        },
      },
    });
    if (error) throw error;
  },
}));
