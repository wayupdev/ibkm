"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { ChildThreadMessage, Profile } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 20 * 1024 * 1024;

type ChildInfo = { id: string; role: string; family_id: string | null };
type AccessOk = { ok: true; me: Profile; supabase: SupabaseClient; child: ChildInfo };
type AccessErr = { ok: false; error: string };

async function assertCanAccessChild(childId: string): Promise<AccessOk | AccessErr> {
  const me = await requireProfile();
  const supabase = await createClient();

  if (me.role === "admin") {
    const { data: child } = await supabase
      .from("profiles")
      .select("id, role, family_id")
      .eq("id", childId)
      .single();
    if (!child || child.role !== "child") return { ok: false, error: "Jeune introuvable." };
    return { ok: true, me, supabase, child };
  }

  if (me.role !== "parent") return { ok: false, error: "Accès non autorisé." };

  const { data: child } = await supabase
    .from("profiles")
    .select("id, role, family_id")
    .eq("id", childId)
    .eq("role", "child")
    .single();
  if (!child || !child.family_id) return { ok: false, error: "Jeune introuvable." };

  const { data: link } = await supabase
    .from("family_members")
    .select("profile_id")
    .eq("family_id", child.family_id)
    .eq("profile_id", me.id)
    .maybeSingle();
  if (!link) return { ok: false, error: "Accès non autorisé." };

  return { ok: true, me, supabase, child };
}

async function ensureThread(childId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("child_threads")
    .select("id")
    .eq("child_id", childId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("child_threads")
    .insert({ child_id: childId })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Création de fil impossible.");
  return created.id;
}

export async function sendChildMessage(
  childId: string,
  body: string,
): Promise<{ message: ChildThreadMessage } | { error: string }> {
  const access = await assertCanAccessChild(childId);
  if (!access.ok) return { error: access.error };
  const { me, supabase } = access;

  const text = body.trim();
  if (!text) return { error: "Message vide." };
  if (text.length > 5000) return { error: "Message trop long (max 5000 caractères)." };

  let threadId: string;
  try {
    threadId = await ensureThread(childId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur." };
  }

  const { data: message, error } = await supabase
    .from("child_thread_messages")
    .insert({
      thread_id: threadId,
      child_id: childId,
      sender_id: me.id,
      body: text,
    })
    .select("*")
    .single();
  if (error || !message) return { error: error?.message ?? "Envoi impossible." };

  await supabase
    .from("child_threads")
    .update({ last_msg_at: new Date().toISOString() })
    .eq("id", threadId);

  revalidatePath(`/family/${childId}`);
  revalidatePath(`/admin/exchanges/${childId}`);
  return { message: message as ChildThreadMessage };
}

export async function markChildThreadRead(childId: string) {
  const access = await assertCanAccessChild(childId);
  if (!access.ok) return;
  const { me, supabase } = access;

  await supabase
    .from("child_thread_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("child_id", childId)
    .neq("sender_id", me.id)
    .is("read_at", null);
}

export async function uploadChildDocument(childId: string, formData: FormData) {
  const access = await assertCanAccessChild(childId);
  if (!access.ok) return { error: access.error };
  const { me, supabase } = access;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const file = formData.get("file") as File | null;

  if (!title) return { error: "Titre requis." };
  if (!file || file.size === 0) return { error: "Fichier manquant." };
  if (file.size > MAX_BYTES) return { error: "Fichier trop volumineux (max 20 Mo)." };

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${childId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase
    .storage.from("family-exchange")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) return { error: upErr.message };

  const { error: dbErr } = await supabase.from("child_documents").insert({
    child_id: childId,
    title,
    description,
    storage_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    sender_id: me.id,
  });
  if (dbErr) {
    await supabase.storage.from("family-exchange").remove([path]);
    return { error: dbErr.message };
  }

  revalidatePath(`/family/${childId}`);
  revalidatePath(`/admin/exchanges/${childId}`);
  return { ok: true };
}

export async function deleteChildDocument(childId: string, docId: string) {
  const access = await assertCanAccessChild(childId);
  if (!access.ok) return { error: access.error };
  const { supabase } = access;

  const { data: doc } = await supabase
    .from("child_documents")
    .select("storage_path")
    .eq("id", docId)
    .eq("child_id", childId)
    .single();
  if (doc) {
    await supabase.storage.from("family-exchange").remove([doc.storage_path]);
  }
  const { error } = await supabase.from("child_documents").delete().eq("id", docId);
  if (error) return { error: error.message };

  revalidatePath(`/family/${childId}`);
  revalidatePath(`/admin/exchanges/${childId}`);
  return { ok: true };
}
