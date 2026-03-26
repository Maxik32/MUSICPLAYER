import { getSupabase } from "@/lib/supabaseClient";

export async function sendFeedback(params: {
  name: string;
  contact: string;
  message: string;
}): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const payload = {
    name: params.name.trim().slice(0, 120),
    contact: params.contact.trim().slice(0, 160),
    message: params.message.trim().slice(0, 4000),
  };

  if (!payload.name || !payload.contact || !payload.message) return false;

  const { error } = await sb.from("feedback_messages").insert(payload);
  if (error) {
    console.warn("[feedback insert]", error.message);
    return false;
  }
  return true;
}
