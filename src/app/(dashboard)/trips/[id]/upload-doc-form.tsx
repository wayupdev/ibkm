"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { uploadTripDocument } from "../actions";

export default function UploadTripDocForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const res = await uploadTripDocument(tripId, formData);
      if (res?.error) { setError(res.error); return; }
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Upload className="w-4 h-4" /> Téléverser un document
      </button>
    );
  }

  return (
    <form ref={formRef} action={onSubmit} className="space-y-3">
      <div>
        <label className="label">Titre</label>
        <input name="title" required className="input" />
      </div>
      <div>
        <label className="label">Description (facultatif)</label>
        <textarea name="description" rows={2} className="input" />
      </div>
      <div>
        <label className="label">Fichier</label>
        <input
          type="file"
          name="file"
          required
          accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
          className="input"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} type="submit" className="btn-primary">
          {pending ? "Téléversement…" : "Envoyer"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}
