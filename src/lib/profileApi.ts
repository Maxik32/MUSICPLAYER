import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabaseClient";

function fallbackNickname(user: User): string {
  const fromMeta =
    (user.user_metadata?.display_name as string | undefined)?.trim() ||
    (user.user_metadata?.nickname as string | undefined)?.trim();
  if (fromMeta) return fromMeta;
  const fromEmail = user.email?.split("@")[0]?.trim();
  if (fromEmail) return fromEmail;
  return "user";
}

export async function loadOrCreateNickname(user: User): Promise<string> {
  const sb = getSupabase();
  if (!sb) return fallbackNickname(user);
  const nick = fallbackNickname(user);

  try {
    const { data, error } = await sb
      .from("profiles")
      .select("nickname")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data?.nickname) return String(data.nickname);

    // profiles table may not be migrated yet; keep app working without it.
    if (error && error.code === "42P01") return nick;

    const { error: upsertError } = await sb.from("profiles").upsert(
      {
        user_id: user.id,
        nickname: nick,
      },
      { onConflict: "user_id" }
    );
    if (upsertError) {
      console.warn("[profiles upsert]", upsertError.message);
    }
  } catch (e) {
    const err = e as { message?: string };
    console.warn("[profiles] fallback nickname:", err.message ?? "unknown error");
  }
  return nick;
}

export async function upsertNickname(userId: string, nickname: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase не настроен");
  const cleanNick = nickname.trim();
  try {
    const { error } = await sb.from("profiles").upsert(
      {
        user_id: userId,
        nickname: cleanNick,
      },
      { onConflict: "user_id" }
    );
    if (error) {
      // profiles migration may be missing; do not break auth/profile UX.
      if (error.code === "42P01") return;
      throw error;
    }
  } catch (e) {
    const err = e as { message?: string };
    console.warn("[profiles upsert nickname]", err.message ?? "unknown error");
  }
}
