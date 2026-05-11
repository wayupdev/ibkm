"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function createFamily(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!name) return { error: "Nom requis." };

  const supabase = await createClient();
  const { error } = await supabase.from("families").insert({
    name, notes, created_by: admin.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/families");
  return { ok: true };
}

export async function updateFamily(id: string, formData: FormData) {
  await requireRole(["admin"]);
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!name) return { error: "Nom requis." };

  const supabase = await createClient();
  const { error } = await supabase.from("families").update({ name, notes }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/families");
  revalidatePath(`/admin/families/${id}`);
  return { ok: true };
}

export async function linkParent(familyId: string, profileId: string, relation: string | null) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("family_members")
    .upsert({ family_id: familyId, profile_id: profileId, relation });
  if (error) return { error: error.message };
  revalidatePath(`/admin/families/${familyId}`);
  return { ok: true };
}

export async function unlinkParent(familyId: string, profileId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  await supabase.from("family_members")
    .delete()
    .eq("family_id", familyId)
    .eq("profile_id", profileId);
  revalidatePath(`/admin/families/${familyId}`);
}

export async function deleteFamily(id: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("families").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/families");
  redirect("/admin/families");
}

export async function assignChildToFamily(childId: string, familyId: string | null) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ family_id: familyId })
    .eq("id", childId);
  if (error) return { error: error.message };
  if (familyId) revalidatePath(`/admin/families/${familyId}`);
  revalidatePath("/admin/families");
  return { ok: true };
}
