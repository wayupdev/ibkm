"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createFamily } from "./actions";

export default function NewFamilyForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onSubmit = (formData: FormData) => {
    setError(null);
    start(async () => {
      try {
        const res = await createFamily(formData);
        if (res?.error) { setError(res.error); return; }
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inattendue.");
      }
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Nouvelle famille
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/40"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div ref={dialogRef} className="card p-5 w-full max-w-md mt-12 sm:mt-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Nouvelle famille</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form action={onSubmit} className="space-y-3">
              <input
                name="name"
                required
                autoFocus
                placeholder="Nom de la famille (ex: Famille Martin)"
                className="input"
              />
              <textarea
                name="notes"
                placeholder="Notes (facultatif)"
                rows={2}
                className="input"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button disabled={pending} className="btn-primary">
                  {pending ? "…" : "Créer"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
