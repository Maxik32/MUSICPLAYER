import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { loadOrCreateNickname, upsertNickname } from "@/lib/profileApi";
import { getSupabase } from "@/lib/supabaseClient";

type AuthState = {
  session: Session | null;
  user: User | null;
  nickname: string | null;
  ready: boolean;
  init: () => () => void;
  signOut: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  nickname: null,
  ready: false,

  init: () => {
    const sb = getSupabase();
    if (!sb) {
      set({ ready: true });
      return () => {};
    }

    void sb.auth
      .getSession()
      .then(async ({ data }) => {
        const user = data.session?.user ?? null;
        const nickname = user ? await loadOrCreateNickname(user) : null;
        set({
          session: data.session,
          user,
          nickname,
          ready: true,
        });
      })
      .catch((e: unknown) => {
        const err = e as { message?: string };
        console.warn("[auth init]", err.message ?? "unknown error");
        set({ ready: true });
      });

    const { data: sub } = sb.auth.onAuthStateChange(async (_event, session) => {
      try {
        const user = session?.user ?? null;
        const nickname = user ? await loadOrCreateNickname(user) : null;
        set({
          session,
          user,
          nickname,
          ready: true,
        });
      } catch (e: unknown) {
        const err = e as { message?: string };
        console.warn("[auth state change]", err.message ?? "unknown error");
        set({
          session,
          user: session?.user ?? null,
          nickname: null,
          ready: true,
        });
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  },

  signOut: async () => {
    await getSupabase()?.auth.signOut();
    set({ nickname: null });
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
    const { data } = await sb.auth.getUser();
    if (data.user) {
      try {
        await upsertNickname(data.user.id, cleanNick);
      } catch (e: unknown) {
        const err = e as { message?: string };
        console.warn("[signup profile]", err.message ?? "unknown error");
      }
      set({ nickname: cleanNick });
    }
  },

  updateNickname: async (nickname) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase не настроен");
    const cleanNick = nickname.trim().slice(0, 32);
    if (cleanNick.length < 2) throw new Error("Ник должен быть от 2 символов");
    const { data, error } = await sb.auth.updateUser({
      data: {
        nickname: cleanNick,
        display_name: cleanNick,
      },
    });
    if (error) throw error;
    const userId = data.user?.id ?? (await sb.auth.getUser()).data.user?.id ?? null;
    if (userId) {
      await upsertNickname(userId, cleanNick);
    }

    set((s) => ({
      ...s,
      user: data.user ?? s.user,
      nickname: cleanNick,
      session:
        s.session && data.user
          ? { ...s.session, user: data.user }
          : s.session,
    }));
  },

  updatePassword: async (password) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase не настроен");
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
  },
}));
