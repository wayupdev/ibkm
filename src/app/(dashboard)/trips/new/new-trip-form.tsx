"use client";

import { useState, useTransition } from "react";
import { createTrip } from "../actions";

export default function NewTripForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    start(async () => {
      const res = await createTrip(formData);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <form action={onSubmit} className="card p-5 space-y-3 max-w-2xl">
      <div>
        <label className="label">Titre</label>
        <input name="title" required className="input" placeholder="Ex : Séjour été 2026 — Bretagne" />
      </div>
      <div>
        <label className="label">Description (facultatif)</label>
        <textarea
          name="description"
          rows={6}
          className="input"
          placeholder="Programme, horaires, infos pratiques, contacts utiles…"
        />
      </div>
      <div>
        <label className="label">Lieu (facultatif)</label>
        <input name="location" className="input" placeholder="Ex : Quiberon" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date de début</label>
          <input type="date" name="start_date" className="input" />
        </div>
        <div>
          <label className="label">Date de fin</label>
          <input type="date" name="end_date" className="input" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={pending} type="submit" className="btn-primary">
          {pending ? "Création…" : "Créer le séjour"}
        </button>
      </div>
    </form>
  );
}
