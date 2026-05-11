"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addTripMember } from "../actions";

type ProfileOption = { id: string; first_name: string; last_name: string; role: string };

export default function AddMemberForm({
  tripId,
  profiles,
}: { tripId: string; profiles: ProfileOption[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    const profileId = String(formData.get("profile_id") ?? "");
    if (!profileId) return;
    setError(null);
    start(async () => {
      const res = await addTripMember(tripId, profileId);
      if (res?.error) { setError(res.error); return; }
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="flex flex-col sm:flex-row gap-2">
      <select name="profile_id" required className="input flex-1">
        <option value="">Ajouter une personne…</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.first_name} {p.last_name} — {p.role}
          </option>
        ))}
      </select>
      <button className="btn-primary" disabled={pending || profiles.length === 0}>
        <Plus className="w-4 h-4" /> Ajouter
      </button>
      {error && <p className="text-sm text-red-600 mt-2 w-full">{error}</p>}
    </form>
  );
}
