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
  signUp: (email: string, password: string) => Promise<void>;
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

    void sb.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user ?? null,
        ready: true,
      });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
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
  },

  signInWithPassword: async (email, password) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase не настроен");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase не настроен");
    const { error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
  },
}));
