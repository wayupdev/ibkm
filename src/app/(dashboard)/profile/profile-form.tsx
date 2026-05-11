"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "./actions";
import type { Profile } from "@/lib/types";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = (formData: FormData) => {
    setError(null); setSuccess(false);
    start(async () => {
      const res = await updateProfile(formData);
      if (res?.error) { setError(res.error); return; }
      setSuccess(true);
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="card p-6 space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Prénom</label>
          <input name="first_name" required defaultValue={profile.first_name} className="input" />
        </div>
        <div>
          <label className="label">Nom</label>
          <input name="last_name" required defaultValue={profile.last_name} className="input" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Téléphone</label>
          <input name="phone" defaultValue={profile.phone ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Date de naissance</label>
          <input type="date" name="birth_date" defaultValue={profile.birth_date ?? ""} className="input" />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="email_notifications" defaultChecked={profile.email_notifications} className="w-4 h-4" />
          <span className="text-sm">Recevoir les notifications par email</span>
        </label>
        {profile.role === "parent" && (
          <label className="flex items-center gap-2">
            <input type="checkbox" name="photo_consent" defaultChecked={profile.photo_consent} className="w-4 h-4" />
            <span className="text-sm">J'autorise la diffusion des photos de mon/mes enfant(s) sur la plateforme</span>
          </label>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Profil mis à jour.</p>}

      <div className="flex justify-between items-center pt-2">
        <a href="/rgpd" className="text-sm text-brand-500 font-semibold hover:underline">Mes droits RGPD</a>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
