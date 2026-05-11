"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTrip } from "../actions";

export default function DeleteTripButton({
  tripId,
  tripTitle,
}: { tripId: string; tripTitle: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-secondary text-red-600"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Supprimer le séjour « ${tripTitle} » ? Cette action est irréversible.`)) return;
        start(async () => { await deleteTrip(tripId); });
      }}
    >
      <Trash2 className="w-4 h-4" /> Supprimer
    </button>
  );
}
