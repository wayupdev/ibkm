"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { uploadDocument } from "./actions";
import RecipientPicker, { type RecipientOption } from "@/components/recipient-picker";

export default function UploadDocumentForm({ people }: { people: RecipientOption[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recipientCount, setRecipientCount] = useState(0);

  const onSubmit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const res = await uploadDocument(formData);
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
    <form ref={formRef} action={onSubmit} className="card p-5 space-y-3">
      <div>
        <label className="label">Titre</label>
        <input name="title" required className="input" />
      </div>
      <div>
        <label className="label">Description (facultatif)</label>
        <textarea name="description" rows={2} className="input" />
      </div>
      <div>
        <label className="label">Fichier (PDF, image, etc.)</label>
        <input type="file" name="file" required accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" className="input" />
      </div>
      {recipientCount === 0 && (
        <div>
          <label className="label">Visibilité</label>
          <select name="audience" defaultValue="all" className="input">
            <option value="all">Tout le monde</option>
            <option value="parents">Parents uniquement</option>
            <option value="children">Jeunes uniquement</option>
          </select>
        </div>
      )}
      <RecipientPicker people={people} onSelectionChange={setRecipientCount} />
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
