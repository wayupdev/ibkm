"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { notifyNewTripMessage } from "@/lib/notifications";
import type { TripMessage } from "@/lib/types";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function emptyToNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function createTrip(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Titre requis." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .insert({
      title,
      description: emptyToNull(formData.get("description")),
      location:    emptyToNull(formData.get("location")),
      start_date:  emptyToNull(formData.get("start_date")),
      end_date:    emptyToNull(formData.get("end_date")),
      created_by:  admin.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/trips");
  redirect(`/trips/${data.id}`);
}

export async function updateTrip(id: string, formData: FormData) {
  await requireRole(["admin"]);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Titre requis." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("trips")
    .update({
      title,
      description: emptyToNull(formData.get("description")),
      location:    emptyToNull(formData.get("location")),
      start_date:  emptyToNull(formData.get("start_date")),
      end_date:    emptyToNull(formData.get("end_date")),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
  return { ok: true };
}

export async function deleteTrip(id: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  // Remove storage files for this trip first.
  const { data: docs } = await supabase
    .from("trip_documents")
    .select("storage_path")
    .eq("trip_id", id);
  const paths = (docs ?? []).map((d) => d.storage_path);
  if (paths.length) await supabase.storage.from("documents").remove(paths);

  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/trips");
  redirect("/trips");
}

export async function addTripMember(tripId: string, profileId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_members")
    .upsert({ trip_id: tripId, profile_id: profileId });
  if (error) return { error: error.message };
  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function removeTripMember(tripId: string, profileId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  await supabase
    .from("trip_members")
    .delete()
    .eq("trip_id", tripId)
    .eq("profile_id", profileId);
  revalidatePath(`/trips/${tripId}`);
}

export async function uploadTripDocument(tripId: string, formData: FormData) {
  const admin = await requireRole(["admin"]);
  const title = String(formData.get("title") ?? "").trim();
  const description = emptyToNull(formData.get("description"));
  const file = formData.get("file") as File | null;

  if (!title) return { error: "Titre requis." };
  if (!file || file.size === 0) return { error: "Fichier manquant." };
  if (file.size > MAX_BYTES) return { error: "Fichier trop volumineux (max 20 Mo)." };

  const supabase = await createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `trips/${tripId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase
    .storage.from("documents")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) return { error: upErr.message };

  const { error: dbErr } = await supabase.from("trip_documents").insert({
    trip_id: tripId,
    title,
    description,
    storage_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    created_by: admin.id,
  });
  if (dbErr) {
    await supabase.storage.from("documents").remove([path]);
    return { error: dbErr.message };
  }

  revalidatePath(`/trips/${tripId}`);
  return { ok: true };
}

export async function deleteTripDocument(tripId: string, docId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("trip_documents")
    .select("storage_path")
    .eq("id", docId)
    .single();
  if (doc) await supabase.storage.from("documents").remove([doc.storage_path]);
  await supabase.from("trip_documents").delete().eq("id", docId);
  revalidatePath(`/trips/${tripId}`);
}

export async function postTripMessage(
  tripId: string,
  body: string,
): Promise<{ message: TripMessage } | { error: string }> {
  const admin = await requireRole(["admin"]);
  const text = body.trim();
  if (!text) return { error: "Message vide." };
  if (text.length > 5000) return { error: "Message trop long (max 5000 caractères)." };

  const supabase = await createClient();
  const { data: message, error } = await supabase
    .from("trip_messages")
    .insert({ trip_id: tripId, body: text, created_by: admin.id })
    .select("*")
    .single();
  if (error || !message) return { error: error?.message ?? "Envoi impossible." };

  const { data: trip } = await supabase
    .from("trips").select("*").eq("id", tripId).single();
  if (trip) notifyNewTripMessage(trip, message as TripMessage).catch(() => {});

  revalidatePath(`/trips/${tripId}`);
  return { message: message as TripMessage };
}

export async function deleteTripMessage(tripId: string, messageId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  await supabase.from("trip_messages").delete().eq("id", messageId);
  revalidatePath(`/trips/${tripId}`);
}
