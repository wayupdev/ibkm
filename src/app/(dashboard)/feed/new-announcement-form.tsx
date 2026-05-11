"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createAnnouncement } from "./actions";

export default function NewAnnouncementForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const res = await createAnnouncement(formData);
      if (res?.error) { setError(res.error); return; }
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Nouvelle annonce
      </button>
    );
  }

  return (
    <form action={onSubmit} className="card p-5 space-y-3">
      <div>
        <label className="label">Titre</label>
        <input name="title" required className="input" />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea name="body" required rows={4} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Destinataires</label>
          <select name="audience" defaultValue="all" className="input">
            <option value="all">Tout le monde</option>
            <option value="parents">Parents uniquement</option>
            <option value="children">Jeunes uniquement</option>
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2">
          <input type="checkbox" name="pinned" className="w-4 h-4" />
          <span className="text-sm">Épingler en haut</span>
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} type="submit" className="btn-primary">
          {pending ? "Publication…" : "Publier"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}
