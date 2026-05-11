"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

const schema = z.object({
  first_name: z.string().min(1).max(100),
  last_name:  z.string().min(1).max(100),
  email:      z.string().email(),
  role:       z.enum(["admin", "parent", "child"]),
  phone:      z.string().max(40).optional().nullable(),
});

function generateTempPassword() {
  // 12 chars, mixed
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let out = "";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function createUser(formData: FormData) {
  await requireRole(["admin"]);
  const parsed = schema.safeParse({
    first_name: formData.get("first_name"),
    last_name:  formData.get("last_name"),
    email:      formData.get("email"),
    role:       formData.get("role"),
    phone:      String(formData.get("phone") ?? "").trim() || null,
  });
  if (!parsed.success) return { error: "Champs invalides." };

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
    },
  });
  if (error || !created.user) return { error: error?.message ?? "Création impossible." };

  const { error: profErr } = await admin.from("profiles").insert({
    id: created.user.id,
    role: parsed.data.role,
    first_name: parsed.data.first_name,
    last_name:  parsed.data.last_name,
    phone:      parsed.data.phone,
  });
  if (profErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profErr.message };
  }

  revalidatePath("/admin/users");
  return { ok: true, tempPassword };
}

export async function resetPassword(userId: string) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const tempPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: tempPassword });
  if (error) return { error: error.message };
  return { ok: true, tempPassword };
}

export async function deleteUser(userId: string) {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
