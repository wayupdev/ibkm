"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { uploadPhoto } from "./actions";
import RecipientPicker, { type RecipientOption } from "@/components/recipient-picker";

export default function UploadPhotoForm({ people }: { people: RecipientOption[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recipientCount, setRecipientCount] = useState(0);

  const onSubmit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const res = await uploadPhoto(formData);
      if (res?.error) { setError(res.error); return; }
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <ImagePlus className="w-4 h-4" /> Ajouter une photo
      </button>
    );
  }

  return (
    <form ref={formRef} action={onSubmit} className="card p-5 space-y-3">
      <div>
        <label className="label">Légende (facultatif)</label>
        <input name="caption" className="input" />
      </div>
      <div>
        <label className="label">Image</label>
        <input type="file" name="file" required accept="image/*" className="input" />
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
      <p className="text-xs text-slate-500">
        Ne publiez que des photos pour lesquelles vous disposez du consentement
        de diffusion (mineurs : consentement parental requis).
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} type="submit" className="btn-primary">
          {pending ? "Téléversement…" : "Publier"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}
