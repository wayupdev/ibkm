"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTrip } from "../actions";
import type { Trip } from "@/lib/types";

export default function EditTripForm({ trip }: { trip: Trip }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onSubmit = (formData: FormData) => {
    setError(null);
    setOk(false);
    start(async () => {
      const res = await updateTrip(trip.id, formData);
      if (res?.error) { setError(res.error); return; }
      setOk(true);
      router.refresh();
    });
  };

  return (
    <form action={onSubmit} className="space-y-3">
      <div>
        <label className="label">Titre</label>
        <input name="title" required defaultValue={trip.title} className="input" />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          name="description"
          rows={5}
          defaultValue={trip.description ?? ""}
          className="input"
        />
      </div>
      <div>
        <label className="label">Lieu</label>
        <input name="location" defaultValue={trip.location ?? ""} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date de début</label>
          <input type="date" name="start_date" defaultValue={trip.start_date ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Date de fin</label>
          <input type="date" name="end_date" defaultValue={trip.end_date ?? ""} className="input" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-green-600">Enregistré.</p>}
      <button disabled={pending} className="btn-primary">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
