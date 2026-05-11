"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Message } from "@/lib/types";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function openThread(otherId: string) {
  const me = await requireProfile();
  if (otherId === me.id) return { error: "Destinataire invalide." };

  const supabase = await createClient();

  // Child safety enforced both by RLS on messages and check here on threads.
  if (me.role === "child") {
    const { data: other } = await supabase
      .from("profiles").select("role").eq("id", otherId).single();
    if (!other || other.role !== "admin") return { error: "Action non autorisée." };
  }

  const [ua, ub] = orderedPair(me.id, otherId);

  // Insert or fetch existing
  const { data: existing } = await supabase
    .from("message_threads")
    .select("id")
    .eq("user_a", ua).eq("user_b", ub)
    .maybeSingle();
  if (existing) return { threadId: existing.id };

  const { data: created, error } = await supabase
    .from("message_threads")
    .insert({ user_a: ua, user_b: ub })
    .select("id").single();
  if (error) return { error: error.message };
  return { threadId: created.id };
}

export async function sendMessage(
  threadId: string,
  body: string,
): Promise<{ message: Message } | { error: string }> {
  const me = await requireProfile();
  const text = body.trim();
  if (!text) return { error: "Message vide." };

  const supabase = await createClient();
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: me.id,
      body: text,
    })
    .select("*")
    .single();
  if (error || !message) return { error: error?.message ?? "Envoi impossible." };

  await supabase.from("message_threads")
    .update({ last_msg_at: new Date().toISOString() })
    .eq("id", threadId);

  revalidatePath(`/messages/${threadId}`);
  return { message: message as Message };
}

export async function markRead(threadId: string) {
  const me = await requireProfile();
  const supabase = await createClient();
  await supabase.from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .neq("sender_id", me.id)
    .is("read_at", null);
}
