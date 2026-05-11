"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function uploadPhoto(formData: FormData) {
  const profile = await requireRole(["admin"]);

  const caption = (String(formData.get("caption") ?? "").trim() || null) as string | null;
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

  if (!file || file.size === 0) return { error: "Image manquante." };
  if (!file.type.startsWith("image/")) return { error: "Le fichier doit être une image." };
  if (file.size > MAX_BYTES) return { error: "Image trop volumineuse (max 10 Mo)." };

  const supabase = await createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase
    .storage.from("photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: upErr.message };

  const { data: inserted, error: dbErr } = await supabase
    .from("photos")
    .insert({
      caption,
      storage_path: path,
      audience,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (dbErr || !inserted) {
    await supabase.storage.from("photos").remove([path]);
    return { error: dbErr?.message ?? "Échec de l'enregistrement." };
  }

  if (recipientIds.length > 0) {
    const rows = recipientIds.map((profile_id) => ({
      photo_id: inserted.id,
      profile_id,
    }));
    const { error: recErr } = await supabase.from("photo_recipients").insert(rows);
    if (recErr) {
      await supabase.from("photos").delete().eq("id", inserted.id);
      await supabase.storage.from("photos").remove([path]);
      return { error: recErr.message };
    }
  }

  revalidatePath("/photos");
  return { ok: true };
}
