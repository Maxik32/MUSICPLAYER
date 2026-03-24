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

  const { data, error } = await sb
    .from("profiles")
    .select("nickname")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!error && data?.nickname) return String(data.nickname);

  const nick = fallbackNickname(user);
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
  return nick;
}

export async function upsertNickname(userId: string, nickname: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase не настроен");
  const cleanNick = nickname.trim();
  const { error } = await sb.from("profiles").upsert(
    {
      user_id: userId,
      nickname: cleanNick,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
