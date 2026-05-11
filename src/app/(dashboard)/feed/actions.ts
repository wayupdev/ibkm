"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { notifyNewAnnouncement } from "@/lib/notifications";

const schema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  audience: z.enum(["all", "parents", "children"]),
  pinned: z.string().optional(),
});

export async function createAnnouncement(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const parsed = schema.safeParse({
    title:    formData.get("title"),
    body:     formData.get("body"),
    audience: formData.get("audience"),
    pinned:   formData.get("pinned") ?? undefined,
  });
  if (!parsed.success) return { error: "Champs invalides." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("announcements").insert({
    title:    parsed.data.title,
    body:     parsed.data.body,
    audience: parsed.data.audience,
    pinned:   parsed.data.pinned === "on",
    created_by: profile.id,
  }).select().single();

  if (error) return { error: error.message };

  // Fire-and-forget email notifications
  notifyNewAnnouncement(data).catch(() => {});

  revalidatePath("/feed");
  return { ok: true };
}
