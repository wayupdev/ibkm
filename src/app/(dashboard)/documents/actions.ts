"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function uploadDocument(formData: FormData) {
  const profile = await requireRole(["admin"]);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const audience = String(formData.get("audience") ?? "all") as "all" | "parents" | "children";
  const file = formData.get("file") as File | null;
  const recipientIds = Array.from(
    new Set(
      formData
        .getAll("recipient_id")
        .map((v) => String(v))
        .filter((v) => UUID_RE.test(v)),
    ),
  );

  if (!title) return { error: "Titre requis." };
  if (!file || file.size === 0) return { error: "Fichier manquant." };
  if (file.size > MAX_BYTES) return { error: "Fichier trop volumineux (max 20 Mo)." };

  const supabase = await createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase
    .storage.from("documents")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) return { error: upErr.message };

  const { data: inserted, error: dbErr } = await supabase
    .from("documents")
    .insert({
      title,
      description,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      audience,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (dbErr || !inserted) {
    await supabase.storage.from("documents").remove([path]);
    return { error: dbErr?.message ?? "Échec de l'enregistrement." };
  }

  if (recipientIds.length > 0) {
    const rows = recipientIds.map((profile_id) => ({
      document_id: inserted.id,
      profile_id,
    }));
    const { error: recErr } = await supabase.from("document_recipients").insert(rows);
    if (recErr) {
      await supabase.from("documents").delete().eq("id", inserted.id);
      await supabase.storage.from("documents").remove([path]);
      return { error: recErr.message };
    }
  }

  revalidatePath("/documents");
  return { ok: true };
}

export async function deleteDocument(id: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", id).single();
  if (doc) await supabase.storage.from("documents").remove([doc.storage_path]);
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/documents");
}
