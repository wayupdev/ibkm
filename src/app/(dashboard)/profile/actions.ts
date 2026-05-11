"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const me = await requireProfile();
  const supabase = await createClient();

  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name  = String(formData.get("last_name") ?? "").trim();
  const phone      = String(formData.get("phone") ?? "").trim() || null;
  const birth_date = String(formData.get("birth_date") ?? "") || null;
  const email_notifications = formData.get("email_notifications") === "on";
  const photo_consent = formData.get("photo_consent") === "on";

  if (!first_name || !last_name) return { error: "Prénom et nom requis." };

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name, last_name, phone, birth_date,
      email_notifications,
      ...(me.role === "parent" ? { photo_consent } : {}),
    })
    .eq("id", me.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { ok: true };
}
