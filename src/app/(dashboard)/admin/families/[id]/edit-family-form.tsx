"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateFamily } from "../actions";
import type { Family } from "@/lib/types";

export default function EditFamilyForm({ family }: { family: Family }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const res = await updateFamily(family.id, formData);
      if (res?.error) { setError(res.error); return; }
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="space-y-3">
      <div>
        <label className="label">Nom</label>
        <input name="name" defaultValue={family.name} required className="input" />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" defaultValue={family.notes ?? ""} rows={3} className="input" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "…" : "Enregistrer"}</button>
    </form>
  );
}
